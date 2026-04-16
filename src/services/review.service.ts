import { db } from "@/lib/db";
import { reviews, kitchens, orders, platformReviews, notifications } from "@/lib/db/schema";
import { eq, and, desc, asc, sql, isNull } from "drizzle-orm";
import type { 
    CreateKitchenReviewInput, 
    CreatePlatformReviewInput, 
    ReviewQueryInput 
} from "@/lib/validations/review";
import { NotFoundError, ConflictError, ValidationError, AuthorizationError } from "@/lib/utils/errors";
import { invalidateCache, CacheKeys } from "@/lib/redis";
import { sanitizeText } from "@/lib/utils/sanitize";

// ─── Create Kitchen Review ──────────────────────────────────────────────────

export async function createKitchenReview(userId: string, input: CreateKitchenReviewInput) {
    // 1. Order exists + belongs to userId
    const order = await db.query.orders.findFirst({
        where: and(
            eq(orders.id, input.orderId),
            eq(orders.customerId, userId)
        )
    });

    if (!order) throw new AuthorizationError("Order not found or does not belong to you");

    // 2. Order status === 'COMPLETED'
    if (order.status !== 'COMPLETED') {
        throw new AuthorizationError("You can only review completed orders");
    }

    // 3. Order kitchenId matches data.kitchenId
    if (order.kitchenId !== input.kitchenId) {
        throw new ValidationError("Order does not belong to this kitchen");
    }

    // 4. No existing review
    const existing = await db.query.reviews.findFirst({
        where: and(
            eq(reviews.userId, userId),
            eq(reviews.kitchenId, input.kitchenId),
            isNull(reviews.deletedAt)
        ),
    });

    if (existing) {
        throw new ConflictError("You have already reviewed this kitchen");
    }

    // 5. Kitchen exists and isVisible/Active
    const kitchen = await db.query.kitchens.findFirst({
        where: and(eq(kitchens.id, input.kitchenId), isNull(kitchens.deletedAt)),
    });

    if (!kitchen) throw new NotFoundError("Kitchen");

    if (kitchen.ownerId === userId) {
        throw new ValidationError("You cannot review your own kitchen");
    }

    // INSERT review with isVerifiedPurchase = true
    const sanitizedComment = input.comment ? sanitizeText(input.comment) : input.comment;
    const [review] = await db
        .insert(reviews)
        .values({
            kitchenId: input.kitchenId,
            userId,
            rating: input.rating,
            comment: sanitizedComment,
            isVerifiedPurchase: true, // Verification passed
        })
        .returning();

    // UPDATE kitchen avgRating and reviewCount
    await recalculateKitchenRating(input.kitchenId);

    // Invalidate Redis cache
    await invalidateCache(CacheKeys.kitchenProfile(input.kitchenId));

    return review;
}

// ─── Create Platform Review ─────────────────────────────────────────────────

export async function createPlatformReview(userId: string, input: CreatePlatformReviewInput) {
    const existing = await db.query.platformReviews.findFirst({
        where: eq(platformReviews.userId, userId)
    });

    if (existing) {
        throw new ConflictError("You have already reviewed Smart Tiffin");
    }

    const sanitizedComment = input.comment ? sanitizeText(input.comment) : input.comment;

    const [review] = await db.insert(platformReviews).values({
        userId,
        rating: input.rating,
        comment: sanitizedComment,
    }).returning();

    await invalidateCache('platform:review:stats');

    return review;
}

// ─── Get Platform Review Stats ──────────────────────────────────────────────

export async function getPlatformReviewStats() {
    const [stats] = await db.select({
        avg: sql<number>`COALESCE(AVG(${platformReviews.rating}), 0)`,
        count: sql<number>`COUNT(*)`,
    }).from(platformReviews).where(eq(platformReviews.isVisible, true));

    const totalReviews = Number(stats.count);
    const averageRating = Number(stats.avg.toFixed(1));

    const rawBreakdown = await db.select({
        rating: platformReviews.rating,
        count: sql<number>`COUNT(*)`
    })
    .from(platformReviews)
    .where(eq(platformReviews.isVisible, true))
    .groupBy(platformReviews.rating);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of rawBreakdown) {
        breakdown[row.rating as keyof typeof breakdown] = Number(row.count);
    }

    const recentReviews = await db.query.platformReviews.findMany({
        where: eq(platformReviews.isVisible, true),
        orderBy: [desc(platformReviews.createdAt)],
        limit: 5,
        with: {
            user: { columns: { name: true, avatarUrl: true } }
        }
    });

    return {
        averageRating,
        totalReviews,
        breakdown,
        recentReviews
    };
}

// ─── Get Kitchen Review Stats ───────────────────────────────────────────────

export async function getKitchenReviewStats(kitchenId: string) {
    const conditions = [
        eq(reviews.kitchenId, kitchenId),
        eq(reviews.isVisible, true),
        isNull(reviews.deletedAt),
    ];

    const [stats] = await db.select({
        avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
        count: sql<number>`COUNT(*)`,
    }).from(reviews).where(and(...conditions));

    const totalReviews = Number(stats.count);
    const averageRating = Number(stats.avg.toFixed(1));

    const rawBreakdown = await db.select({
        rating: reviews.rating,
        count: sql<number>`COUNT(*)`
    })
    .from(reviews)
    .where(and(...conditions))
    .groupBy(reviews.rating);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of rawBreakdown) {
        breakdown[row.rating as keyof typeof breakdown] = Number(row.count);
    }

    const [verifiedCountData] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(reviews)
        .where(and(...conditions, eq(reviews.isVerifiedPurchase, true)));

    const verifiedCount = Number(verifiedCountData.count);

    return {
        averageRating,
        totalReviews,
        breakdown,
        verifiedCount
    };
}

// ─── Get Kitchen Reviews (Public) ───────────────────────────────────────────

export async function getKitchenReviews(
    kitchenId: string,
    query: ReviewQueryInput
) {
    const { page, limit, sort } = query;
    const offset = (page - 1) * limit;

    const orderBy =
        sort === "oldest"
            ? [asc(reviews.createdAt)]
            : sort === "highest"
                ? [desc(reviews.rating)]
                : sort === "lowest"
                    ? [asc(reviews.rating)]
                    : [desc(reviews.createdAt)]; // default: newest

    const conditions = [
        eq(reviews.kitchenId, kitchenId),
        eq(reviews.isVisible, true),
        isNull(reviews.deletedAt),
    ];

    const [data, countResult] = await Promise.all([
        db.query.reviews.findMany({
            where: and(...conditions),
            orderBy,
            limit,
            offset,
            with: {
                user: {
                    columns: { id: true, name: true, avatarUrl: true },
                },
            },
        }),
        db
            .select({ count: sql<number>`count(*)` })
            .from(reviews)
            .where(and(...conditions)),
    ]);

    return {
        reviews: data,
        total: Number(countResult[0].count),
        page,
        limit,
    };
}

// ─── Soft Delete Review (Admin only) ────────────────────────────────────────

export async function deleteReview(reviewId: string) {
    const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
    });

    if (!review) throw new NotFoundError("Review");

    const [deleted] = await db
        .update(reviews)
        .set({ deletedAt: new Date(), isVisible: false, updatedAt: new Date() })
        .where(eq(reviews.id, reviewId))
        .returning();

    await recalculateKitchenRating(review.kitchenId);
    await invalidateCache(CacheKeys.kitchenProfile(review.kitchenId));

    return deleted;
}

// ─── Flag Review ────────────────────────────────────────────────────────────

export async function flagReview(reviewId: string, reason: string) {
    const [flagged] = await db
        .update(reviews)
        .set({ isFlagged: true, flagReason: reason, updatedAt: new Date() })
        .where(eq(reviews.id, reviewId))
        .returning();

    if (!flagged) throw new NotFoundError("Review");
    return flagged;
}

// ─── Recalculate Kitchen Rating ─────────────────────────────────────────────

async function recalculateKitchenRating(kitchenId: string) {
    const result = await db
        .select({
            avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
            count: sql<number>`COUNT(*)`,
        })
        .from(reviews)
        .where(
            and(
                eq(reviews.kitchenId, kitchenId),
                eq(reviews.isVisible, true),
                isNull(reviews.deletedAt)
            )
        );

    const avgRating = Number(result[0].avg);
    const newAvg = avgRating % 1 !== 0 ? avgRating.toFixed(2) : avgRating.toFixed(1);

    await db
        .update(kitchens)
        .set({
            avgRating: String(newAvg),
            reviewCount: Number(result[0].count),
            updatedAt: new Date(),
        })
        .where(eq(kitchens.id, kitchenId));
}

// ─── Seller Reply to Review ─────────────────────────────────────────────────

export async function addSellerReply(
    reviewId: string,
    kitchenOwnerId: string,
    reply: string
) {
    const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
    });

    if (!review) throw new NotFoundError("Review");

    const kitchen = await db.query.kitchens.findFirst({
        where: eq(kitchens.id, review.kitchenId),
    });

    if (!kitchen || kitchen.ownerId !== kitchenOwnerId) {
        throw new AuthorizationError("You do not own this kitchen");
    }

    if (review.sellerReply !== null) {
        throw new ConflictError("You have already replied to this review");
    }

    const sanitizedReply = sanitizeText(reply);

    const [updated] = await db
        .update(reviews)
        .set({
            sellerReply: sanitizedReply,
            sellerRepliedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(reviews.id, reviewId))
        .returning();

    await db.insert(notifications).values({
        userId: review.userId,
        type: "REVIEW_REPLY",
        title: "The cook replied to your review",
        body: `The cook at ${kitchen.name} replied to your review.`,
        link: `/kitchen/${kitchen.slug}#reviews`,
    });

    await invalidateCache(CacheKeys.kitchenProfile(review.kitchenId));

    return updated;
}

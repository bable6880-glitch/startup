import { db } from "@/lib/db";
import { reviews, kitchens, orders } from "@/lib/db/schema";
import { eq, and, desc, asc, sql, isNull } from "drizzle-orm";
import type { CreateReviewInput, ReviewQueryInput } from "@/lib/validations/review";
import { NotFoundError, ConflictError, ValidationError } from "@/lib/utils/errors";
import { invalidateCache, CacheKeys } from "@/lib/redis";

// ─── Create Review ──────────────────────────────────────────────────────────

export async function createReview(userId: string, input: CreateReviewInput) {
    // 1. Verify kitchen exists
    const kitchen = await db.query.kitchens.findFirst({
        where: and(eq(kitchens.id, input.kitchenId), isNull(kitchens.deletedAt)),
    });

    if (!kitchen) throw new NotFoundError("Kitchen");

    // 2. Check if user already reviewed this kitchen
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

    // 3. Don't let kitchen owner review their own kitchen
    if (kitchen.ownerId === userId) {
        throw new ValidationError("You cannot review your own kitchen");
    }

    // 3.5 Check for verified purchase
    const completedOrder = await db.query.orders.findFirst({
        where: and(
            eq(orders.customerId, userId),
            eq(orders.kitchenId, input.kitchenId),
            eq(orders.status, "COMPLETED")
        ),
    });
    const isVerifiedPurchase = completedOrder !== undefined;

    // 4. Create review
    const [review] = await db
        .insert(reviews)
        .values({
            kitchenId: input.kitchenId,
            userId,
            rating: input.rating,
            comment: input.comment,
            isVerifiedPurchase,
        })
        .returning();

    // 5. Update kitchen aggregate rating
    await recalculateKitchenRating(input.kitchenId);

    // 6. Invalidate cache
    await invalidateCache(CacheKeys.kitchenProfile(input.kitchenId));

    return review;
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

    // Recalculate rating
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

    await db
        .update(kitchens)
        .set({
            avgRating: result[0].avg.toFixed(2),
            reviewCount: Number(result[0].count),
            updatedAt: new Date(),
        })
        .where(eq(kitchens.id, kitchenId));
}

// ─── Seller Reply to Review (U4a) ──────────────────────────────────────────

export async function addSellerReply(
    reviewId: string,
    kitchenOwnerId: string,
    reply: string
) {
    const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
    });

    if (!review) throw new NotFoundError("Review");

    // Verify the kitchen owner
    const kitchen = await db.query.kitchens.findFirst({
        where: eq(kitchens.id, review.kitchenId),
    });

    if (!kitchen || kitchen.ownerId !== kitchenOwnerId) {
        throw new NotFoundError("You do not own this kitchen");
    }

    const [updated] = await db
        .update(reviews)
        .set({
            sellerReply: reply,
            sellerRepliedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(reviews.id, reviewId))
        .returning();

    await invalidateCache(CacheKeys.kitchenProfile(review.kitchenId));

    return updated;
}


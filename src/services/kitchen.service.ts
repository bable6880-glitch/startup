import { db } from "@/lib/db";
import { kitchens } from "@/lib/db/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { slugify } from "@/config/constants";
import { cached, invalidateCache, CacheKeys, CacheTTL } from "@/lib/redis";
import { sanitizeRichText } from "@/lib/utils/sanitize";
import type { CreateKitchenInput, UpdateKitchenInput, KitchenQueryInput } from "@/lib/validations/kitchen";
import { NotFoundError, AuthorizationError } from "@/lib/utils/errors";

// CHANGED: Removed role update from createKitchen — role escalation is now
// handled in the API route (POST /api/kitchens) with compensation logic.

export async function createKitchen(ownerId: string, input: CreateKitchenInput) {
    // Generate unique slug
    let slug = slugify(input.name);
    const existingSlug = await db.query.kitchens.findFirst({
        where: eq(kitchens.slug, slug),
    });
    if (existingSlug) {
        slug = `${slug}-${Date.now().toString(36)}`;
    }

    const sanitizedDescription = input.description ? sanitizeRichText(input.description) : input.description;

    const [kitchen] = await db
        .insert(kitchens)
        .values({
            ownerId,
            name: input.name,
            slug,
            description: sanitizedDescription,
            profileImageUrl: input.profileImageUrl,
            coverImageUrl: input.coverImageUrl,
            images: input.images,
            addressLine: input.addressLine,
            city: input.city,
            citySlug: slugify(input.city),
            area: input.area,
            areaSlug: input.area ? slugify(input.area) : null,
            state: input.state,
            country: input.country,
            postalCode: input.postalCode,
            latitude: input.latitude?.toString(),
            longitude: input.longitude?.toString(),
            contactPhone: input.contactPhone,
            contactWhatsapp: input.contactWhatsapp,
            contactEmail: input.contactEmail,
            cuisineTypes: input.cuisineTypes,
            dietaryTags: input.dietaryTags,
        })
        .returning();

    // Invalidate city cache
    await invalidateCache(CacheKeys.kitchensByCity(slugify(input.city)));

    return kitchen;
}

// ─── Get Kitchen by ID ──────────────────────────────────────────────────────

export async function getKitchenById(kitchenId: string) {
    return cached(
        CacheKeys.kitchenProfile(kitchenId),
        CacheTTL.KITCHEN_PROFILE,
        async () => {
            const kitchen = await db.query.kitchens.findFirst({
                where: and(eq(kitchens.id, kitchenId), isNull(kitchens.deletedAt)),
                with: {
                    owner: {
                        columns: { id: true, name: true, avatarUrl: true },
                    },
                },
            });

            if (!kitchen) {
                console.error(`[Kitchen Service] Kitchen not found for ID: ${kitchenId}`);
                throw new NotFoundError("Kitchen");
            }
            return kitchen;
        }
    );
}

// ─── Get Kitchen by Slug ────────────────────────────────────────────────────

export async function getKitchenBySlug(slug: string) {
    const kitchen = await db.query.kitchens.findFirst({
        where: and(eq(kitchens.slug, slug), isNull(kitchens.deletedAt)),
        with: {
            owner: {
                columns: { id: true, name: true, avatarUrl: true },
            },
        },
    });

    if (!kitchen) throw new NotFoundError("Kitchen");
    return kitchen;
}

// ─── List Kitchens (Public) ─────────────────────────────────────────────────

export async function listKitchens(query: KitchenQueryInput) {
    const { city, area, cuisine, dietary, minRating, sort, page, limit } = query;

    const conditions = [
        eq(kitchens.status, "ACTIVE"),
        isNull(kitchens.deletedAt),
    ];

    if (city) conditions.push(eq(kitchens.citySlug, slugify(city)));
    if (area) conditions.push(eq(kitchens.areaSlug, slugify(area)));
    if (cuisine) {
        conditions.push(sql`${kitchens.cuisineTypes} @> ARRAY[${cuisine}]`);
    }
    if (dietary) {
        conditions.push(sql`${kitchens.dietaryTags} @> ARRAY[${dietary}]`);
    }
    if (minRating) {
        conditions.push(sql`${kitchens.avgRating} >= ${minRating}`);
    }

    // Sort order
    const orderBy =
        sort === "rating"
            ? [desc(kitchens.avgRating)]
            : sort === "newest"
                ? [desc(kitchens.createdAt)]
                : [desc(kitchens.boostPriority), desc(kitchens.avgRating)]; // default: boost

    const offset = (page - 1) * limit;

    const data = await db.query.kitchens.findMany({
        where: and(...conditions),
        orderBy,
        limit,
        offset,
        columns: {
            // Exclude sensitive fields from public listing
            contactPhone: false,
            contactWhatsapp: false,
            contactEmail: false,
            deletedAt: false,
        },
        with: {
            owner: {
                columns: { id: true, name: true, avatarUrl: true },
            },
        },
    });

    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(kitchens)
        .where(and(...conditions));

    return {
        kitchens: data,
        total: Number(countResult[0].count),
        page,
        limit,
    };
}

// ─── Update Kitchen ─────────────────────────────────────────────────────────

export async function updateKitchen(
    kitchenId: string,
    ownerId: string,
    input: UpdateKitchenInput
) {
    const kitchen = await db.query.kitchens.findFirst({
        where: eq(kitchens.id, kitchenId),
    });

    if (!kitchen) throw new NotFoundError("Kitchen");
    if (kitchen.ownerId !== ownerId) throw new AuthorizationError("You don't own this kitchen");

    const updateData: Record<string, unknown> = { ...input, updatedAt: new Date() };

    if (input.description) {
        updateData.description = sanitizeRichText(input.description);
    }

    // Recalculate slugs if city or area changed
    if (input.city) updateData.citySlug = slugify(input.city);
    if (input.area) updateData.areaSlug = slugify(input.area);

    const [updated] = await db
        .update(kitchens)
        .set(updateData)
        .where(eq(kitchens.id, kitchenId))
        .returning();

    // Invalidate caches
    await invalidateCache(CacheKeys.kitchenProfile(kitchenId));
    if (kitchen.citySlug) await invalidateCache(CacheKeys.kitchensByCity(kitchen.citySlug));

    return updated;
}

// ─── Soft Delete Kitchen ────────────────────────────────────────────────────

export async function deleteKitchen(kitchenId: string, userId: string, userRole: string) {
    const kitchen = await db.query.kitchens.findFirst({
        where: eq(kitchens.id, kitchenId),
    });

    if (!kitchen) throw new NotFoundError("Kitchen");
    if (kitchen.ownerId !== userId && userRole !== "ADMIN") {
        throw new AuthorizationError("You don't own this kitchen");
    }

    const [deleted] = await db
        .update(kitchens)
        .set({ deletedAt: new Date(), status: "INACTIVE", updatedAt: new Date() })
        .where(eq(kitchens.id, kitchenId))
        .returning();

    // Invalidate caches
    await invalidateCache(CacheKeys.kitchenProfile(kitchenId));
    if (kitchen.citySlug) await invalidateCache(CacheKeys.kitchensByCity(kitchen.citySlug));

    return deleted;
}

// ─── Get Cook's Kitchens ────────────────────────────────────────────────────

export async function getKitchensByOwner(ownerId: string) {
    return db.query.kitchens.findMany({
        where: and(eq(kitchens.ownerId, ownerId), isNull(kitchens.deletedAt)),
        orderBy: [desc(kitchens.createdAt)],
    });
}

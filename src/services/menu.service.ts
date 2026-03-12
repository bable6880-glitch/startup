import { db } from "@/lib/db";
import { meals, kitchens } from "@/lib/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { cached, invalidateCache, CacheKeys, CacheTTL } from "@/lib/redis";
import type { CreateMealInput, UpdateMealInput } from "@/lib/validations/menu";
import { NotFoundError, AuthorizationError } from "@/lib/utils/errors";
import { sanitizeRichText } from "@/lib/utils/sanitize";

// ─── Verify Kitchen Ownership ───────────────────────────────────────────────

async function verifyKitchenOwner(kitchenId: string, userId: string) {
    const kitchen = await db.query.kitchens.findFirst({
        where: eq(kitchens.id, kitchenId),
        columns: { id: true, ownerId: true },
    });

    if (!kitchen) throw new NotFoundError("Kitchen");
    if (kitchen.ownerId !== userId) {
        throw new AuthorizationError("You don't own this kitchen");
    }

    return kitchen;
}

// ─── Create Meal ────────────────────────────────────────────────────────────

export async function createMeal(
    kitchenId: string,
    userId: string,
    input: CreateMealInput
) {
    await verifyKitchenOwner(kitchenId, userId);

    const sanitizedDescription = input.description ? sanitizeRichText(input.description) : input.description;

    const [meal] = await db
        .insert(meals)
        .values({
            kitchenId,
            name: input.name,
            description: sanitizedDescription,
            price: input.price,
            currency: input.currency,
            imageUrl: input.imageUrl,
            images: input.images,
            category: input.category,
            cuisineType: input.cuisineType,
            dietaryTags: input.dietaryTags,
            isAvailable: input.isAvailable,
            availableDays: input.availableDays,
            servingTime: input.servingTime,
            calories: input.calories,
            servingSize: input.servingSize,
            sortOrder: input.sortOrder,
        })
        .returning();

    await invalidateCache(CacheKeys.kitchenMenu(kitchenId));

    return meal;
}

// ─── Get Meals by Kitchen (Public) ──────────────────────────────────────────

export async function getMealsByKitchen(kitchenId: string) {
    return cached(
        CacheKeys.kitchenMenu(kitchenId),
        CacheTTL.KITCHEN_MENU,
        async () => {
            return db.query.meals.findMany({
                where: and(
                    eq(meals.kitchenId, kitchenId),
                    isNull(meals.deletedAt)
                ),
                orderBy: [asc(meals.sortOrder), asc(meals.name)],
            });
        }
    );
}

// ─── Get Single Meal ────────────────────────────────────────────────────────

export async function getMealById(mealId: string) {
    const meal = await db.query.meals.findFirst({
        where: and(eq(meals.id, mealId), isNull(meals.deletedAt)),
    });

    if (!meal) throw new NotFoundError("Meal");
    return meal;
}

// ─── Update Meal ────────────────────────────────────────────────────────────

export async function updateMeal(
    kitchenId: string,
    mealId: string,
    userId: string,
    input: UpdateMealInput
) {
    await verifyKitchenOwner(kitchenId, userId);

    const meal = await db.query.meals.findFirst({
        where: and(eq(meals.id, mealId), eq(meals.kitchenId, kitchenId)),
    });

    if (!meal) throw new NotFoundError("Meal");

    const updateData: Record<string, unknown> = { ...input, updatedAt: new Date() };
    if (input.description) {
        updateData.description = sanitizeRichText(input.description);
    }

    const [updated] = await db
        .update(meals)
        .set(updateData)
        .where(eq(meals.id, mealId))
        .returning();

    await invalidateCache(CacheKeys.kitchenMenu(kitchenId));

    return updated;
}

// ─── Soft Delete Meal ───────────────────────────────────────────────────────

export async function deleteMeal(
    kitchenId: string,
    mealId: string,
    userId: string
) {
    await verifyKitchenOwner(kitchenId, userId);

    const meal = await db.query.meals.findFirst({
        where: and(eq(meals.id, mealId), eq(meals.kitchenId, kitchenId)),
    });

    if (!meal) throw new NotFoundError("Meal");

    const [deleted] = await db
        .update(meals)
        .set({ deletedAt: new Date(), isAvailable: false, updatedAt: new Date() })
        .where(eq(meals.id, mealId))
        .returning();

    await invalidateCache(CacheKeys.kitchenMenu(kitchenId));

    return deleted;
}

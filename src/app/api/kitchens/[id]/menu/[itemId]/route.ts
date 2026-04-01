import { NextRequest } from "next/server";
import { updateMealSchema } from "@/lib/validations/menu";
import { updateMeal, deleteMeal, getMealById } from "@/services/menu.service";
import {
    apiSuccess,
    apiBadRequest,
    apiUnauthorized,
    apiForbidden,
    apiNotFound,
    apiInternalError,
} from "@/lib/utils/api-response";
import { requireSeller } from "@/lib/auth/seller-guard";
import { AppError } from "@/lib/utils/errors";

type Params = { params: Promise<{ id: string; itemId: string }> };

/**
 * GET /api/kitchens/[id]/menu/[itemId]
 * Public: Get a single meal.
 */
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { itemId } = await params;
        const meal = await getMealById(itemId);
        return apiSuccess(meal);
    } catch (error) {
        if (error instanceof AppError && error.statusCode === 404) {
            return apiNotFound("Meal not found");
        }
        console.error("[Get Meal Error]", error);
        return apiInternalError("Failed to fetch meal");
    }
}

/**
 * PUT /api/kitchens/[id]/menu/[itemId]
 * Auth required (Owner): Update a meal.
 */
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id, itemId } = await params;
        const guard = await requireSeller(request, id);
        if (!guard.ok) return guard.response;
        const { user } = guard;
        const body = await request.json();
        const parsed = updateMealSchema.safeParse(body);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
            return apiBadRequest("Invalid meal data", errors);
        }

        const meal = await updateMeal(id, itemId, user.id, parsed.data);
        return apiSuccess(meal);
    } catch (error) {
        if (error instanceof AppError) {
            if (error.statusCode === 404) return apiNotFound(error.message);
            if (error.statusCode === 403) return apiForbidden(error.message);
        }
        console.error("[Update Meal Error]", error);
        return apiInternalError("Failed to update meal");
    }
}

/**
 * DELETE /api/kitchens/[id]/menu/[itemId]
 * Auth required (Owner): Soft delete a meal.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id, itemId } = await params;
        const guard = await requireSeller(request, id);
        if (!guard.ok) return guard.response;
        const { user } = guard;
        await deleteMeal(id, itemId, user.id);
        return apiSuccess({ deleted: true });
    } catch (error) {
        if (error instanceof AppError) {
            if (error.statusCode === 404) return apiNotFound(error.message);
            if (error.statusCode === 403) return apiForbidden(error.message);
        }
        console.error("[Delete Meal Error]", error);
        return apiInternalError("Failed to delete meal");
    }
}

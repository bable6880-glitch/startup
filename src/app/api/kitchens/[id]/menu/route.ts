import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { createMealSchema } from "@/lib/validations/menu";
import { createMeal, getMealsByKitchen } from "@/services/menu.service";
import {
    apiSuccess,
    apiCreated,
    apiBadRequest,
    apiUnauthorized,
    apiForbidden,
    apiInternalError,
} from "@/lib/utils/api-response";
import { requireSeller } from "@/lib/auth/seller-guard";
import { AppError } from "@/lib/utils/errors";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/kitchens/[id]/menu
 * Public: List all meals for a kitchen.
 */
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const meals = await getMealsByKitchen(id);

        const hash = createHash("sha256").update(JSON.stringify(meals)).digest("hex").substring(0, 16);
        const etag = `"${hash}"`;
        const ifNoneMatch = request.headers.get("if-none-match");

        if (ifNoneMatch === etag) {
            return new Response(null, { status: 304 });
        }

        const response = apiSuccess(meals);
        response.headers.set("ETag", etag);
        return response;
    } catch (error) {
        console.error("[List Meals Error]", error);
        return apiInternalError("Failed to fetch meals");
    }
}

/**
 * POST /api/kitchens/[id]/menu
 * Auth required (Owner): Add a meal to the menu.
 */
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const guard = await requireSeller(request, id);
        if (!guard.ok) return guard.response;
        
        const { user } = guard;
        const body = await request.json();
        const parsed = createMealSchema.safeParse(body);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
            return apiBadRequest("Invalid meal data", errors);
        }

        const meal = await createMeal(id, user.id, parsed.data);
        return apiCreated(meal);
    } catch (error) {
        if (error instanceof AppError) {
            if (error.statusCode === 404) return apiBadRequest(error.message);
            if (error.statusCode === 403) return apiForbidden(error.message);
        }
        console.error("[Create Meal Error]", error);
        return apiInternalError("Failed to create meal");
    }
}

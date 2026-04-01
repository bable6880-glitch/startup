import { NextRequest } from "next/server";
import { kitchenQuerySchema } from "@/lib/validations/kitchen";
import { listKitchens } from "@/services/kitchen.service";
import {
    apiPaginated,
    apiBadRequest,
    apiInternalError,
} from "@/lib/utils/api-response";

// MVP: haversine filter runs in-memory after DB fetch.
// Acceptable at current kitchen count per city (<500).
// TODO P6: Replace with PostGIS ST_DWithin query for scale.
import { calculateDistance } from "@/lib/utils/distance";

/**
 * GET /api/search
 * Public: Full search with all filters.
 * Query params: city, area, cuisine, dietary, minRating, maxPrice, sort, page, limit
 */
export async function GET(request: NextRequest) {
    try {
        const params = Object.fromEntries(request.nextUrl.searchParams);
        const parsed = kitchenQuerySchema.safeParse(params);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
            return apiBadRequest("Invalid search parameters", errors);
        }

        const result = await listKitchens(parsed.data);

        if (parsed.data.lat !== undefined && parsed.data.lng !== undefined) {
            const { lat, lng, radiusKm } = parsed.data;
            const filteredKitchens = [];
            for (const k of result.kitchens) {
                if (k.latitude && k.longitude) {
                    const dist = calculateDistance(lat, lng, Number(k.latitude), Number(k.longitude));
                    if (dist <= radiusKm) {
                        filteredKitchens.push({ ...k, distanceKm: dist });
                    }
                }
            }
            filteredKitchens.sort((a, b) => a.distanceKm - b.distanceKm);
            result.kitchens = filteredKitchens;
            result.total = filteredKitchens.length;
        }

        return apiPaginated(result.kitchens, {
            page: result.page,
            limit: result.limit,
            total: result.total,
        });
    } catch (error) {
        console.error("[Search Error]", error);
        return apiInternalError("Search failed");
    }
}

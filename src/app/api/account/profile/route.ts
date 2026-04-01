import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest, apiInternalError } from "@/lib/utils/api-response";
import { sanitizeText } from "@/lib/utils/sanitize";

// GET /api/account/profile
export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        if (!user) return apiUnauthorized();

        const [profile] = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                defaultCity: users.defaultCity,
                defaultAddress: users.defaultAddress,
                role: users.role,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        if (!profile) return apiNotFound("User not found");

        // Count stats via sequential parameterized queries (neon-http: no transactions)
        const orderRows = await db.execute(
            sql`SELECT COUNT(*) as count FROM orders WHERE customer_id = ${user.id}`
        );
        const reviewRows = await db.execute(
            sql`SELECT COUNT(*) as count FROM reviews WHERE user_id = ${user.id}`
        );
        const kitchenRows = await db.execute(
            sql`SELECT COUNT(DISTINCT kitchen_id) as count FROM orders WHERE customer_id = ${user.id}`
        );

        const totalOrders = Number((orderRows.rows[0] as { count: string }).count);
        const totalReviews = Number((reviewRows.rows[0] as { count: string }).count);
        const kitchensTried = Number((kitchenRows.rows[0] as { count: string }).count);

        return apiSuccess({
            ...profile,
            totalOrders,
            totalReviews,
            kitchensTried,
        });
    } catch (err) {
        console.error("[GET /api/account/profile]", err);
        return apiInternalError();
    }
}

// PUT /api/account/profile
export async function PUT(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        if (!user) return apiUnauthorized();

        const body = await req.json();
        const { name, phone, defaultCity, defaultAddress } = body;

        // Basic validation
        if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
            return apiBadRequest("Name must be at least 2 characters");
        }

        // Sanitize all user-supplied text before DB insert (Rule #8)
        const updateData: Record<string, string> = {};
        if (name !== undefined) updateData.name = sanitizeText(name.trim());
        if (phone !== undefined) updateData.phone = sanitizeText(phone);
        if (defaultCity !== undefined) updateData.defaultCity = sanitizeText(defaultCity);
        if (defaultAddress !== undefined) updateData.defaultAddress = sanitizeText(defaultAddress);

        if (Object.keys(updateData).length === 0) {
            return apiBadRequest("No fields to update");
        }

        await db.update(users).set(updateData).where(eq(users.id, user.id));

        return apiSuccess({ message: "Profile updated successfully" });
    } catch (err) {
        console.error("[PUT /api/account/profile]", err);
        return apiInternalError();
    }
}
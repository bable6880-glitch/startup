import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiUnauthorized, apiNotFound, apiBadRequest, apiInternalError } from "@/lib/utils/api-response";

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
                phoneNumber: users.phoneNumber,
                defaultCity: users.defaultCity,
                defaultAddress: users.defaultAddress,
                role: users.role,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        if (!profile) return apiNotFound("User not found");

        // Count stats via raw queries (no heavy joins needed)
        const { orders, reviews } = await db.transaction(async (tx) => {
            // total orders placed by this customer
            const orderRows = await tx.execute(
                `SELECT COUNT(*) as count FROM orders WHERE customer_id = '${user.id}'`
            );
            // total reviews written
            const reviewRows = await tx.execute(
                `SELECT COUNT(*) as count FROM reviews WHERE user_id = '${user.id}'`
            );
            // distinct kitchens ordered from
            const kitchenRows = await tx.execute(
                `SELECT COUNT(DISTINCT kitchen_id) as count FROM orders WHERE customer_id = '${user.id}'`
            );
            return {
                orders: {
                    total: Number((orderRows.rows[0] as { count: string }).count),
                    kitchens: Number((kitchenRows.rows[0] as { count: string }).count),
                },
                reviews: Number((reviewRows.rows[0] as { count: string }).count),
            };
        });

        return apiSuccess({
            ...profile,
            totalOrders: orders.total,
            totalReviews: reviews,
            kitchensTried: orders.kitchens,
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
        const { name, phoneNumber, defaultCity, defaultAddress } = body;

        // Basic validation
        if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
            return apiBadRequest("Name must be at least 2 characters");
        }

        const updateData: Record<string, string> = {};
        if (name !== undefined) updateData.name = name.trim();
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (defaultCity !== undefined) updateData.defaultCity = defaultCity;
        if (defaultAddress !== undefined) updateData.defaultAddress = defaultAddress;

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
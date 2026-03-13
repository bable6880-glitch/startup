import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { userAddresses } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiUnauthorized, apiInternalError, apiBadRequest } from "@/lib/utils/api-response";
import { createAddressSchema } from "@/lib/validations/address";
import { z } from "zod";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const addresses = await db.query.userAddresses.findMany({
            where: eq(userAddresses.userId, user.id),
            orderBy: [desc(userAddresses.isDefault), desc(userAddresses.createdAt)],
        });

        return apiSuccess({ addresses });
    } catch (error) {
        console.error("GET /api/account/addresses error:", error);
        return apiInternalError();
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const body = await request.json().catch(() => ({}));
        const parsed = createAddressSchema.parse(body);

        // If this is the user's first address, or they explicitly requested it to be default
        const existingAddresses = await db.query.userAddresses.findMany({
            where: eq(userAddresses.userId, user.id),
            columns: { id: true, isDefault: true },
        });

        const isDefault = parsed.isDefault || existingAddresses.length === 0;

        // If this one is new default, unset others first (optional depending on driver, but safer)
        if (isDefault && existingAddresses.length > 0) {
            await db.update(userAddresses)
                .set({ isDefault: false })
                .where(and(eq(userAddresses.userId, user.id), eq(userAddresses.isDefault, true)));
        }

        const [address] = await db
            .insert(userAddresses)
            .values({
                userId: user.id,
                ...parsed,
                isDefault,
            })
            .returning();

        return apiSuccess({ address, message: "Address created" }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) return apiBadRequest("Validation error", error.flatten().fieldErrors);
        console.error("POST /api/account/addresses error:", error);
        return apiInternalError();
    }
}

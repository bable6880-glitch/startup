import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { userAddresses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiUnauthorized, apiInternalError, apiNotFound, apiBadRequest } from "@/lib/utils/api-response";
import { updateAddressSchema } from "@/lib/validations/address";
import { z } from "zod";

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const addressId = params.id;
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const body = await request.json().catch(() => ({}));
        const parsed = updateAddressSchema.parse(body);

        const [address] = await db
            .update(userAddresses)
            .set({ ...parsed, updatedAt: new Date() })
            .where(and(
                eq(userAddresses.id, addressId),
                eq(userAddresses.userId, user.id)
            ))
            .returning();

        if (!address) return apiNotFound("Address not found");

        return apiSuccess({ address, message: "Address updated" });
    } catch (error) {
        if (error instanceof z.ZodError) return apiBadRequest("Validation error", error.flatten().fieldErrors);
        console.error("PUT /api/account/addresses/[id] error:", error);
        return apiInternalError();
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const addressId = params.id;
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        // Prevent deleting if it's the only one? No strict rule, just let them delete.
        // However, if we delete the default, we should prob pick a new default.
        const [deleted] = await db
            .delete(userAddresses)
            .where(and(
                eq(userAddresses.id, addressId),
                eq(userAddresses.userId, user.id)
            ))
            .returning();

        if (!deleted) return apiNotFound("Address not found");

        // If it was default, make the most recent one default
        if (deleted.isDefault) {
            const nextAddress = await db.query.userAddresses.findFirst({
                where: eq(userAddresses.userId, user.id),
                orderBy: (tables, { desc }) => [desc(tables.createdAt)],
            });
            
            if (nextAddress) {
                await db.update(userAddresses)
                    .set({ isDefault: true })
                    .where(eq(userAddresses.id, nextAddress.id));
            }
        }

        return apiSuccess({ message: "Address deleted" });
    } catch (error) {
        console.error("DELETE /api/account/addresses/[id] error:", error);
        return apiInternalError();
    }
}

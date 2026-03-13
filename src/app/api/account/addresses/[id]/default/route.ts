import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { userAddresses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiUnauthorized, apiInternalError, apiNotFound } from "@/lib/utils/api-response";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const addressId = params.id;
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        // Verify the address belongs to user
        const address = await db.query.userAddresses.findFirst({
            where: and(
                eq(userAddresses.id, addressId),
                eq(userAddresses.userId, user.id)
            ),
        });

        if (!address) return apiNotFound("Address not found");

        // Set all addresses for user to non-default
        await db.update(userAddresses)
            .set({ isDefault: false })
            .where(eq(userAddresses.userId, user.id));

        // Set chosen to default
        const [updated] = await db.update(userAddresses)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(userAddresses.id, addressId))
            .returning();

        return apiSuccess({ address: updated, message: "Default address updated" });
    } catch (error) {
        console.error("PATCH /api/account/addresses/[id]/default error:", error);
        return apiInternalError();
    }
}

"use server";

import { cookies } from "next/headers";
import {
    createSubscriptionCheckout,
    cancelSubscription,
    getSubscriptionStatus,
} from "@/services/premium.service";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { kitchens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
    subscriptionCheckoutSchema,
    cancelSubscriptionSchema,
    type SubscriptionPlanType,
} from "@/lib/validations/subscription";
import { logger } from "@/lib/utils/logger";
import { NextRequest } from "next/server";

// ─── Helper: Get seller context from cookies ────────────────────────────────

async function getSellerContext() {
    // In server actions we need to build a pseudo-request for the auth helper.
    // We read the auth token from the cookie or header set by the client.
    const cookieStore = await cookies();
    const token = cookieStore.get("firebase-token")?.value;

    if (!token) {
        return { error: "Not authenticated" as const, user: null, kitchen: null };
    }

    // Build a minimal request-like object for getAuthUser
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const pseudoRequest = new NextRequest(baseUrl, { headers });

    const user = await getAuthUser(pseudoRequest);
    if (!user || (user.role !== "COOK" && user.role !== "ADMIN")) {
        return { error: "Unauthorized" as const, user: null, kitchen: null };
    }

    const kitchen = await db.query.kitchens.findFirst({
        where: eq(kitchens.ownerId, user.id),
    });

    if (!kitchen) {
        return { error: "No kitchen found" as const, user, kitchen: null };
    }

    return { error: null, user, kitchen };
}

// ─── Create Checkout Session ────────────────────────────────────────────────

export async function createCheckoutAction(formData: FormData) {
    try {
        const { error, user, kitchen } = await getSellerContext();
        if (error || !user || !kitchen) {
            return { success: false, error: error || "Authentication required" };
        }

        const rawData = {
            kitchenId: kitchen.id,
            planType: formData.get("planType") as string,
            paymentMethod: formData.get("paymentMethod") as string,
        };

        const parsed = subscriptionCheckoutSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Invalid form data",
                details: parsed.error.flatten().fieldErrors,
            };
        }

        const result = await createSubscriptionCheckout(
            user.id,
            kitchen.id,
            parsed.data.planType as SubscriptionPlanType,
            parsed.data.paymentMethod
        );

        return { success: true, data: result };
    } catch (err) {
        logger.error("createCheckoutAction failed", {
            error: err instanceof Error ? err.message : "Unknown",
        });
        return { success: false, error: "Failed to create checkout session" };
    }
}

// ─── Cancel Subscription ────────────────────────────────────────────────────

export async function cancelSubscriptionAction(formData: FormData) {
    try {
        const { error, user } = await getSellerContext();
        if (error || !user) {
            return { success: false, error: error || "Authentication required" };
        }

        const rawData = {
            subscriptionId: formData.get("subscriptionId") as string,
            reason: (formData.get("reason") as string) || undefined,
        };

        const parsed = cancelSubscriptionSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Invalid form data",
                details: parsed.error.flatten().fieldErrors,
            };
        }

        const result = await cancelSubscription(
            parsed.data.subscriptionId,
            user.id,
            parsed.data.reason
        );

        return { success: true, data: result };
    } catch (err) {
        logger.error("cancelSubscriptionAction failed", {
            error: err instanceof Error ? err.message : "Unknown",
        });
        return { success: false, error: "Failed to cancel subscription" };
    }
}

// ─── Get Status ─────────────────────────────────────────────────────────────

export async function getSubscriptionStatusAction() {
    try {
        const { error, kitchen } = await getSellerContext();
        if (error || !kitchen) {
            return { success: false, error: error || "No kitchen found" };
        }

        const status = await getSubscriptionStatus(kitchen.id);
        return { success: true, data: status };
    } catch (err) {
        logger.error("getSubscriptionStatusAction failed", {
            error: err instanceof Error ? err.message : "Unknown",
        });
        return { success: false, error: "Failed to get subscription status" };
    }
}

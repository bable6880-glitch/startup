import { NextRequest } from "next/server";
import { apiNotFound } from "@/lib/utils/api-response";

/**
 * POST /api/seller/subscription/trial
 * DEPRECATED: Free trial system has been removed.
 * Kitchens now require a paid subscription via Stripe checkout.
 */
export async function POST(_request: NextRequest) {
    return apiNotFound(
        "Free trials are no longer available. Please subscribe via the dashboard to activate your kitchen."
    );
}

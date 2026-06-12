import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { guardFeatureAccess, PlanFeatureError } from "@/lib/plans/plan-guards";
import { logger } from "@/lib/utils/logger";
import { redis } from "@/lib/redis";

function sanitizeText(str: string) {
    if (!str) return "";
    return str.replace(/[<>]/g, "").trim();
}

function getMidnightPKTUnix() {
    const now = new Date();
    const pkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
    pkt.setHours(24, 0, 0, 0);
    // Convert PKT back to UTC unix seconds
    return Math.floor((pkt.getTime() - 5 * 60 * 60 * 1000) / 1000);
}

function getMidnightPKTISO() {
    const now = new Date();
    const pkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
    pkt.setHours(24, 0, 0, 0);
    const utcDate = new Date(pkt.getTime() - 5 * 60 * 60 * 1000);
    return utcDate.toISOString();
}

export async function POST(req: NextRequest) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;
        
        try {
            await guardFeatureAccess(guard.kitchen.id, 'cook_helper_ai');
        } catch (error) {
            if (error instanceof PlanFeatureError) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            throw error;
        }

        const body = await req.json();
        const q = sanitizeText(body.query).slice(0, 500);
        
        if (!q || q.length < 3) {
            return NextResponse.json({ error: "Valid query required (min 3 chars)" }, { status: 400 });
        }

        const ctx = body.context ? sanitizeText(body.context).slice(0, 200) : null;

        let used = 0;
        let remainingToday = 20;

        // Rate limit check
        if (redis) {
            const today = new Date().toISOString().split('T')[0];
            const rateLimitKey = `chef:daily:${guard.kitchen.id}:${today}`;
            used = await redis.incr(rateLimitKey);
            
            if (used === 1) {
                // First use today — set expiry to midnight PKT
                await redis.expireat(rateLimitKey, getMidnightPKTUnix());
            }
            
            if (used > 20) {
                return NextResponse.json({ 
                    error: "RATE_LIMIT_EXCEEDED",
                    message: "You have used all 20 chef assistant queries for today. Resets at midnight.",
                    remainingToday: 0,
                    resetsAt: getMidnightPKTISO()
                }, { status: 429 });
            }
            
            remainingToday = 20 - used;
        }

        const systemPrompt = `You are an expert culinary and business advisor for Pakistani home kitchens.
Provide practical, concise, and highly actionable advice. Match the language of the user (English or Roman Urdu).
Focus strictly on: cost optimization, ingredient substitutions, local Pakistani palate, menu engineering, and customer retention.
Format your responses using clean Markdown (e.g., bullet points, bold text for emphasis).
Keep responses concise and under 200 words. Be encouraging and business-focused.`;

        const messages = [
            { role: "user", content: ctx ? `Context:\n${ctx}\n\nQuestion:\n${q}` : q }
        ];

        // Provider Fallback Chain
        const { getConfiguredProviders } = await import("@/lib/ai");
        const providers = getConfiguredProviders();

        if (providers.length === 0) {
            logger.error("No AI providers configured", { kitchenId: guard.kitchen.id });
            return NextResponse.json({ error: "AI service is not configured on the server." }, { status: 503 });
        }

        const requestId = crypto.randomUUID();
        let lastError: Error | null = null;
        let attempt = 0;

        for (const provider of providers) {
            attempt++;
            const startTime = Date.now();
            try {
                const responseText = await provider.chat(messages, systemPrompt);
                
                logger.info("Chef Assistant request successful", {
                    requestId,
                    kitchenId: guard.kitchen.id,
                    provider: provider.name,
                    latency_ms: Date.now() - startTime,
                    attempt
                });

                return NextResponse.json({ 
                    success: true, 
                    response: responseText,
                    remainingToday,
                    fallback: attempt > 1
                });
            } catch (error: any) {
                lastError = error;
                logger.warn("AI Provider failed, trying fallback", {
                    requestId,
                    kitchenId: guard.kitchen.id,
                    failedProvider: provider.name,
                    latency_ms: Date.now() - startTime,
                    errorMessage: error.message,
                    attempt
                });
                // Continue to the next provider in the loop
            }
        }

        // If all providers fail
        logger.error("All AI providers failed", {
            requestId,
            kitchenId: guard.kitchen.id,
            totalAttempts: attempt,
            lastErrorMessage: lastError?.message
        });

        return NextResponse.json({
            success: false,
            error: "We couldn't process your request right now. Our AI services are experiencing high load.",
            remainingToday,
            fallback: true
        }, { status: 503 });

    } catch (error) {
        logger.error("Failed to process chef assistant request", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

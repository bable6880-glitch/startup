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

        try {
            if (!process.env.ANTHROPIC_API_KEY) {
                throw new Error("Missing Anthropic API Key");
            }

            const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 200,
                    system: `You are a helpful cooking assistant for Pakistani home cooks. Give practical, concise cooking advice. Match the language of the user (English or Urdu/Roman Urdu). Focus on: ingredients, quantities, timing, techniques, and troubleshooting. Keep responses under 120 words. Be encouraging and friendly.`,
                    messages: [
                        { role: "user", content: ctx ? `Context: ${ctx}\n\nQuestion: ${q}` : q }
                    ]
                })
            });

            if (!anthropicRes.ok) {
                throw new Error(`Anthropic API Error: ${anthropicRes.status}`);
            }

            const aiData = await anthropicRes.json();
            const responseText = aiData.content[0].text;

            return NextResponse.json({ 
                success: true, 
                response: responseText,
                remainingToday,
                fallback: false
            });

        } catch (error) {
            logger.warn("Chef assistant fallback triggered", { error });
            return NextResponse.json({
                success: true,
                response: "Sorry, chef assistant is temporarily unavailable. Please try again in a moment.",
                remainingToday,
                fallback: true
            });
        }

    } catch (error) {
        logger.error("Failed to process chef assistant request", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

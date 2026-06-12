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
        console.log('[ChefAI] Handler invoked');
        console.log('[ChefAI] ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY);
        console.log('[ChefAI] OPENROUTER_API_KEY present:', !!process.env.OPENROUTER_API_KEY);
        console.log('[ChefAI] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);

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

        if (redis) {
            const today = new Date().toISOString().split('T')[0];
            const rateLimitKey = `chef:daily:${guard.kitchen.id}:${today}`;
            used = await redis.incr(rateLimitKey);
            
            if (used === 1) {
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

        const messages = [
            { role: "system", content: "You are a helpful cooking assistant for Pakistani home cooks. Give practical, concise cooking advice." },
            { role: "user", content: ctx ? `Context: ${ctx}\n\nQuestion: ${q}` : q }
        ];

        async function callOpenRouter(messages: {role: string, content: string}[]) {
            const apiKey = process.env.OPENROUTER_API_KEY;

            if (!apiKey) {
                throw new Error('OPENROUTER_API_KEY environment variable is not set');
            }

            const response = await fetch(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://smarttiffinfood.vercel.app',
                        'X-Title': 'Smart Tiffin Chef Assistant',
                    },
                    body: JSON.stringify({
                        model: 'deepseek/deepseek-chat',
                        messages,
                        max_tokens: 1000,
                        temperature: 0.7,
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} — ${errorText}`);
            }

            const data = await response.json();

            if (!data.choices?.[0]?.message?.content) {
                throw new Error(`OpenRouter returned unexpected response shape: ${JSON.stringify(data)}`);
            }

            return data.choices[0].message.content as string;
        }

        let aiResponse: string | null = null;
        let lastError: Error | null = null;

        // Try primary provider (Anthropic)
        try {
            if (process.env.ANTHROPIC_API_KEY) {
                const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": process.env.ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01"
                    },
                    body: JSON.stringify({
                        model: 'claude-3-haiku-20240307',
                        max_tokens: 500,
                        system: messages[0].content,
                        messages: [messages[1]]
                    })
                });
                
                if (!anthropicRes.ok) throw new Error(`Anthropic Error: ${anthropicRes.status}`);
                const aiData = await anthropicRes.json();
                aiResponse = aiData.content[0].text;
                console.log('[ChefAI] Primary provider succeeded');
            } else {
                console.log('[ChefAI] Primary provider key missing, skipping to fallback');
            }
        } catch (primaryError) {
            lastError = primaryError as Error;
            console.error('[ChefAI] Primary provider failed:', primaryError);
        }

        // Try OpenRouter fallback if primary failed or was skipped
        if (!aiResponse) {
            try {
                aiResponse = await callOpenRouter(messages);
                console.log('[ChefAI] OpenRouter fallback succeeded');
            } catch (fallbackError) {
                lastError = fallbackError as Error;
                console.error('[ChefAI] Fallback provider failed:', fallbackError);
            }
        }

        // Both failed
        if (!aiResponse) {
            console.error('[ChefAI] All providers failed. Last error:', lastError?.message);
            return NextResponse.json(
                {
                    success: false,
                    error: 'AI service temporarily unavailable. Please try again in a moment.',
                    remainingToday,
                    fallback: true
                },
                { status: 503 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            response: aiResponse,
            remainingToday,
            fallback: false
        });

    } catch (error) {
        logger.error("Failed to process chef assistant request", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export const runtime = "nodejs"; // REQUIRED — streaming won't work on edge runtime

import { NextRequest } from "next/server";
import { CHANNELS, readEvents, subscribeToChannel, unsubscribeFromChannel } from "@/lib/redis/pubsub";
import { resolveSseTicket } from "@/lib/auth/resolve-sse-ticket";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ customerId: string }> }
) {
    const { customerId } = await params;

    // 1. Auth check using ticket
    const ticket = request.nextUrl.searchParams.get("ticket");
    if (!ticket) return Response.json({ error: "Missing ticket" }, { status: 401 });

    const authUser = await resolveSseTicket(ticket);
    if (!authUser || authUser.userId !== customerId || authUser.channel !== "customer" || authUser.channelId !== customerId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const channel = CHANNELS.customerOrders(customerId);
    let lastSeen = Date.now() - 5000; // look back 5s on connect

    // 2. Stream SSE
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            const send = (data: string) => {
                try { controller.enqueue(encoder.encode(data)); } catch { }
            };

            // Send connection confirmation immediately
            send(`data: ${JSON.stringify({ type: "CONNECTED", payload: { customerId }, timestamp: Date.now() })}\n\n`);

            // Independent Heartbeat (30s)
            const heartbeatInterval = setInterval(() => {
                send(": heartbeat\n\n");
            }, 30000);

            let pollIntervalId: ReturnType<typeof setInterval> | null = null;

            // Attempt Pub/Sub Fast Path
            subscribeToChannel(channel, (event) => {
                if (event.type === "ORDER_STATUS_CHANGED") {
                    send(`data: ${JSON.stringify(event)}\n\n`);
                    lastSeen = Math.max(lastSeen, event.timestamp);
                }
            }).catch(() => {
                // Fallback: Polling with Jitter
                const jitter = Math.floor(Math.random() * 2000) - 1000;
                const pollInterval = 5000 + jitter;

                pollIntervalId = setInterval(async () => {
                    try {
                        const events = await readEvents(channel, lastSeen);
                        for (const event of events) {
                            if (event.type === "ORDER_STATUS_CHANGED") {
                                send(`data: ${JSON.stringify(event)}\n\n`);
                            } else {
                                send(`data: ${JSON.stringify(event)}\n\n`); // send anyway
                            }
                            lastSeen = Math.max(lastSeen, event.timestamp);
                        }
                    } catch (error) {
                        console.error("[SSE/customer] Poll error:", error);
                        if (pollIntervalId) clearInterval(pollIntervalId);
                        try { controller.close(); } catch { }
                    }
                }, pollInterval);
            });

            // Prevent Vercel 300s timeout by gracefully closing just before the limit
            const gracefulTimeoutId = setTimeout(() => {
                try {
                    send(`data: ${JSON.stringify({ type: "RECONNECT", timestamp: Date.now() })}\n\n`);
                    controller.close();
                } catch { }
            }, 285000); // 285 seconds

            // Cleanup on client disconnect
            request.signal.addEventListener("abort", () => {
                clearTimeout(gracefulTimeoutId);
                unsubscribeFromChannel(channel).catch(() => {});
                clearInterval(heartbeatInterval);
                if (pollIntervalId) clearInterval(pollIntervalId);
                try { controller.close(); } catch { }
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
export const runtime = "nodejs"; // REQUIRED — streaming won't work on edge runtime

import { NextRequest } from "next/server";
import { CHANNELS, readEvents } from "@/lib/redis/pubsub";
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
    if (!authUser || authUser.userId !== customerId) {
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

            // Poll Redis every 2 seconds
            const interval = setInterval(async () => {
                try {
                    send(": heartbeat\n\n"); // Prevents browser timeout

                    const events = await readEvents(channel, lastSeen);
                    for (const event of events) {
                        send(`data: ${JSON.stringify(event)}\n\n`);
                        lastSeen = Math.max(lastSeen, event.timestamp);
                    }
                } catch (error) {
                    console.error("[SSE/customer] Poll error:", error);
                    clearInterval(interval);
                    try { controller.close(); } catch { }
                }
            }, 2000);

            // Cleanup on client disconnect
            request.signal.addEventListener("abort", () => {
                clearInterval(interval);
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
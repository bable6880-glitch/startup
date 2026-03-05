import { NextRequest } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { getLatestEvents, RealtimeChannels } from "@/lib/redis/pubsub";

export const runtime = "nodejs";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ kitchenId: string }> }
) {
    const { kitchenId } = await params;

    // 1. Auth check
    const guard = await requireSeller(request);
    if (!guard.ok) return guard.response;

    // Verify this is the correct kitchen
    if (guard.kitchen.id !== kitchenId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const encoder = new TextEncoder();
    const channel = RealtimeChannels.kitchen(kitchenId);

    const stream = new ReadableStream({
        async start(controller) {
            // Send initial connection event
            controller.enqueue(encoder.encode("event: connected\ndata: { \"connected\": true }\n\n"));

            // Last seen event timestamp to avoid duplicates
            let lastEventTimestamp = new Date().toISOString();

            const interval = setInterval(async () => {
                try {
                    // Send heartbeat to keep connection alive
                    controller.enqueue(encoder.encode(": heartbeat\n\n"));

                    // Fetch latest events from Redis list
                    const events = await getLatestEvents(channel);

                    // Filter for only truly new events since last poll
                    const newEvents = events.filter(e => e.timestamp > lastEventTimestamp);

                    if (newEvents.length > 0) {
                        for (const event of newEvents) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                        }
                        lastEventTimestamp = newEvents[newEvents.length - 1].timestamp;
                    }
                } catch (error) {
                    console.error("[SSE Kitchen] Push error:", error);
                    clearInterval(interval);
                    controller.close();
                }
            }, 3000); // 3s polling frequency

            // Request cleanup on client disconnect
            request.signal.addEventListener("abort", () => {
                clearInterval(interval);
                controller.close();
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

import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getLatestEvents, RealtimeChannels } from "@/lib/redis/pubsub";

export const runtime = "nodejs";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ customerId: string }> }
) {
    const { customerId } = await params;

    // 1. Auth check
    const user = await getAuthUser(request);
    if (!user || user.id !== customerId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const encoder = new TextEncoder();
    const channel = RealtimeChannels.customer(customerId);

    const stream = new ReadableStream({
        async start(controller) {
            // Send initial connection event
            controller.enqueue(encoder.encode("event: connected\ndata: { \"connected\": true }\n\n"));

            let lastEventTimestamp = new Date().toISOString();

            const interval = setInterval(async () => {
                try {
                    // Send heartbeat
                    controller.enqueue(encoder.encode(": heartbeat\n\n"));

                    // Fetch latest events
                    const events = await getLatestEvents(channel);
                    const newEvents = events.filter(e => e.timestamp > lastEventTimestamp);

                    if (newEvents.length > 0) {
                        for (const event of newEvents) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                        }
                        lastEventTimestamp = newEvents[newEvents.length - 1].timestamp;
                    }
                } catch (error) {
                    console.error("[SSE Customer] Push error:", error);
                    clearInterval(interval);
                    controller.close();
                }
            }, 3000);

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

import { db } from "@/lib/db";
import { users, notifications } from "@/lib/db/schema";
import { eq, and, isNull, desc, count } from "drizzle-orm";
import { redis } from "@/lib/redis";

// CHANGED [N2]: Notification service — in-app notifications + FCM push stub
// Firebase Cloud Messaging requires firebase-admin and service account setup.
// This service provides a unified notification API that works with or without FCM.

// Match the database enum exactly
type DBNotificationType = "ORDER_PLACED" | "ORDER_ACCEPTED" | "ORDER_PREPARING" | "ORDER_READY" | "ORDER_COMPLETED" | "ORDER_CANCELLED" | "REVIEW_REPLY" | "PROMO" | "SYSTEM";

// Local payload type used by templates (maps dynamically to DB type if needed)
type NotificationType = "ORDER_PLACED" | "ORDER_ACCEPTED" | "ORDER_COMPLETED" | "ORDER_CANCELLED" | "NEW_REVIEW" | "SELLER_REPLY" | "PAYMENT_RECEIVED";

interface NotificationPayload {
    type: NotificationType;
    recipientId: string;
    title: string;
    body: string;
    data?: Record<string, string>;
}

// ─── In-App Notification (stored in DB for notification center) ─────────────

const notificationLog: NotificationPayload[] = [];

export async function sendNotification(payload: NotificationPayload): Promise<void> {
    try {
        // Map payload type to DB enum (some don't perfectly match so we coerce to SYSTEM or known enums)
        let dbType: DBNotificationType = "SYSTEM";
        if (["ORDER_PLACED", "ORDER_ACCEPTED", "ORDER_COMPLETED", "ORDER_CANCELLED"].includes(payload.type)) {
            dbType = payload.type as DBNotificationType;
        } else if (payload.type === "SELLER_REPLY") {
            dbType = "REVIEW_REPLY";
        }

        // 1. Save to Database for in-app notification center
        await db.insert(notifications).values({
            userId: payload.recipientId,
            type: dbType,
            title: payload.title,
            body: payload.body,
            link: payload.data?.url || null,
            metadata: payload.data || {},
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        // Log for terminal debugging
        notificationLog.push(payload);
        console.log(`[Notification] ${payload.type} → ${payload.recipientId}: ${payload.title}`);

        // 2. Attempt FCM push notification if available
        await sendFCMPush(payload);
    } catch (error) {
        console.error("[Notification Error]", error);
        // Notifications should never break the main flow
    }
}

export async function clearAllNotifications(userId: string): Promise<void> {
    await db
        .update(notifications)
        .set({ clearedAt: new Date() })
        .where(
            and(
                eq(notifications.userId, userId),
                isNull(notifications.clearedAt)
            )
        );

    // Invalidate notification cache for this user
    if (redis) {
        await redis.del(`notifications:${userId}`).catch(() => {});
    }
}

export async function getActiveNotifications(userId: string, limit = 20) {
    return db.query.notifications.findMany({
        where: and(
            eq(notifications.userId, userId),
            isNull(notifications.clearedAt)
        ),
        orderBy: [desc(notifications.createdAt)],
        limit,
    });
}

export async function getUnreadCount(userId: string): Promise<number> {
    const result = await db
        .select({ count: count() })
        .from(notifications)
        .where(
            and(
                eq(notifications.userId, userId),
                eq(notifications.isRead, false),
                isNull(notifications.clearedAt)
            )
        );
    return result[0]?.count ?? 0;
}

export async function markAllAsRead(userId: string): Promise<void> {
    await db
        .update(notifications)
        .set({ isRead: true })
        .where(
            and(
                eq(notifications.userId, userId),
                eq(notifications.isRead, false),
                isNull(notifications.clearedAt)
            )
        );

    if (redis) {
        await redis.del(`notifications:${userId}`).catch(() => {});
    }
}

// ─── FCM Push (requires firebase-admin) ────────────────────────────────────

async function sendFCMPush(payload: NotificationPayload): Promise<void> {
    try {
        // Check if firebase-admin is configured
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            // FCM not configured, skip push notification
            return;
        }

        // Get the user's FCM token from the database
        const user = await db.query.users.findFirst({
            where: eq(users.id, payload.recipientId),
            columns: { fcmToken: true },
        });

        if (!user?.fcmToken) return;

        // Reuse the shared Firebase Admin singleton (Rule #3)
        const { getFirebaseApp } = await import("@/lib/auth/firebase-admin");
        const { getMessaging } = await import("firebase-admin/messaging");
        const app = getFirebaseApp();

        await getMessaging(app).send({
            token: user.fcmToken,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            webpush: {
                notification: {
                    icon: "/icons/icon-192x192.png",
                    badge: "/icons/badge-72x72.png",
                },
                fcmOptions: {
                    link: payload.data?.url || "/",
                },
            },
        });

        console.log(`[FCM] Push sent to ${payload.recipientId}`);
    } catch (error: unknown) {
        console.warn("[FCM] Push failed (non-critical):", error);
        
        const fcmError = error as { errorInfo?: { code?: string }, code?: string };
        const errorCode = fcmError?.errorInfo?.code || fcmError?.code;
        if (errorCode === "messaging/registration-token-not-registered" || errorCode === "messaging/invalid-registration-token") {
            await db.update(users).set({ fcmToken: null }).where(eq(users.id, payload.recipientId));
            console.log(`[FCM] Stale token removed for user ${payload.recipientId}`);
        }
    }
}

// ─── Pre-built Notification Templates ──────────────────────────────────────

export function notifyOrderPlaced(cookId: string, orderId: string, customerName: string) {
    return sendNotification({
        type: "ORDER_PLACED",
        recipientId: cookId,
        title: "🎉 New Order!",
        body: `${customerName} placed an order. Tap to view and accept.`,
        data: { orderId, url: `/dashboard/orders` },
    });
}

export function notifyOrderAccepted(customerId: string, orderId: string, kitchenName: string) {
    return sendNotification({
        type: "ORDER_ACCEPTED",
        recipientId: customerId,
        title: "✅ Order Accepted!",
        body: `${kitchenName} accepted your order and is preparing it now.`,
        data: { orderId, url: `/orders/${orderId}` },
    });
}

export function notifyOrderCompleted(customerId: string, orderId: string, kitchenName: string) {
    return sendNotification({
        type: "ORDER_COMPLETED",
        recipientId: customerId,
        title: "🎉 Order Ready!",
        body: `Your order from ${kitchenName} is ready for pickup/delivery.`,
        data: { orderId, url: `/orders/${orderId}` },
    });
}

export function notifyPaymentReceived(cookId: string, orderId: string, amount: number) {
    return sendNotification({
        type: "PAYMENT_RECEIVED",
        recipientId: cookId,
        title: "💰 Payment Received!",
        body: `You received Rs. ${amount.toLocaleString()} for your order.`,
        data: { orderId, url: `/dashboard/orders` },
    });
}

export function notifyNewReview(cookId: string, kitchenName: string, rating: number) {
    return sendNotification({
        type: "NEW_REVIEW",
        recipientId: cookId,
        title: `⭐ New ${rating}-star Review!`,
        body: `Someone left a review on ${kitchenName}. Tap to view.`,
        data: { url: `/dashboard/reviews` },
    });
}

export function notifySellerReply(customerId: string, kitchenName: string) {
    return sendNotification({
        type: "SELLER_REPLY",
        recipientId: customerId,
        title: "💬 Cook Replied!",
        body: `${kitchenName} replied to your review.`,
        data: { url: `/orders` },
    });
}

export function notifySystemMessage(userId: string, message: string) {
    return sendNotification({
        type: "SYSTEM" as any,
        recipientId: userId,
        title: "System Update",
        body: message,
    });
}

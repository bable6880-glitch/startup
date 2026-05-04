import { logger } from "@/lib/utils/logger";
import { getKitchenPlanAccess } from "@/lib/plans/plan-access";

/**
 * WhatsApp Business Cloud API Service
 * 
 * Uses Meta WhatsApp Business API for real message delivery.
 * Falls back to mock logging when META_WHATSAPP_TOKEN is not configured.
 * 
 * Required env vars for production:
 * - META_WHATSAPP_TOKEN: Permanent access token from Meta Business
 * - META_WHATSAPP_PHONE_ID: Phone number ID from WhatsApp Business
 * 
 * Template messages must be pre-registered and approved in Meta Business Manager.
 */

const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0";
const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN;
const META_WHATSAPP_PHONE_ID = process.env.META_WHATSAPP_PHONE_ID;

const IS_LIVE = !!(META_WHATSAPP_TOKEN && META_WHATSAPP_PHONE_ID);

/**
 * Format Pakistani phone numbers to WhatsApp international format.
 * Handles: 03XX, +923XX, 923XX, 3XX formats.
 */
function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[\s\-()]/g, "");
    if (cleaned.startsWith("+92")) return cleaned;
    if (cleaned.startsWith("92")) return `+${cleaned}`;
    if (cleaned.startsWith("0")) return `+92${cleaned.slice(1)}`;
    if (cleaned.startsWith("3")) return `+92${cleaned}`;
    return `+${cleaned}`; // assume already international
}

/**
 * Send a WhatsApp message via Meta Business Cloud API.
 * Falls back to console logging in dev / when credentials are missing.
 */
export async function sendWhatsAppNotification(
    kitchenId: string,
    phoneNumber: string,
    message: string
): Promise<boolean> {
    try {
        const access = await getKitchenPlanAccess(kitchenId);

        // Check if the kitchen has the auto_whatsapp feature
        if (!access.hasFeature('auto_whatsapp')) {
            logger.debug("WhatsApp notification skipped: plan does not include auto_whatsapp", { kitchenId });
            return false;
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);

        // ── LIVE MODE: Use Meta WhatsApp Business Cloud API ──
        if (IS_LIVE) {
            const res = await fetch(
                `${WHATSAPP_API_URL}/${META_WHATSAPP_PHONE_ID}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${META_WHATSAPP_TOKEN}`,
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        recipient_type: "individual",
                        to: formattedPhone.replace("+", ""), // Meta API wants no + prefix
                        type: "text",
                        text: { body: message },
                    }),
                }
            );

            if (!res.ok) {
                const errorBody = await res.text();
                logger.error("WhatsApp API error", {
                    status: res.status,
                    body: errorBody,
                    phone: formattedPhone,
                    kitchenId,
                });
                return false;
            }

            const result = await res.json();
            logger.info("WhatsApp message sent", {
                messageId: result.messages?.[0]?.id,
                phone: formattedPhone,
                kitchenId,
            });
            return true;
        }

        // ── MOCK MODE: Log to console (dev / staging) ──
        logger.info(`[WhatsApp Mock] To: ${formattedPhone} | Message: ${message}`);
        await new Promise(resolve => setTimeout(resolve, 100)); // minimal delay for mock
        return true;
    } catch (error) {
        logger.error("Failed to send WhatsApp notification", { error, kitchenId, phoneNumber });
        return false;
    }
}

/**
 * Send a pre-approved template message.
 * Templates must be registered in Meta Business Manager.
 * Use this for order confirmations, reminders, etc.
 */
export async function sendWhatsAppTemplate(
    kitchenId: string,
    phoneNumber: string,
    templateName: string,
    languageCode: string = "en",
    parameters: string[] = []
): Promise<boolean> {
    try {
        const access = await getKitchenPlanAccess(kitchenId);

        if (!access.hasFeature('auto_whatsapp')) {
            return false;
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);

        if (!IS_LIVE) {
            logger.info(`[WhatsApp Template Mock] Template: ${templateName} To: ${formattedPhone} Params: ${parameters.join(", ")}`);
            return true;
        }

        const bodyParams = parameters.map(p => ({
            type: "text" as const,
            text: p,
        }));

        const res = await fetch(
            `${WHATSAPP_API_URL}/${META_WHATSAPP_PHONE_ID}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${META_WHATSAPP_TOKEN}`,
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: formattedPhone.replace("+", ""),
                    type: "template",
                    template: {
                        name: templateName,
                        language: { code: languageCode },
                        components: bodyParams.length > 0
                            ? [{ type: "body", parameters: bodyParams }]
                            : [],
                    },
                }),
            }
        );

        if (!res.ok) {
            const errorBody = await res.text();
            logger.error("WhatsApp template API error", {
                status: res.status,
                body: errorBody,
                template: templateName,
                phone: formattedPhone,
            });
            return false;
        }

        return true;
    } catch (error) {
        logger.error("Failed to send WhatsApp template", { error, templateName, phoneNumber });
        return false;
    }
}

// ── Convenience helpers (existing API preserved) ─────────────────────────────

export async function notifyOrderReceived(
    kitchenId: string,
    customerPhone: string,
    orderId: string,
    kitchenName: string
) {
    // Try template first (preferred for production — guaranteed delivery)
    if (IS_LIVE) {
        return sendWhatsAppTemplate(
            kitchenId,
            customerPhone,
            "order_confirmation",
            "en",
            [orderId.slice(-6), kitchenName]
        );
    }

    // Fallback to text message
    const msg = `Hi! Your order #${orderId.slice(-6)} from ${kitchenName} has been received and is being prepared. We'll notify you when it's ready! 🍛`;
    return sendWhatsAppNotification(kitchenId, customerPhone, msg);
}

export async function notifyOrderReady(
    kitchenId: string,
    customerPhone: string,
    orderId: string,
    kitchenName: string
) {
    const msg = `Your order #${orderId.slice(-6)} from ${kitchenName} is ready! 🎉 Please pick up your order or expect delivery shortly.`;
    return sendWhatsAppNotification(kitchenId, customerPhone, msg);
}

export async function notifyOrderDelivered(
    kitchenId: string,
    customerPhone: string,
    orderId: string,
    kitchenName: string
) {
    const msg = `Your order #${orderId.slice(-6)} from ${kitchenName} has been delivered. Enjoy your home-cooked meal! 😋\n\nLoved it? Leave a review on Smart Tiffin!`;
    return sendWhatsAppNotification(kitchenId, customerPhone, msg);
}

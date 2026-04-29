import { logger } from "@/lib/utils/logger";
import { getKitchenPlanAccess } from "@/lib/plans/plan-access";

/**
 * Mock WhatsApp Service
 * In a real application, this would integrate with WhatsApp Business API or Twilio.
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

        // Mock sending message
        logger.info(`[WhatsApp Mock] Sending to ${phoneNumber}: ${message}`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return true;
    } catch (error) {
        logger.error("Failed to send WhatsApp notification", { error, kitchenId, phoneNumber });
        return false;
    }
}

export async function notifyOrderReceived(kitchenId: string, customerPhone: string, orderId: string, kitchenName: string) {
    const msg = `Hi! Your order ${orderId.slice(-6)} from ${kitchenName} has been received and is being prepared. We'll notify you once it's out for delivery.`;
    return sendWhatsAppNotification(kitchenId, customerPhone, msg);
}

export async function notifyOrderDelivered(kitchenId: string, customerPhone: string, orderId: string, kitchenName: string) {
    const msg = `Good news! Your order ${orderId.slice(-6)} from ${kitchenName} has been delivered. Enjoy your home-cooked meal!`;
    return sendWhatsAppNotification(kitchenId, customerPhone, msg);
}

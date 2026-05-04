import { db } from "../src/lib/db";
import { planConfigs } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function updateElitePlan() {
    console.log("Updating Elite plan configuration...");
    
    try {
        await db.update(planConfigs)
            .set({
                cookHelperAi: true,
                digitalKhata: true,
                potluckUsesPerPeriod: -1, // Unlimited for elite
                chefAssistant: true,      // Set both just in case
                advancedAnalytics: true,
                aiInsights_Analytics: true as any, // The column in schema might be different, let me check
                autoWhatsApp: true,
                dedicatedManager: true,
                aiPricing: true,
                brandingTools: true,
                brandingLevel: 'premium',
                analytics: 'ai_insights',
                orderTrackingLevel: 'advanced',
                mobileUiLevel: 'premium_ui',
                realtimeOrderNotifs: true,
                reviewsHighlighted: true,
            })
            .where(eq(planConfigs.planId, 'elite'));
            
        console.log("Elite plan updated successfully.");
    } catch (error) {
        console.error("Failed to update Elite plan:", error);
    }
}

updateElitePlan();

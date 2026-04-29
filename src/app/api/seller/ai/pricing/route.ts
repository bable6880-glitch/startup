import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { guardFeatureAccess, PlanFeatureError } from "@/lib/plans/plan-guards";
import { logger } from "@/lib/utils/logger";

// Mock AI Service since we don't have real OpenAI/Gemini configured
async function suggestOptimalPrice(mealData: any) {
    // In a real app, this would call an LLM with competitor prices, ingredients, etc.
    const basePrice = mealData.currentPrice || 500;
    
    // Simulate AI delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
        suggestedPrice: Math.round(basePrice * 1.15),
        confidence: 0.85,
        reasoning: "Based on high demand in your area and premium ingredients, you can safely increase your margin by 15%. Similar meals in your sector sell for an average of Rs 580.",
        competitorAvg: Math.round(basePrice * 1.2)
    };
}

export async function POST(req: NextRequest) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;
        
        try {
            await guardFeatureAccess(guard.kitchen.id, 'ai_pricing');
        } catch (error) {
            if (error instanceof PlanFeatureError) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            throw error;
        }

        const body = await req.json();
        
        if (!body.mealId && !body.currentPrice) {
            return NextResponse.json({ error: "Meal data required" }, { status: 400 });
        }

        const suggestion = await suggestOptimalPrice(body);
        
        return NextResponse.json({ success: true, suggestion });
    } catch (error) {
        logger.error("Failed to generate AI pricing", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

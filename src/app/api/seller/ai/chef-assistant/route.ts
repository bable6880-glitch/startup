import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { guardFeatureAccess, PlanFeatureError } from "@/lib/plans/plan-guards";
import { logger } from "@/lib/utils/logger";

async function generateMenuIdeas(cuisine: string) {
    // Mock LLM response
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        ideas: [
            {
                name: `Signature ${cuisine} Feast`,
                description: "A premium combination of authentic spices and slow-cooked perfection.",
                estimatedCostRs: 250,
                suggestedPriceRs: 650,
                difficulty: "Medium"
            },
            {
                name: `Healthy ${cuisine} Bowl`,
                description: "Diet-friendly option targeting fitness enthusiasts.",
                estimatedCostRs: 180,
                suggestedPriceRs: 450,
                difficulty: "Easy"
            }
        ],
        tips: "Use fresh local herbs to increase the perceived value and taste profile."
    };
}

export async function POST(req: NextRequest) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;
        
        try {
            await guardFeatureAccess(guard.kitchen.id, 'chef_assistant');
        } catch (error) {
            if (error instanceof PlanFeatureError) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            throw error;
        }

        const body = await req.json();
        
        if (!body.cuisine) {
            return NextResponse.json({ error: "Cuisine type required" }, { status: 400 });
        }

        const suggestions = await generateMenuIdeas(body.cuisine);
        
        return NextResponse.json({ success: true, ...suggestions });
    } catch (error) {
        logger.error("Failed to generate AI chef suggestions", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

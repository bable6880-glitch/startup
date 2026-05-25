/**
 * Test script for plan feature resolution logic.
 * Run with: npx tsx scripts/test-plan-access.ts
 *
 * This script queries the database directly (via raw postgres driver)
 * and validates that resolveFeature returns correct results for each plan.
 *
 * NOTE: This file is excluded from the Next.js production build via tsconfig.json.
 */
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

// ── Types ──────────────────────────────────────────────────────────────────
// Raw SQL rows use snake_case column names (not the camelCase Drizzle schema).
// This interface mirrors the plan_configs table columns returned by `SELECT *`.

type PlanFeature =
    | 'featured_boost'
    | 'verified_badge'
    | 'branding_tools'
    | 'promotions'
    | 'advanced_analytics'
    | 'ai_insights_analytics'
    | 'ai_pricing'
    | 'ai_suggestions'
    | 'cook_helper_ai'
    | 'auto_whatsapp'
    | 'dedicated_manager'
    | 'digital_khata'
    | 'potluck'
    | 'highlighted_reviews'
    | 'advanced_order_tracking'
    | 'premium_mobile_ui';

interface RawPlanConfigRow {
    plan_id: string;
    featured_boost_level: string | null;
    branding_level: string | null;
    branding_tools: boolean | null;
    promotions_level: string | null;
    advanced_analytics: boolean | null;
    analytics: string | null;
    ai_pricing: boolean | null;
    ai_suggestions: string | null;
    cook_helper_ai: boolean | null;
    auto_whatsapp: boolean | null;
    dedicated_manager: boolean | null;
    digital_khata: boolean | null;
    potluck_uses_per_period: number;
    reviews_highlighted: boolean | null;
    order_tracking_level: string | null;
    mobile_ui_level: string | null;
    [key: string]: unknown; // allow other columns from SELECT *
}

// ── Feature Resolution (mirrors src/lib/plans/plan-access.ts logic) ─────

function resolveFeature(config: RawPlanConfigRow, feature: PlanFeature): boolean {
    if (config.plan_id === 'elite') return true;

    switch (feature) {
        case 'featured_boost':
            return !!config.featured_boost_level && config.featured_boost_level !== 'none';
        case 'verified_badge':
            return !!config.branding_level && config.branding_level !== 'none';
        case 'branding_tools':
            return config.branding_tools ?? false;
        case 'promotions':
            return !!config.promotions_level && config.promotions_level !== 'none';
        case 'advanced_analytics':
            return config.advanced_analytics ?? false;
        case 'ai_insights_analytics':
            return config.analytics === 'ai_insights';
        case 'ai_pricing':
            return config.ai_pricing ?? false;
        case 'ai_suggestions':
            return !!config.ai_suggestions && config.ai_suggestions !== 'none';
        case 'cook_helper_ai':
            return config.cook_helper_ai ?? false;
        case 'auto_whatsapp':
            return config.auto_whatsapp ?? false;
        case 'dedicated_manager':
            return config.dedicated_manager ?? false;
        case 'digital_khata':
            return config.digital_khata ?? false;
        case 'potluck':
            return config.potluck_uses_per_period !== 0;
        case 'highlighted_reviews':
            return config.reviews_highlighted ?? false;
        case 'advanced_order_tracking':
            return config.order_tracking_level === 'advanced';
        case 'premium_mobile_ui':
            return config.mobile_ui_level === 'premium_ui';
        default:
            return false;
    }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL is not set in .env.local');
        process.exit(1);
    }

    const sql = postgres(databaseUrl, { ssl: 'require' });

    try {
        const kitchenId = '44ce436a-e1f6-461d-8731-d6a0f5f3bac2'; // Shayan's kitchen

        // Find subscription
        const [sub] = await sql`
            SELECT * FROM subscriptions 
            WHERE kitchen_id = ${kitchenId} AND cancelled_at IS NULL AND status IN ('ACTIVE', 'TRIALING', 'PAST_DUE')
            ORDER BY created_at DESC LIMIT 1
        `;

        if (!sub) {
            console.log("No active subscription found.");
            return;
        }

        const [config] = await sql<RawPlanConfigRow[]>`
            SELECT * FROM plan_configs WHERE plan_id = ${sub.plan_id}
        `;

        console.log("Found Subscription:", sub);
        console.log("Found Plan Config:", config);

        console.log("\n--- Feature Tests for Starter Plan ---");
        console.log("cook_helper_ai:", resolveFeature(config, 'cook_helper_ai'));
        console.log("digital_khata:", resolveFeature(config, 'digital_khata'));
        console.log("potluck:", resolveFeature(config, 'potluck'));

        // Test what would happen if the plan was upgraded to Elite
        const [eliteConfig] = await sql<RawPlanConfigRow[]>`
            SELECT * FROM plan_configs WHERE plan_id = 'elite'
        `;
        console.log("\n--- Feature Tests for Elite Plan ---");
        console.log("cook_helper_ai:", resolveFeature(eliteConfig, 'cook_helper_ai'));
        console.log("digital_khata:", resolveFeature(eliteConfig, 'digital_khata'));
        console.log("potluck:", resolveFeature(eliteConfig, 'potluck'));

    } catch (e: unknown) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

main();

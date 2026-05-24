const postgres = require('postgres');
require('dotenv').config({ path: './.env.local' });

// We define resolveFeature exactly as in src/lib/plans/plan-access.ts
function resolveFeature(config, feature) {
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

async function main() {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

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

        const [config] = await sql`
            SELECT * FROM plan_configs WHERE plan_id = ${sub.plan_id}
        `;

        console.log("Found Subscription:", sub);
        console.log("Found Plan Config:", config);

        console.log("\n--- Feature Tests for Starter Plan ---");
        console.log("cook_helper_ai:", resolveFeature(config, 'cook_helper_ai'));
        console.log("digital_khata:", resolveFeature(config, 'digital_khata'));
        console.log("potluck:", resolveFeature(config, 'potluck'));

        // Let's test what would happen if the plan was upgraded to Elite
        const [eliteConfig] = await sql`
            SELECT * FROM plan_configs WHERE plan_id = 'elite'
        `;
        console.log("\n--- Feature Tests for Elite Plan ---");
        console.log("cook_helper_ai:", resolveFeature(eliteConfig, 'cook_helper_ai'));
        console.log("digital_khata:", resolveFeature(eliteConfig, 'digital_khata'));
        console.log("potluck:", resolveFeature(eliteConfig, 'potluck'));

    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

main();

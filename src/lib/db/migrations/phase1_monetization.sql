-- ═══════════════════════════════════════════════════════════════
-- PHASE 1: MONETIZATION ENGINE MIGRATION
-- Smart Tiffin — Safe to re-run (IF NOT EXISTS guards)
-- Run in Neon SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. ENUM ADDITIONS ──────────────────────────────────────────

ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'SUPERSEDED';
ALTER TYPE potluck_status_enum ADD VALUE IF NOT EXISTS 'DRAFT';

-- ─── 2. planConfigs: ADD MISSING COLUMNS ────────────────────────

ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS menu_item_limit_type VARCHAR(10) DEFAULT 'total';
ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS analytics VARCHAR(20) DEFAULT 'basic';
ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS support_level VARCHAR(20) DEFAULT 'standard';
ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS branding_level VARCHAR(30) DEFAULT 'none';
ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS ai_suggestions VARCHAR(20) DEFAULT 'none';
ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS cook_helper_ai BOOLEAN DEFAULT false;
ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS reviews_highlighted BOOLEAN DEFAULT false;
ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS order_tracking_level VARCHAR(20) DEFAULT 'standard';
ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS realtime_order_notifs BOOLEAN DEFAULT false;
ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS mobile_ui_level VARCHAR(20) DEFAULT 'standard';
ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS kitchen_listing_priority VARCHAR(30);

-- ─── 3. commission_ledger: INDEXES + DEFAULT FIX ────────────────

ALTER TABLE commission_ledger ALTER COLUMN status SET DEFAULT 'RECORDED';

CREATE INDEX IF NOT EXISTS idx_commission_kitchen ON commission_ledger (kitchen_id);
CREATE INDEX IF NOT EXISTS idx_commission_order ON commission_ledger (order_id);

-- ─── 4. CHECK CONSTRAINTS (safe DO blocks) ──────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_commission_rate_positive'
  ) THEN
    ALTER TABLE commission_ledger ADD CONSTRAINT chk_commission_rate_positive CHECK (commission_rate >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_amount_positive'
  ) THEN
    ALTER TABLE commission_ledger ADD CONSTRAINT chk_order_amount_positive CHECK (order_amount_rs > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_potluck_price_discount'
  ) THEN
    ALTER TABLE potluck_deals ADD CONSTRAINT chk_potluck_price_discount CHECK (price_per_plate_rs < regular_price_rs);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_potluck_target_lte_total'
  ) THEN
    ALTER TABLE potluck_deals ADD CONSTRAINT chk_potluck_target_lte_total CHECK (target_order_count <= total_plates_available);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_potluck_plates_positive'
  ) THEN
    ALTER TABLE potluck_deals ADD CONSTRAINT chk_potluck_plates_positive CHECK (total_plates_available > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_potluck_target_positive'
  ) THEN
    ALTER TABLE potluck_deals ADD CONSTRAINT chk_potluck_target_positive CHECK (target_order_count > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_potluck_order_qty_positive'
  ) THEN
    ALTER TABLE potluck_orders ADD CONSTRAINT chk_potluck_order_qty_positive CHECK (quantity > 0);
  END IF;
END $$;

-- ─── 5. SEED ALL 4 PLANS (UPSERT) ──────────────────────────────

INSERT INTO plan_configs (
  plan_id, display_name, price_rs, billing_period_months,
  menu_item_limit, menu_item_limit_type, monthly_order_limit,
  commission_rate, featured_boost_level,
  priority_support, branding_tools, promotions_level,
  advanced_analytics, ai_pricing, auto_whatsapp,
  dedicated_manager, chef_assistant, digital_khata,
  analytics, support_level, branding_level, ai_suggestions, cook_helper_ai,
  reviews_highlighted, order_tracking_level, realtime_order_notifs,
  mobile_ui_level, kitchen_listing_priority,
  potluck_uses_per_period, stripe_price_id, is_active, sort_order
) VALUES
  -- STARTER: Rs.599/month
  (
    'starter', 'Starter', 599, 1,
    7, 'total', 50,
    0.000, 'basic',
    false, false, NULL,
    false, false, false,
    false, false, false,
    'basic', 'standard', 'none', 'basic', false,
    false, 'standard', false,
    'standard', NULL,
    2, NULL, true, 1
  ),
  -- GROWTH: Rs.2,999/6 months
  (
    'growth', 'Growth', 2999, 6,
    14, 'total', 200,
    0.000, 'limited',
    true, true, 'limited',
    false, false, false,
    false, true, false,
    'medium', 'priority', 'verified_badge', 'medium', true,
    false, 'standard', false,
    'standard', NULL,
    10, NULL, true, 2
  ),
  -- PRO: Rs.5,499/year
  (
    'pro', 'Pro', 5499, 12,
    15, 'daily', 2000,
    0.000, 'high_priority',
    false, true, 'limited',
    true, false, false,
    false, true, true,
    'advanced', 'standard', 'logo_badge_banner', 'advanced', true,
    false, 'standard', false,
    'standard', NULL,
    12, NULL, true, 3
  ),
  -- ELITE: Rs.11,999/year
  (
    'elite', 'Elite', 11999, 12,
    NULL, 'total', NULL,
    0.000, 'top_placement',
    true, true, 'full',
    true, true, true,
    true, true, true,
    'ai_insights', 'dedicated_24_7', 'personal_brand_boost', 'full', true,
    true, 'advanced', true,
    'premium_ui', 'top_priority_city',
    -1, NULL, true, 4
  )
ON CONFLICT (plan_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_rs = EXCLUDED.price_rs,
  billing_period_months = EXCLUDED.billing_period_months,
  menu_item_limit = EXCLUDED.menu_item_limit,
  menu_item_limit_type = EXCLUDED.menu_item_limit_type,
  monthly_order_limit = EXCLUDED.monthly_order_limit,
  commission_rate = EXCLUDED.commission_rate,
  featured_boost_level = EXCLUDED.featured_boost_level,
  priority_support = EXCLUDED.priority_support,
  branding_tools = EXCLUDED.branding_tools,
  promotions_level = EXCLUDED.promotions_level,
  advanced_analytics = EXCLUDED.advanced_analytics,
  ai_pricing = EXCLUDED.ai_pricing,
  auto_whatsapp = EXCLUDED.auto_whatsapp,
  dedicated_manager = EXCLUDED.dedicated_manager,
  chef_assistant = EXCLUDED.chef_assistant,
  digital_khata = EXCLUDED.digital_khata,
  analytics = EXCLUDED.analytics,
  support_level = EXCLUDED.support_level,
  branding_level = EXCLUDED.branding_level,
  ai_suggestions = EXCLUDED.ai_suggestions,
  cook_helper_ai = EXCLUDED.cook_helper_ai,
  reviews_highlighted = EXCLUDED.reviews_highlighted,
  order_tracking_level = EXCLUDED.order_tracking_level,
  realtime_order_notifs = EXCLUDED.realtime_order_notifs,
  mobile_ui_level = EXCLUDED.mobile_ui_level,
  kitchen_listing_priority = EXCLUDED.kitchen_listing_priority,
  potluck_uses_per_period = EXCLUDED.potluck_uses_per_period,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ─── 6. VERIFY ──────────────────────────────────────────────────

SELECT plan_id, display_name, price_rs, billing_period_months,
       menu_item_limit, analytics, support_level, branding_level,
       potluck_uses_per_period, sort_order
FROM plan_configs
ORDER BY sort_order;

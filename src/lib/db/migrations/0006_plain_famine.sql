CREATE TYPE "public"."khata_entry_type_enum" AS ENUM('INCOME', 'EXPENSE', 'WITHDRAWAL', 'COMMISSION', 'REFUND', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."plan_config_enum" AS ENUM('starter', 'growth', 'pro', 'elite');--> statement-breakpoint
CREATE TYPE "public"."potluck_status_enum" AS ENUM('PENDING', 'ACTIVE', 'FILLED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "commission_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"cook_id" uuid NOT NULL,
	"plan_id" "plan_config_enum" NOT NULL,
	"order_amount_rs" numeric(10, 2) NOT NULL,
	"commission_rate" numeric(4, 3) NOT NULL,
	"commission_amount_rs" numeric(10, 2) NOT NULL,
	"net_amount_rs" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING',
	"collected_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "khata_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"cook_id" uuid NOT NULL,
	"entry_type" "khata_entry_type_enum" NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"amount_rs" numeric(10, 2) NOT NULL,
	"is_credit" boolean NOT NULL,
	"reference_id" uuid,
	"reference_type" varchar(50),
	"entry_date" date NOT NULL,
	"is_auto_generated" boolean DEFAULT false,
	"is_cancelled" boolean DEFAULT false,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" varchar(200),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plan_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" "plan_config_enum" NOT NULL,
	"display_name" varchar(50) NOT NULL,
	"price_rs" integer NOT NULL,
	"billing_period_months" integer NOT NULL,
	"menu_item_limit" integer,
	"monthly_order_limit" integer,
	"commission_rate" numeric(4, 3) NOT NULL,
	"featured_boost_level" varchar(20),
	"priority_support" boolean DEFAULT false,
	"branding_tools" boolean DEFAULT false,
	"promotions_level" varchar(20),
	"advanced_analytics" boolean DEFAULT false,
	"ai_pricing" boolean DEFAULT false,
	"auto_whatsapp" boolean DEFAULT false,
	"dedicated_manager" boolean DEFAULT false,
	"chef_assistant" boolean DEFAULT false,
	"digital_khata" boolean DEFAULT false,
	"potluck_uses_per_period" integer NOT NULL,
	"stripe_price_id" varchar(100),
	"is_active" boolean DEFAULT true,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "plan_configs_plan_id_unique" UNIQUE("plan_id")
);
--> statement-breakpoint
CREATE TABLE "plan_usage_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"current_usage" integer NOT NULL,
	"limit_value" integer,
	"was_allowed" boolean NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "potluck_deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"cook_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"meal_id" uuid,
	"total_plates_available" integer NOT NULL,
	"target_order_count" integer NOT NULL,
	"price_per_plate_rs" numeric(10, 2) NOT NULL,
	"regular_price_rs" numeric(10, 2) NOT NULL,
	"current_order_count" integer DEFAULT 0,
	"status" "potluck_status_enum" NOT NULL,
	"activates_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"activated_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" varchar(100),
	"image_url" varchar(500),
	"city" varchar(100),
	"city_slug" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "potluck_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"potluck_deal_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_amount_rs" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'RESERVED',
	"reserved_at" timestamp with time zone DEFAULT now(),
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_plan_id_premium_plans_id_fk";
--> statement-breakpoint
DROP INDEX "reviews_user_kitchen_idx";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "plan_id";
ALTER TABLE "subscriptions" ADD COLUMN "plan_id" "public"."plan_config_enum" NOT NULL DEFAULT 'starter';--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "current_period_start" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "current_period_end" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "cleared_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "trial_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "orders_used_this_month" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "orders_reset_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "potluck_uses_remaining" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "potluck_uses_reset_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" varchar(20);--> statement-breakpoint
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "khata_entries" ADD CONSTRAINT "khata_entries_kitchen_id_kitchens_id_fk" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "khata_entries" ADD CONSTRAINT "khata_entries_cook_id_users_id_fk" FOREIGN KEY ("cook_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_reviews" ADD CONSTRAINT "platform_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "potluck_deals" ADD CONSTRAINT "potluck_deals_kitchen_id_kitchens_id_fk" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "potluck_deals" ADD CONSTRAINT "potluck_deals_cook_id_users_id_fk" FOREIGN KEY ("cook_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "potluck_deals" ADD CONSTRAINT "potluck_deals_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "potluck_deals" ADD CONSTRAINT "potluck_deals_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "potluck_orders" ADD CONSTRAINT "potluck_orders_potluck_deal_id_potluck_deals_id_fk" FOREIGN KEY ("potluck_deal_id") REFERENCES "public"."potluck_deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "potluck_orders" ADD CONSTRAINT "potluck_orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "potluck_orders" ADD CONSTRAINT "potluck_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_khata_kitchen_date" ON "khata_entries" USING btree ("kitchen_id","entry_date");--> statement-breakpoint
CREATE INDEX "idx_khata_kitchen_type" ON "khata_entries" USING btree ("kitchen_id","entry_type");--> statement-breakpoint
CREATE INDEX "idx_usage_log_kitchen_action" ON "plan_usage_log" USING btree ("kitchen_id","action_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_potluck_kitchen_status" ON "potluck_deals" USING btree ("kitchen_id","status");--> statement-breakpoint
CREATE INDEX "idx_potluck_active_city" ON "potluck_deals" USING btree ("city_slug","status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_potluck_customer" ON "potluck_orders" USING btree ("potluck_deal_id","customer_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_expires_at" ON "notifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_cleared" ON "notifications" USING btree ("user_id","cleared_at");--> statement-breakpoint
CREATE INDEX "reviews_user_kitchen_idx" ON "reviews" USING btree ("user_id","kitchen_id");
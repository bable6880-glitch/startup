ALTER TYPE "public"."potluck_status_enum" ADD VALUE 'DRAFT' BEFORE 'PENDING';--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE 'SUPERSEDED';--> statement-breakpoint
ALTER TABLE "commission_ledger" ALTER COLUMN "status" SET DEFAULT 'RECORDED';--> statement-breakpoint
ALTER TABLE "plan_configs" ADD COLUMN "menu_item_limit_type" varchar(10) DEFAULT 'total';--> statement-breakpoint
ALTER TABLE "plan_configs" ADD COLUMN "analytics" varchar(20) DEFAULT 'basic';--> statement-breakpoint
ALTER TABLE "plan_configs" ADD COLUMN "support_level" varchar(20) DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "plan_configs" ADD COLUMN "branding_level" varchar(30) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "plan_configs" ADD COLUMN "ai_suggestions" varchar(20) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "plan_configs" ADD COLUMN "cook_helper_ai" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "plan_configs" ADD COLUMN "reviews_highlighted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "plan_configs" ADD COLUMN "order_tracking_level" varchar(20) DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "plan_configs" ADD COLUMN "realtime_order_notifs" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "plan_configs" ADD COLUMN "mobile_ui_level" varchar(20) DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "plan_configs" ADD COLUMN "kitchen_listing_priority" varchar(30);--> statement-breakpoint
CREATE INDEX "idx_commission_kitchen" ON "commission_ledger" USING btree ("kitchen_id");--> statement-breakpoint
CREATE INDEX "idx_commission_order" ON "commission_ledger" USING btree ("order_id");
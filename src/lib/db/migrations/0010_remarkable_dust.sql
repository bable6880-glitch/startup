CREATE TYPE "public"."pack_type_enum" AS ENUM('ORDER_PACK', 'POTLUCK_PACK');--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE 'UPGRADED';--> statement-breakpoint
CREATE TABLE "extra_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"cook_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"pack_type" "pack_type_enum" NOT NULL,
	"pack_size" integer NOT NULL,
	"price_rs" integer NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING',
	"stripe_session_id" varchar(200),
	"activated_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"orders_added" integer DEFAULT 0,
	"potluck_added" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"cook_id" uuid NOT NULL,
	"plan_id" "plan_config_enum" NOT NULL,
	"status" varchar(20) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"end_reason" varchar(50),
	"price_rs_paid" integer NOT NULL,
	"stripe_session_id" varchar(200),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "kitchens" ADD COLUMN "plan_id" "plan_config_enum";--> statement-breakpoint
ALTER TABLE "kitchens" ADD COLUMN "is_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "kitchens" ADD COLUMN "lock_reason" varchar(50);--> statement-breakpoint
ALTER TABLE "kitchens" ADD COLUMN "locked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "kitchens" ADD COLUMN "locked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "extra_orders_limit" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "extra_potluck_uses" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "extra_packs" ADD CONSTRAINT "extra_packs_kitchen_id_kitchens_id_fk" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extra_packs" ADD CONSTRAINT "extra_packs_cook_id_users_id_fk" FOREIGN KEY ("cook_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extra_packs" ADD CONSTRAINT "extra_packs_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_kitchen_id_kitchens_id_fk" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_cook_id_users_id_fk" FOREIGN KEY ("cook_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_packs_kitchen" ON "extra_packs" USING btree ("kitchen_id","pack_type","status");--> statement-breakpoint
CREATE INDEX "idx_sub_history_kitchen" ON "subscription_history" USING btree ("kitchen_id","created_at");
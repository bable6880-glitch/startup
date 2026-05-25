CREATE TABLE "stripe_processed_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(100) NOT NULL,
	"status" varchar(20) NOT NULL,
	"error" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kitchens" ALTER COLUMN "status" SET DEFAULT 'INACTIVE';--> statement-breakpoint
CREATE INDEX "idx_stripe_event_status" ON "stripe_processed_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_stripe_event_created" ON "stripe_processed_events" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "kitchens" DROP COLUMN "trial_ends_at";--> statement-breakpoint
ALTER TABLE "kitchens" DROP COLUMN "is_trial_used";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "trial_ends_at";
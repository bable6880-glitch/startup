ALTER TABLE "orders" ADD COLUMN "customer_name" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_address" text;
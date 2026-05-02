ALTER TABLE "admin_audit_log" DROP CONSTRAINT "admin_audit_log_admin_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;
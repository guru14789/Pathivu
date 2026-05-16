CREATE TYPE "public"."scan_action" AS ENUM('viewed', 'fault_logged', 'condition_updated', 'job_card_created');--> statement-breakpoint
ALTER TABLE "assets" DROP CONSTRAINT "assets_vendor_id_vendors_vendor_id_fk";
--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "department" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "asset_tag" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "purchase_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "warranty_expiry" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "custom_attributes" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "qr_codes" ALTER COLUMN "format" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "qr_codes" ALTER COLUMN "r2_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "qr_codes" ALTER COLUMN "generated_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scan_events" ALTER COLUMN "asset_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scan_events" ALTER COLUMN "action_taken" SET DATA TYPE "public"."scan_action" USING "action_taken"::"public"."scan_action";--> statement-breakpoint
ALTER TABLE "asset_assignments" ALTER COLUMN "asset_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_assignments" ALTER COLUMN "assigned_to" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_assignments" ALTER COLUMN "assigned_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_assignments" ALTER COLUMN "assigned_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "hospitals" ADD COLUMN "code" varchar(3) NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_categories" ADD COLUMN "code" varchar(3) NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_categories" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD COLUMN "r2_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "notes" text;--> statement-breakpoint
CREATE INDEX "asset_hospital_idx" ON "assets" USING btree ("hospital_id");--> statement-breakpoint
CREATE INDEX "asset_status_idx" ON "assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "asset_tag_idx" ON "assets" USING btree ("asset_tag");--> statement-breakpoint
CREATE INDEX "asset_serial_idx" ON "assets" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "scan_asset_idx" ON "scan_events" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "scan_at_idx" ON "scan_events" USING btree ("scanned_at");
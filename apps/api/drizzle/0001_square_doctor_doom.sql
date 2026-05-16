CREATE TYPE "public"."asset_condition" AS ENUM('good', 'fair', 'poor', 'critical');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('active', 'maintenance', 'condemned', 'transferred');--> statement-breakpoint
CREATE TYPE "public"."depreciation_method" AS ENUM('SLM', 'WDV');--> statement-breakpoint
CREATE TYPE "public"."qr_format" AS ENUM('qr', 'barcode_code128', 'barcode_ean13');--> statement-breakpoint
CREATE TYPE "public"."fault_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('open', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('PPM', 'breakdown', 'calibration', 'inspection');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('P1', 'P2', 'P3');--> statement-breakpoint
CREATE TYPE "public"."schedule_type" AS ENUM('PPM', 'calibration', 'statutory');--> statement-breakpoint
CREATE TYPE "public"."compliance_status" AS ENUM('valid', 'expiring_soon', 'expired');--> statement-breakpoint
CREATE TABLE "asset_categories" (
	"category_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" uuid,
	"name" varchar(100) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"location_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" uuid NOT NULL,
	"building" varchar(100),
	"floor" varchar(20),
	"room_number" varchar(20),
	"department" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"vendor_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"contact_person" varchar(100),
	"email" varchar(150),
	"phone" varchar(30),
	"address" text,
	"gst_number" varchar(20),
	"performance_rating" numeric(3, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"asset_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" uuid NOT NULL,
	"category_id" uuid,
	"location_id" uuid,
	"vendor_id" uuid,
	"asset_tag" varchar(50),
	"name" varchar(150) NOT NULL,
	"serial_number" varchar(100),
	"model" varchar(100),
	"manufacturer" varchar(100),
	"purchase_date" date,
	"purchase_cost" numeric(12, 2),
	"warranty_expiry" date,
	"useful_life_years" integer,
	"salvage_value" numeric(12, 2),
	"depreciation_method" "depreciation_method",
	"status" "asset_status" DEFAULT 'active',
	"condition" "asset_condition" DEFAULT 'good',
	"is_critical" boolean DEFAULT false,
	"custom_attributes" jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "assets_asset_tag_unique" UNIQUE("asset_tag"),
	CONSTRAINT "assets_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"qr_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"format" "qr_format" DEFAULT 'qr',
	"r2_url" text,
	"is_active" boolean DEFAULT true,
	"generated_by" uuid,
	"generated_at" timestamp with time zone DEFAULT now(),
	"print_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "scan_events" (
	"scan_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"scanned_by" uuid,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar(50),
	"user_agent" text,
	"gps_lat" numeric(9, 6),
	"gps_lng" numeric(9, 6),
	"action_taken" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "fault_reports" (
	"fault_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"reported_by" uuid,
	"fault_type" varchar(100),
	"description" text NOT NULL,
	"severity" "severity" DEFAULT 'medium',
	"photo_url" text,
	"status" "fault_status" DEFAULT 'open',
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"reported_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "maintenance_logs" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"fault_id" uuid,
	"assigned_to" uuid,
	"approved_by" uuid,
	"maintenance_type" "maintenance_type" NOT NULL,
	"priority" "priority" DEFAULT 'P2',
	"status" "maintenance_status" DEFAULT 'open',
	"scheduled_date" date,
	"completed_date" date,
	"downtime_hours" numeric(6, 2),
	"cost" numeric(12, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "maintenance_schedules" (
	"schedule_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"schedule_type" "schedule_type" NOT NULL,
	"frequency" varchar(50),
	"last_service_date" date,
	"next_service_date" date,
	"alert_30_sent" boolean DEFAULT false,
	"alert_60_sent" boolean DEFAULT false,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "amc_contracts" (
	"contract_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid,
	"asset_id" uuid,
	"category_id" uuid,
	"hospital_id" uuid,
	"start_date" date,
	"end_date" date,
	"contract_value" numeric(12, 2),
	"response_sla_hours" integer,
	"document_url" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "compliance_documents" (
	"doc_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"hospital_id" uuid,
	"cert_type" varchar(100),
	"issued_by" varchar(150),
	"issued_date" date,
	"expiry_date" date NOT NULL,
	"document_url" text,
	"status" "compliance_status" DEFAULT 'valid',
	"uploaded_by" uuid
);
--> statement-breakpoint
CREATE TABLE "asset_assignments" (
	"assignment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"assigned_to" uuid,
	"location_id" uuid,
	"assigned_by" uuid,
	"assigned_date" date DEFAULT now() NOT NULL,
	"return_date" date
);
--> statement-breakpoint
CREATE TABLE "spare_parts" (
	"part_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" uuid,
	"vendor_id" uuid,
	"name" varchar(150) NOT NULL,
	"barcode" varchar(100),
	"unit" varchar(30),
	"stock_quantity" integer DEFAULT 0,
	"reorder_threshold" integer DEFAULT 10,
	"unit_cost" numeric(10, 2)
);
--> statement-breakpoint
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_hospital_id_hospitals_hospital_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("hospital_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_hospital_id_hospitals_hospital_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("hospital_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_hospital_id_hospitals_hospital_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("hospital_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_asset_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_location_id_locations_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_vendor_id_vendors_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("vendor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_generated_by_users_user_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_scanned_by_users_user_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fault_reports" ADD CONSTRAINT "fault_reports_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fault_reports" ADD CONSTRAINT "fault_reports_reported_by_users_user_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fault_reports" ADD CONSTRAINT "fault_reports_resolved_by_users_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_fault_id_fault_reports_fault_id_fk" FOREIGN KEY ("fault_id") REFERENCES "public"."fault_reports"("fault_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_assigned_to_users_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_approved_by_users_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amc_contracts" ADD CONSTRAINT "amc_contracts_vendor_id_vendors_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("vendor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amc_contracts" ADD CONSTRAINT "amc_contracts_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amc_contracts" ADD CONSTRAINT "amc_contracts_category_id_asset_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amc_contracts" ADD CONSTRAINT "amc_contracts_hospital_id_hospitals_hospital_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("hospital_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_hospital_id_hospitals_hospital_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("hospital_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_uploaded_by_users_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assigned_to_users_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_location_id_locations_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assigned_by_users_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_hospital_id_hospitals_hospital_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("hospital_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_vendor_id_vendors_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("vendor_id") ON DELETE no action ON UPDATE no action;
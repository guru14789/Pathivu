CREATE TYPE "public"."role" AS ENUM('super_admin', 'branch_admin', 'supervisor', 'technician', 'auditor', 'vendor');--> statement-breakpoint
CREATE TYPE "public"."action" AS ENUM('INSERT', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TABLE "hospitals" (
	"hospital_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"city" varchar(100),
	"address" text,
	"contact_person" varchar(100),
	"phone" varchar(30),
	"bed_count" integer DEFAULT 200,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" uuid,
	"full_name" varchar(150) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"department" varchar(100),
	"is_active" boolean DEFAULT true,
	"created_by" uuid,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"action" "action" NOT NULL,
	"changed_by" uuid,
	"changed_at" timestamp with time zone DEFAULT now(),
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(50)
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_hospital_id_hospitals_hospital_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("hospital_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_changed_by_users_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
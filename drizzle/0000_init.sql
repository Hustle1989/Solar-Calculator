CREATE TYPE "public"."equipment_kind" AS ENUM('panel', 'battery', 'inverter');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('customer', 'rep', 'admin');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('new', 'assigned', 'quote_sent', 'deposit_paid', 'site_survey', 'installation', 'completed');--> statement-breakpoint
CREATE TABLE "appliances" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"watts" integer NOT NULL,
	"hours" double precision NOT NULL,
	"category" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" text NOT NULL,
	"backup_hours" double precision NOT NULL,
	"lines" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"price_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "equipment_kind" NOT NULL,
	"name" text NOT NULL,
	"spec" double precision NOT NULL,
	"price_kobo" bigint NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" "role" DEFAULT 'customer' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"city" text,
	"address" text,
	"property_type" text,
	"title" text,
	"stage" "stage" DEFAULT 'new' NOT NULL,
	"assigned_rep_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"deposit_percent" integer NOT NULL,
	"peak_sun_hours" double precision NOT NULL,
	"system_efficiency" double precision NOT NULL,
	"battery_dod" double precision NOT NULL,
	"inverter_efficiency" double precision NOT NULL,
	"inverter_safety_factor" double precision NOT NULL,
	"power_factor" double precision NOT NULL,
	"install_percent" double precision NOT NULL,
	"accessories_percent" double precision NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_single_row" CHECK ("settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "stage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" text NOT NULL,
	"from_stage" "stage",
	"to_stage" "stage" NOT NULL,
	"changed_by" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calculations" ADD CONSTRAINT "calculations_customer_id_profiles_user_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_assigned_rep_id_profiles_user_id_fk" FOREIGN KEY ("assigned_rep_id") REFERENCES "public"."profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_events" ADD CONSTRAINT "stage_events_customer_id_profiles_user_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calculations_customer_idx" ON "calculations" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "profiles_rep_idx" ON "profiles" USING btree ("assigned_rep_id");--> statement-breakpoint
CREATE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "stage_events_customer_idx" ON "stage_events" USING btree ("customer_id","created_at");
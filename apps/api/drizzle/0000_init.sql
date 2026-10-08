CREATE TYPE "public"."worker_role" AS ENUM('worker', 'coordinator');--> statement-breakpoint
CREATE TYPE "public"."access_level" AS ENUM('none', 'limited', 'reliable');--> statement-breakpoint
CREATE TYPE "public"."work_type" AS ENUM('delivery_rider', 'security_guard', 'construction', 'street_vendor', 'sanitation', 'other');--> statement-breakpoint
CREATE TYPE "public"."relief_point_type" AS ENUM('water', 'shade', 'clinic', 'cooling_space', 'canteen');--> statement-breakpoint
CREATE TYPE "public"."check_in_status" AS ENUM('okay', 'need_water', 'need_break', 'unwell');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" "worker_role" DEFAULT 'worker' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"work_type" "work_type" NOT NULL,
	"city" varchar(120) NOT NULL,
	"default_shift_start" text DEFAULT '09:00' NOT NULL,
	"default_shift_end" text DEFAULT '18:00' NOT NULL,
	"water_access" "access_level" DEFAULT 'limited' NOT NULL,
	"shade_access" "access_level" DEFAULT 'limited' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relief_points" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "relief_point_type" NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"address" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"opening_hours" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "check_in_status" NOT NULL,
	"latitude" real,
	"longitude" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
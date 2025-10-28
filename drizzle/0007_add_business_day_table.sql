-- Migration: Add Business Day Management Table
-- This migration adds business day open/close functionality

-- Business Day Management Table
CREATE TABLE IF NOT EXISTS "pos_business_day" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"status" text NOT NULL,
	"opened_at" timestamp,
	"closed_at" timestamp,
	"opened_by" text,
	"closed_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "pos_business_day_date_idx" ON "pos_business_day" ("date");

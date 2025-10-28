-- Migration: Add Daily Closing Tables
-- This migration adds daily closing functionality to the POS system

-- Daily Closing Table
CREATE TABLE IF NOT EXISTS "pos_daily_closing" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"agent_id" integer NOT NULL,
	"agent_name" text NOT NULL,
	-- Auto-calculated amounts from orders
	"total_cash_orders" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_card_orders" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_jazzcash_orders" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_easypaisa_orders" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_credit_orders" numeric(10, 2) DEFAULT '0' NOT NULL,
	-- Manual cash reconciliation
	"cash_received" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency_notes_5000" integer DEFAULT 0 NOT NULL,
	"currency_notes_1000" integer DEFAULT 0 NOT NULL,
	"currency_notes_500" integer DEFAULT 0 NOT NULL,
	"currency_notes_100" integer DEFAULT 0 NOT NULL,
	"currency_notes_50" integer DEFAULT 0 NOT NULL,
	"currency_notes_20" integer DEFAULT 0 NOT NULL,
	"currency_notes_10" integer DEFAULT 0 NOT NULL,
	-- Calculated totals
	"calculated_cash_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"cash_difference" numeric(10, 2) DEFAULT '0' NOT NULL,
	-- Status
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Daily Closing Logs Table
CREATE TABLE IF NOT EXISTS "pos_daily_closing_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"closing_id" integer NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"performed_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "pos_daily_closing_date_idx" ON "pos_daily_closing" ("date");
CREATE INDEX IF NOT EXISTS "pos_daily_closing_logs_closing_id_idx" ON "pos_daily_closing_logs" ("closing_id");

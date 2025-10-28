-- Migration: Add Credit Payment Tracking Fields
-- This migration adds fields to track credit payment status in orders

-- Add credit payment tracking fields to pos_orders table
ALTER TABLE "pos_orders" 
ADD COLUMN IF NOT EXISTS "credit_paid" boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "credit_paid_at" timestamp,
ADD COLUMN IF NOT EXISTS "credit_paid_by" text;

-- Create index for better performance on credit payment queries
CREATE INDEX IF NOT EXISTS "pos_orders_credit_paid_idx" ON "pos_orders" ("credit_paid");
CREATE INDEX IF NOT EXISTS "pos_orders_payment_method_idx" ON "pos_orders" ("payment_method");

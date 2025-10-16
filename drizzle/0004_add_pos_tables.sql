-- Migration: Add POS System Tables
-- This migration adds all the POS system tables to the existing dashboard database

-- POS Products Table
CREATE TABLE IF NOT EXISTS "pos_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"category" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- POS Customers Table
CREATE TABLE IF NOT EXISTS "pos_customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone_number" text,
	"email" text,
	"address" text,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"total_spent" numeric(10, 2) DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- POS Riders Table
CREATE TABLE IF NOT EXISTS "pos_riders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone_number" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- POS Orders Table
CREATE TABLE IF NOT EXISTS "pos_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text UNIQUE NOT NULL,
	"customer_id" integer,
	"rider_id" integer,
	"total_amount" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT 0 NOT NULL,
	"final_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"order_type" text DEFAULT 'dine-in' NOT NULL,
	"payment_method" text,
	"transaction_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- POS Order Items Table
CREATE TABLE IF NOT EXISTS "pos_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"sub_total" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- POS Daily Sales Table
CREATE TABLE IF NOT EXISTS "pos_daily_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(10, 2) DEFAULT 0 NOT NULL,
	"total_discounts" numeric(10, 2) DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- POS Hourly Sales Table
CREATE TABLE IF NOT EXISTS "pos_hourly_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"hour" integer NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(10, 2) DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- POS Coupons Table
CREATE TABLE IF NOT EXISTS "pos_coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text UNIQUE NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"min_order_amount" numeric(10, 2),
	"max_discount" numeric(10, 2),
	"usage_limit" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- POS Loyalty Transactions Table
CREATE TABLE IF NOT EXISTS "pos_loyalty_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"order_id" integer,
	"points" integer NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- POS Admin Users Table
CREATE TABLE IF NOT EXISTS "pos_admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text UNIQUE NOT NULL,
	"password" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "pos_daily_sales_date_idx" ON "pos_daily_sales" ("date");
CREATE INDEX IF NOT EXISTS "pos_hourly_sales_date_hour_idx" ON "pos_hourly_sales" ("date","hour");

-- Insert sample products
INSERT INTO "pos_products" ("name", "price", "category", "is_active") VALUES
('Chicken Shawarma', 250.00, 'Shawarma', true),
('Beef Shawarma', 300.00, 'Shawarma', true),
('Mixed Shawarma', 350.00, 'Shawarma', true),
('Chicken Wrap', 200.00, 'Wraps', true),
('Beef Wrap', 250.00, 'Wraps', true),
('French Fries', 100.00, 'Sides', true),
('Onion Rings', 120.00, 'Sides', true),
('Coca Cola', 80.00, 'Drinks', true),
('Sprite', 80.00, 'Drinks', true),
('Water Bottle', 50.00, 'Drinks', true)
ON CONFLICT DO NOTHING;

-- Insert sample riders
INSERT INTO "pos_riders" ("name", "phone_number", "is_active") VALUES
('Ahmed Ali', '03001234567', true),
('Muhammad Hassan', '03001234568', true),
('Ali Raza', '03001234569', true)
ON CONFLICT DO NOTHING;

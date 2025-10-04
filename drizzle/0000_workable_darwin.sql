CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"category" text NOT NULL,
	"item" text,
	"qty" numeric(12, 3),
	"unit" text,
	"unit_price" numeric(12, 2),
	"amount" numeric(12, 2) NOT NULL,
	"vendor" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"source" text NOT NULL,
	"orders" integer DEFAULT 0 NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expenses_item_idx" ON "expenses" USING btree ("item");--> statement-breakpoint
CREATE INDEX "sales_date_source_idx" ON "sales" USING btree ("date","source");
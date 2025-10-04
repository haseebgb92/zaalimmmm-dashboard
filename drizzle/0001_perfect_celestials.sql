DROP INDEX "expenses_category_idx";--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "item" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "unit_price";--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "vendor";
CREATE TABLE "personal_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"head" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "personal_expenses_date_idx" ON "personal_expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "personal_expenses_head_idx" ON "personal_expenses" USING btree ("head");
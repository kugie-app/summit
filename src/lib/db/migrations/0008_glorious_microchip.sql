ALTER TABLE "invoices" ADD COLUMN "recurring" varchar(20) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "next_due_date" date;
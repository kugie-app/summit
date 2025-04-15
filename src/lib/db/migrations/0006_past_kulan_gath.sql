ALTER TABLE "invoices" ADD COLUMN "currency" varchar(10) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "xendit_invoice_id" varchar(255);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "xendit_invoice_url" varchar(2048);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_processor_reference" varchar(255);
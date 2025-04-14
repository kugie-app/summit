ALTER TABLE "quotes" DROP CONSTRAINT "quotes_converted_to_invoice_id_invoices_id_fk";
--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" DROP COLUMN "converted_to_invoice_id";
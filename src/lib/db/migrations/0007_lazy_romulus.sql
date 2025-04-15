ALTER TABLE "accounts" ALTER COLUMN "currency" SET DEFAULT 'IDR';--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "currency" SET DEFAULT 'IDR';--> statement-breakpoint
ALTER TABLE "income" ALTER COLUMN "currency" SET DEFAULT 'IDR';--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "currency" SET DEFAULT 'IDR';--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'IDR';--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'IDR';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "default_currency" varchar(10) DEFAULT 'IDR' NOT NULL;
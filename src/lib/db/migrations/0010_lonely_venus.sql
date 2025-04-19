CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"address" text,
	"website" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"soft_delete" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "vendor_id" integer;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
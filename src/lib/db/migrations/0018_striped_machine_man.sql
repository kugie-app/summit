CREATE TYPE "public"."forecast_scope_type" AS ENUM('global', 'stream', 'item');--> statement-breakpoint
CREATE TYPE "public"."forecast_stream_type" AS ENUM('revenue', 'expense');--> statement-breakpoint
CREATE TABLE "forecast_growth_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"forecast_id" integer NOT NULL,
	"scope_type" "forecast_scope_type" NOT NULL,
	"scope_id" integer,
	"year" integer NOT NULL,
	"growth_rate" numeric(6, 4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"forecast_id" integer NOT NULL,
	"stream_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"income_category_id" integer,
	"expense_category_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_period_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"forecast_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"period" varchar(7) NOT NULL,
	"amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_seasonality_weights" (
	"id" serial PRIMARY KEY NOT NULL,
	"forecast_id" integer NOT NULL,
	"scope_type" "forecast_scope_type" NOT NULL,
	"scope_id" integer,
	"month" integer NOT NULL,
	"weight" numeric(6, 4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"forecast_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "forecast_stream_type" NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_variables" (
	"id" serial PRIMARY KEY NOT NULL,
	"forecast_id" integer NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" numeric(15, 4) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"start_date" varchar(7) NOT NULL,
	"end_date" varchar(7) NOT NULL,
	"currency" varchar(10) DEFAULT 'IDR' NOT NULL,
	"soft_delete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forecast_growth_rules" ADD CONSTRAINT "forecast_growth_rules_forecast_id_forecasts_id_fk" FOREIGN KEY ("forecast_id") REFERENCES "public"."forecasts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_items" ADD CONSTRAINT "forecast_items_forecast_id_forecasts_id_fk" FOREIGN KEY ("forecast_id") REFERENCES "public"."forecasts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_items" ADD CONSTRAINT "forecast_items_stream_id_forecast_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."forecast_streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_items" ADD CONSTRAINT "forecast_items_income_category_id_income_categories_id_fk" FOREIGN KEY ("income_category_id") REFERENCES "public"."income_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_items" ADD CONSTRAINT "forecast_items_expense_category_id_expense_categories_id_fk" FOREIGN KEY ("expense_category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_period_values" ADD CONSTRAINT "forecast_period_values_forecast_id_forecasts_id_fk" FOREIGN KEY ("forecast_id") REFERENCES "public"."forecasts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_period_values" ADD CONSTRAINT "forecast_period_values_item_id_forecast_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."forecast_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_seasonality_weights" ADD CONSTRAINT "forecast_seasonality_weights_forecast_id_forecasts_id_fk" FOREIGN KEY ("forecast_id") REFERENCES "public"."forecasts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_streams" ADD CONSTRAINT "forecast_streams_forecast_id_forecasts_id_fk" FOREIGN KEY ("forecast_id") REFERENCES "public"."forecasts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_variables" ADD CONSTRAINT "forecast_variables_forecast_id_forecasts_id_fk" FOREIGN KEY ("forecast_id") REFERENCES "public"."forecasts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "forecast_period_values_item_period_idx" ON "forecast_period_values" USING btree ("item_id","period");--> statement-breakpoint
CREATE UNIQUE INDEX "forecast_seasonality_weights_unique_idx" ON "forecast_seasonality_weights" USING btree ("forecast_id","scope_type","scope_id","month");
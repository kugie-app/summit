CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "client_login_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "client_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password" text,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"token_version" integer DEFAULT 0 NOT NULL,
	"soft_delete" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" "role" DEFAULT 'staff' NOT NULL,
	"token" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "client_login_tokens" ADD CONSTRAINT "client_login_tokens_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_invitations" ADD CONSTRAINT "company_invitations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "client_login_tokens_token_idx" ON "client_login_tokens" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "client_users_email_idx" ON "client_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "client_users_client_id_idx" ON "client_users" USING btree ("client_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "company_invitations_token_idx" ON "company_invitations" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "company_invitations_email_company_idx" ON "company_invitations" USING btree ("email","company_id");
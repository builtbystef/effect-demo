CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"kind" text NOT NULL,
	"body" text NOT NULL,
	"contact_id" uuid,
	"company_id" uuid,
	"deal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activities_kind_check" CHECK ("kind" in ('note', 'call', 'email', 'meeting'))
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"domain" text,
	"industry" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_name_check" CHECK (length("name") BETWEEN 1 AND 200)
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"title" text,
	"status" text DEFAULT 'lead' NOT NULL,
	"company_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_status_check" CHECK ("status" in ('lead', 'prospect', 'customer', 'churned'))
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"stage" text DEFAULT 'lead' NOT NULL,
	"company_id" uuid,
	"contact_id" uuid,
	"expected_close_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deals_value_check" CHECK ("value" >= 0),
	CONSTRAINT "deals_stage_check" CHECK ("stage" in ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'))
);
--> statement-breakpoint
CREATE INDEX "activities_contact_id_idx" ON "activities" ("contact_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activities_company_id_idx" ON "activities" ("company_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activities_deal_id_idx" ON "activities" ("deal_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_email_key" ON "contacts" (lower("email")) WHERE "email" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "contacts_company_id_idx" ON "contacts" ("company_id");--> statement-breakpoint
CREATE INDEX "deals_company_id_idx" ON "deals" ("company_id");--> statement-breakpoint
CREATE INDEX "deals_contact_id_idx" ON "deals" ("contact_id");--> statement-breakpoint
CREATE INDEX "deals_stage_idx" ON "deals" ("stage");--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_contacts_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_deal_id_deals_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL;
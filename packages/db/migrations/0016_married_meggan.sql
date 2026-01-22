CREATE TABLE "seo_integration" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"account_id" text,
	"is_default" boolean DEFAULT false,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'pending_setup' NOT NULL,
	"last_error" text,
	"last_used_at" timestamp with time zone,
	"config" jsonb NOT NULL,
	"encrypted_credentials" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "seo_integration_project_provider_name_unique" UNIQUE("project_id","provider","name")
);
--> statement-breakpoint
ALTER TABLE "seo_gsc_property" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "seo_gsc_property" CASCADE;--> statement-breakpoint
--> statement-breakpoint
ALTER TABLE "seo_integration" ADD CONSTRAINT "seo_integration_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_integration" ADD CONSTRAINT "seo_integration_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_integration" ADD CONSTRAINT "seo_integration_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_integration_project_idx" ON "seo_integration" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_integration_org_project_provider_idx" ON "seo_integration" USING btree ("organization_id","project_id","provider");--> statement-breakpoint
CREATE INDEX "seo_integration_account_idx" ON "seo_integration" USING btree ("account_id");--> statement-breakpoint
ALTER TABLE "seo_project" DROP COLUMN "gsc_property_id";
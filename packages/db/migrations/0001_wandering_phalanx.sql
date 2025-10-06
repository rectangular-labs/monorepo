CREATE TABLE "seo_gsc_property" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"domain" text NOT NULL,
	"type" text NOT NULL,
	"permission_level" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "seo_gsc_property_domain_account_id_unique" UNIQUE("domain","account_id")
);
--> statement-breakpoint
ALTER TABLE "seo_project" ADD COLUMN "gsc_property_id" uuid;--> statement-breakpoint
ALTER TABLE "seo_gsc_property" ADD CONSTRAINT "seo_gsc_property_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_gsc_property_account_id_idx" ON "seo_gsc_property" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "seo_gsc_property_domain_idx" ON "seo_gsc_property" USING btree ("domain");--> statement-breakpoint
ALTER TABLE "seo_project" ADD CONSTRAINT "seo_project_gsc_property_id_seo_gsc_property_id_fk" FOREIGN KEY ("gsc_property_id") REFERENCES "public"."seo_gsc_property"("id") ON DELETE set null ON UPDATE cascade;
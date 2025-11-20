CREATE TABLE "seo_content_campaign_message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"source" text NOT NULL,
	"user_id" text,
	"message" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seo_content_campaign_message" ADD CONSTRAINT "seo_content_campaign_message_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign_message" ADD CONSTRAINT "seo_content_campaign_message_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign_message" ADD CONSTRAINT "seo_content_campaign_message_campaign_id_seo_content_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."seo_content_campaign"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign_message" ADD CONSTRAINT "seo_content_campaign_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_content_campaign_message_org_project_campaign_id_idx" ON "seo_content_campaign_message" USING btree ("organization_id","project_id","campaign_id","id");
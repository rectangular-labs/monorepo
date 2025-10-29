CREATE TABLE "seo_content_campaign" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by_user_id" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"workspace_blob_uri" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_content_schedule" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"originating_content_campaign_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"published_at" timestamp with time zone,
	"published_links" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seo_content" RENAME COLUMN "pathname" TO "slug";--> statement-breakpoint
DROP INDEX "seo_content_pathname_unique";--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "created_by_user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "publish_destinations" jsonb;--> statement-breakpoint
ALTER TABLE "seo_project" ADD COLUMN "workspace_blob_uri" text;--> statement-breakpoint
ALTER TABLE "seo_content_campaign" ADD CONSTRAINT "seo_content_campaign_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign" ADD CONSTRAINT "seo_content_campaign_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign" ADD CONSTRAINT "seo_content_campaign_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_schedule" ADD CONSTRAINT "seo_content_schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_schedule" ADD CONSTRAINT "seo_content_schedule_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_schedule" ADD CONSTRAINT "seo_content_schedule_content_id_seo_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."seo_content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_schedule" ADD CONSTRAINT "seo_content_schedule_originating_content_campaign_id_seo_content_campaign_id_fk" FOREIGN KEY ("originating_content_campaign_id") REFERENCES "public"."seo_content_campaign"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_content_campaign_org_idx" ON "seo_content_campaign" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "seo_content_campaign_project_idx" ON "seo_content_campaign" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_content_campaign_created_by_user_idx" ON "seo_content_campaign" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "seo_content_campaign_status_idx" ON "seo_content_campaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_content_schedule_org_idx" ON "seo_content_schedule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "seo_content_schedule_project_idx" ON "seo_content_schedule" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_content_schedule_originating_content_campaign_idx" ON "seo_content_schedule" USING btree ("originating_content_campaign_id");--> statement-breakpoint
CREATE INDEX "seo_content_schedule_content_idx" ON "seo_content_schedule" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "seo_content_schedule_status_idx" ON "seo_content_schedule" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_content_schedule_scheduled_for_idx" ON "seo_content_schedule" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "seo_content_schedule_published_at_idx" ON "seo_content_schedule" USING btree ("published_at");--> statement-breakpoint
ALTER TABLE "seo_content" ADD CONSTRAINT "seo_content_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_content_created_by_user_idx" ON "seo_content" USING btree ("created_by_user_id");--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "campaign_type";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "markdown_versions";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "impact_score";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "proposed_format";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "content_category";--> statement-breakpoint
ALTER TABLE "seo_content" ADD CONSTRAINT "seo_content_project_slug_idx" UNIQUE("project_id","slug");
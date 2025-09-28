CREATE TABLE "seo_article" (
	"id" uuid PRIMARY KEY NOT NULL,
	"campaign_cluster_id" uuid NOT NULL,
	"title" text,
	"draft_markdown" text,
	"target_url_slug" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_content_campaign_cluster" (
	"id" uuid PRIMARY KEY NOT NULL,
	"campaign_id" uuid NOT NULL,
	"primary_keyword" text NOT NULL,
	"secondary_keywords" text[] DEFAULT '{}' NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_content_campaign" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"keyword_category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seo_article" ADD CONSTRAINT "seo_article_campaign_cluster_id_seo_content_campaign_cluster_id_fk" FOREIGN KEY ("campaign_cluster_id") REFERENCES "public"."seo_content_campaign_cluster"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign_cluster" ADD CONSTRAINT "seo_content_campaign_cluster_campaign_id_seo_content_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."seo_content_campaign"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign" ADD CONSTRAINT "seo_content_campaign_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign" ADD CONSTRAINT "seo_content_campaign_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_article_campaign_cluster_idx" ON "seo_article" USING btree ("campaign_cluster_id");--> statement-breakpoint
CREATE INDEX "seo_article_status_idx" ON "seo_article" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_campaign_cluster_campaign_idx" ON "seo_content_campaign_cluster" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "seo_campaign_cluster_keyword_idx" ON "seo_content_campaign_cluster" USING btree ("primary_keyword");--> statement-breakpoint
CREATE INDEX "seo_content_campaign_organization_idx" ON "seo_content_campaign" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "seo_content_campaign_project_idx" ON "seo_content_campaign" USING btree ("project_id");
CREATE TABLE "seo_article" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_campaign_id" uuid NOT NULL,
	"title" text,
	"draft_markdown" text,
	"target_url_slug" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_content_campaign" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"campaign_type" text NOT NULL,
	"status" text DEFAULT 'analyzing' NOT NULL,
	"target_article_count" integer,
	"impact_score" numeric(10, 2),
	"serp_snapshot" jsonb,
	"proposed_format" text,
	"content_category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_content_campaign_search_keyword" (
	"content_campaign_id" uuid NOT NULL,
	"search_keyword_id" uuid NOT NULL,
	"type" text NOT NULL,
	"ranking_detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "seo_content_campaign_search_keyword_content_campaign_id_search_keyword_id_pk" PRIMARY KEY("content_campaign_id","search_keyword_id")
);
--> statement-breakpoint
CREATE TABLE "seo_search_keyword" (
	"id" uuid PRIMARY KEY NOT NULL,
	"normalized_phrase" text NOT NULL,
	"search_volume" integer NOT NULL,
	"keyword_difficulty" integer NOT NULL,
	"cpc" integer NOT NULL,
	"intent" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "seo_search_keyword_normalizedPhrase_unique" UNIQUE("normalized_phrase")
);
--> statement-breakpoint
ALTER TABLE "seo_article" ADD CONSTRAINT "seo_article_content_campaign_id_seo_content_campaign_id_fk" FOREIGN KEY ("content_campaign_id") REFERENCES "public"."seo_content_campaign"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign" ADD CONSTRAINT "seo_content_campaign_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign" ADD CONSTRAINT "seo_content_campaign_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign_search_keyword" ADD CONSTRAINT "seo_content_campaign_search_keyword_content_campaign_id_seo_content_campaign_id_fk" FOREIGN KEY ("content_campaign_id") REFERENCES "public"."seo_content_campaign"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_campaign_search_keyword" ADD CONSTRAINT "seo_content_campaign_search_keyword_search_keyword_id_seo_search_keyword_id_fk" FOREIGN KEY ("search_keyword_id") REFERENCES "public"."seo_search_keyword"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_article_content_campaign_idx" ON "seo_article" USING btree ("content_campaign_id");--> statement-breakpoint
CREATE INDEX "seo_article_status_idx" ON "seo_article" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_content_campaign_organization_idx" ON "seo_content_campaign" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "seo_content_campaign_project_idx" ON "seo_content_campaign" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_content_campaign_search_keyword_content_campaign_idx" ON "seo_content_campaign_search_keyword" USING btree ("content_campaign_id");--> statement-breakpoint
CREATE INDEX "seo_content_campaign_search_keyword_search_keyword_idx" ON "seo_content_campaign_search_keyword" USING btree ("search_keyword_id");--> statement-breakpoint
CREATE INDEX "seo_content_campaign_search_keyword_type_idx" ON "seo_content_campaign_search_keyword" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_search_keyword_normalized_phrase_unique" ON "seo_search_keyword" USING btree ("normalized_phrase");--> statement-breakpoint
CREATE INDEX "seo_search_keyword_search_volume_idx" ON "seo_search_keyword" USING btree ("search_volume");--> statement-breakpoint
CREATE INDEX "seo_search_keyword_keyword_difficulty_idx" ON "seo_search_keyword" USING btree ("keyword_difficulty");--> statement-breakpoint
CREATE INDEX "seo_search_keyword_cpc_idx" ON "seo_search_keyword" USING btree ("cpc");--> statement-breakpoint
CREATE INDEX "seo_search_keyword_intent_idx" ON "seo_search_keyword" USING btree ("intent");
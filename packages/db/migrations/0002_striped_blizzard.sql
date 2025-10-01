ALTER TABLE "seo_search_keyword" ALTER COLUMN "cpc" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "seo_project" ADD COLUMN "serp_snapshot" jsonb;
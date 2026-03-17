ALTER TABLE "seo_content_draft" ADD COLUMN "secondary_keywords" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "strategy_id" uuid;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "secondary_keywords" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_strategy" ADD COLUMN "keyword_universe" jsonb;--> statement-breakpoint
ALTER TABLE "seo_strategy" ADD COLUMN "llm_queries" jsonb;--> statement-breakpoint
ALTER TABLE "seo_content" ADD CONSTRAINT "seo_content_strategy_id_seo_strategy_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."seo_strategy"("id") ON DELETE set null ON UPDATE cascade;
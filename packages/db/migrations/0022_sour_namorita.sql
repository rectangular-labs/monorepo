ALTER TABLE "seo_strategy_phase_content" DROP CONSTRAINT "seo_strategy_phase_content_content_draft_id_seo_content_draft_id_fk";
--> statement-breakpoint
ALTER TABLE "seo_strategy_phase_content" ALTER COLUMN "content_draft_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "seo_strategy_phase_content" ADD CONSTRAINT "seo_strategy_phase_content_content_draft_id_seo_content_draft_id_fk" FOREIGN KEY ("content_draft_id") REFERENCES "public"."seo_content_draft"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_strategy_phase_content" DROP COLUMN "planned_slug";--> statement-breakpoint
ALTER TABLE "seo_strategy_phase_content" DROP COLUMN "planned_primary_keyword";--> statement-breakpoint
ALTER TABLE "seo_strategy_phase_content" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "seo_strategy_phase_content" DROP COLUMN "notes";
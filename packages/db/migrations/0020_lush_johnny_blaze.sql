ALTER TABLE "seo_content_draft" ALTER COLUMN "title" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ALTER COLUMN "description" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ALTER COLUMN "primary_keyword" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "seo_strategy_phase_content" ADD COLUMN "planned_slug" text;--> statement-breakpoint
ALTER TABLE "seo_strategy" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_strategy_snapshot_content" ADD COLUMN "aggregate" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_strategy_snapshot_content" ADD COLUMN "delta" jsonb;--> statement-breakpoint
ALTER TABLE "seo_strategy" ADD CONSTRAINT "seo_strategy_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_strategy_org_project_updated_at_idx" ON "seo_strategy" USING btree ("organization_id","project_id","updated_at") WHERE "seo_strategy"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "seo_content_draft" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "outline";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "seo_strategy_phase_content" DROP COLUMN "planned_title";--> statement-breakpoint
ALTER TABLE "seo_strategy_snapshot_content" DROP COLUMN "clicks";--> statement-breakpoint
ALTER TABLE "seo_strategy_snapshot_content" DROP COLUMN "impressions";--> statement-breakpoint
ALTER TABLE "seo_strategy_snapshot_content" DROP COLUMN "avg_position";--> statement-breakpoint
ALTER TABLE "seo_strategy_snapshot_content" DROP COLUMN "conversions";
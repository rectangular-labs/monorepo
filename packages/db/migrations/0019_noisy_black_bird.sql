ALTER TABLE "seo_content_draft" DROP CONSTRAINT "seo_content_draft_base_content_id_seo_content_id_fk";
--> statement-breakpoint
DROP INDEX "seo_content_draft_org_project_status_base_id_idx";--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "originating_draft_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_project" ADD COLUMN "strategy_suggestions_workflow_id" uuid;--> statement-breakpoint
ALTER TABLE "seo_strategy" ADD COLUMN "dismissal_reason" text;--> statement-breakpoint
ALTER TABLE "seo_content" ADD CONSTRAINT "seo_content_originating_draft_id_seo_content_draft_id_fk" FOREIGN KEY ("originating_draft_id") REFERENCES "public"."seo_content_draft"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_project" ADD CONSTRAINT "seo_project_strategy_suggestions_workflow_id_seo_task_run_id_fk" FOREIGN KEY ("strategy_suggestions_workflow_id") REFERENCES "public"."seo_task_run"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_content_draft_org_project_status_idx" ON "seo_content_draft" USING btree ("organization_id","project_id","status","id") WHERE "seo_content_draft"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "seo_project_strategy_suggestions_workflow_idx" ON "seo_project" USING btree ("strategy_suggestions_workflow_id");--> statement-breakpoint
ALTER TABLE "seo_content_draft" DROP COLUMN "base_content_id";
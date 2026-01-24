ALTER TABLE "seo_project" ALTER COLUMN "image_settings" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_project" ALTER COLUMN "writing_settings" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_project" ALTER COLUMN "publishing_settings" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_project" ADD COLUMN "project_research_workflow_id" uuid;--> statement-breakpoint
ALTER TABLE "seo_project" ADD CONSTRAINT "seo_project_project_research_workflow_id_seo_task_run_id_fk" FOREIGN KEY ("project_research_workflow_id") REFERENCES "public"."seo_task_run"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_project_research_workflow_idx" ON "seo_project" USING btree ("project_research_workflow_id");
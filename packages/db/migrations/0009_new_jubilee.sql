DROP TABLE "sm_company_background" CASCADE;--> statement-breakpoint
DROP TABLE "sm_keyword" CASCADE;--> statement-breakpoint
DROP TABLE "sm_keyword_source_cursor" CASCADE;--> statement-breakpoint
DROP TABLE "sm_mention" CASCADE;--> statement-breakpoint
DROP TABLE "sm_project_keyword_mention" CASCADE;--> statement-breakpoint
DROP TABLE "sm_project_keyword" CASCADE;--> statement-breakpoint
DROP TABLE "sm_project_mention_reply" CASCADE;--> statement-breakpoint
DROP TABLE "sm_workspace" CASCADE;--> statement-breakpoint
DROP TABLE "sm_prompt" CASCADE;--> statement-breakpoint
ALTER TABLE "seo_project" ADD COLUMN "publishing_settings" jsonb;
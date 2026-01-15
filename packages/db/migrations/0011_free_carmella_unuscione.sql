CREATE TABLE "seo_chat_message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"chat_id" uuid NOT NULL,
	"source" text NOT NULL,
	"user_id" text,
	"message" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "seo_chat" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by_user_id" text,
	"title" text DEFAULT 'Untitled Chat' NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "seo_content_draft" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"base_content_id" uuid,
	"originating_chat_id" uuid,
	"created_by_user_id" text,
	"target_release_date" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"slug" text NOT NULL,
	"primary_keyword" text NOT NULL,
	"status" text DEFAULT 'suggested' NOT NULL,
	"notes" text,
	"outline_generated_by_task_run_id" uuid,
	"outline" text,
	"generated_by_task_run_id" uuid,
	"article_type" text,
	"content_markdown" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "seo_content_draft_org_project_chat_slug_unique" UNIQUE("organization_id","project_id","originating_chat_id","slug")
);
--> statement-breakpoint
ALTER TABLE "seo_content_campaign_message" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seo_content_campaign" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seo_content_search_keyword" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seo_search_keyword" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "seo_content_campaign_message" CASCADE;--> statement-breakpoint
DROP TABLE "seo_content_campaign" CASCADE;--> statement-breakpoint
DROP TABLE "seo_content_search_keyword" CASCADE;--> statement-breakpoint
DROP TABLE "seo_search_keyword" CASCADE;--> statement-breakpoint
ALTER TABLE "seo_content" DROP CONSTRAINT "seo_content_project_slug_idx";--> statement-breakpoint
--> statement-breakpoint
ALTER TABLE "seo_content" DROP CONSTRAINT "seo_content_created_by_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "seo_content_schedule_originating_content_campaign_idx";--> statement-breakpoint
ALTER TABLE "seo_content_schedule" ALTER COLUMN "status" SET DEFAULT 'scheduled';--> statement-breakpoint
ALTER TABLE "seo_content_schedule" ALTER COLUMN "scheduled_for" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content" ALTER COLUMN "created_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content_schedule" ADD COLUMN "destination" text NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content_schedule" ADD COLUMN "published_url" text;--> statement-breakpoint
ALTER TABLE "seo_content_schedule" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "parent_content_id" uuid;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "is_live_version" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "primary_keyword" text NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "outline" text;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "article_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "content_markdown" text NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "seo_gsc_property" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "seo_project_author" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "seo_project" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "seo_task_run" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "seo_chat_message" ADD CONSTRAINT "seo_chat_message_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_chat_message" ADD CONSTRAINT "seo_chat_message_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_chat_message" ADD CONSTRAINT "seo_chat_message_chat_id_seo_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."seo_chat"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_chat_message" ADD CONSTRAINT "seo_chat_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_chat" ADD CONSTRAINT "seo_chat_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_chat" ADD CONSTRAINT "seo_chat_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_chat" ADD CONSTRAINT "seo_chat_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD CONSTRAINT "seo_content_draft_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD CONSTRAINT "seo_content_draft_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD CONSTRAINT "seo_content_draft_base_content_id_seo_content_id_fk" FOREIGN KEY ("base_content_id") REFERENCES "public"."seo_content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD CONSTRAINT "seo_content_draft_originating_chat_id_seo_chat_id_fk" FOREIGN KEY ("originating_chat_id") REFERENCES "public"."seo_chat"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD CONSTRAINT "seo_content_draft_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD CONSTRAINT "seo_content_draft_outline_generated_by_task_run_id_seo_task_run_id_fk" FOREIGN KEY ("outline_generated_by_task_run_id") REFERENCES "public"."seo_task_run"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD CONSTRAINT "seo_content_draft_generated_by_task_run_id_seo_task_run_id_fk" FOREIGN KEY ("generated_by_task_run_id") REFERENCES "public"."seo_task_run"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_chat_message_org_project_chat_id_idx" ON "seo_chat_message" USING btree ("organization_id","project_id","chat_id","id");--> statement-breakpoint
CREATE INDEX "seo_chat_org_idx" ON "seo_chat" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "seo_chat_project_idx" ON "seo_chat" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_chat_created_by_user_idx" ON "seo_chat" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "seo_chat_status_idx" ON "seo_chat" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_chat_deleted_at_idx" ON "seo_chat" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "seo_chat_title_idx" ON "seo_chat" USING gin (to_tsvector('english', "title"));--> statement-breakpoint
CREATE INDEX "seo_content_branch_org_project_chat_slug_prefix_idx" ON "seo_content_draft" USING btree ("organization_id","project_id","originating_chat_id","slug" text_pattern_ops);--> statement-breakpoint
CREATE INDEX "seo_content_branch_org_idx" ON "seo_content_draft" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "seo_content_branch_project_idx" ON "seo_content_draft" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_content_branch_base_content_id_idx" ON "seo_content_draft" USING btree ("base_content_id");--> statement-breakpoint
CREATE INDEX "seo_content_branch_originating_chat_id_idx" ON "seo_content_draft" USING btree ("originating_chat_id");--> statement-breakpoint
CREATE INDEX "seo_content_branch_status_idx" ON "seo_content_draft" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_content_branch_deleted_at_idx" ON "seo_content_draft" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "seo_content" ADD CONSTRAINT "seo_content_parent_content_id_seo_content_id_fk" FOREIGN KEY ("parent_content_id") REFERENCES "public"."seo_content"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content" ADD CONSTRAINT "seo_content_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_content_org_project_slug_live_idx" ON "seo_content" USING btree ("organization_id","project_id","slug" text_pattern_ops,"is_live_version");--> statement-breakpoint
CREATE INDEX "seo_content_primary_keyword_idx" ON "seo_content" USING btree ("primary_keyword");--> statement-breakpoint
CREATE INDEX "seo_content_version_idx" ON "seo_content" USING btree ("version");--> statement-breakpoint
CREATE INDEX "seo_content_is_live_version_idx" ON "seo_content" USING btree ("is_live_version");--> statement-breakpoint
ALTER TABLE "seo_content_schedule" DROP COLUMN "originating_content_campaign_id";--> statement-breakpoint
ALTER TABLE "seo_content_schedule" DROP COLUMN "published_links";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "publish_destinations";--> statement-breakpoint
ALTER TABLE "seo_project" DROP COLUMN "serp_snapshot";--> statement-breakpoint
ALTER TABLE "seo_project" DROP COLUMN "workspace_blob_uri";--> statement-breakpoint
ALTER TABLE "seo_content" ADD CONSTRAINT "seo_content_project_slug_version_unique" UNIQUE("project_id","slug","version");--> statement-breakpoint
ALTER TABLE "seo_content" ADD CONSTRAINT "seo_content_project_title_version_unique" UNIQUE("project_id","title","version");
CREATE TABLE "seo_content_chat" (
	"content_id" uuid NOT NULL,
	"chat_id" uuid NOT NULL,
	"contributed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seo_content_chat_content_id_chat_id_pk" PRIMARY KEY("content_id","chat_id")
);
--> statement-breakpoint
CREATE TABLE "seo_content_draft_chat" (
	"draft_id" uuid NOT NULL,
	"chat_id" uuid NOT NULL,
	"contributed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seo_content_draft_chat_draft_id_chat_id_pk" PRIMARY KEY("draft_id","chat_id")
);
--> statement-breakpoint
CREATE TABLE "seo_content_draft_contributor" (
	"draft_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"contributed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seo_content_draft_contributor_draft_id_user_id_pk" PRIMARY KEY("draft_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "seo_content_contributor" (
	"content_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"contributed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seo_content_contributor_content_id_user_id_pk" PRIMARY KEY("content_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "seo_content_schedule" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "seo_content_schedule" CASCADE;--> statement-breakpoint
ALTER TABLE "seo_content_draft" RENAME COLUMN "target_release_date" TO "scheduled_for";--> statement-breakpoint
ALTER TABLE "seo_content_draft" DROP CONSTRAINT "seo_content_draft_org_project_chat_slug_unique";--> statement-breakpoint
ALTER TABLE "seo_content" DROP CONSTRAINT "seo_content_project_title_version_unique";--> statement-breakpoint
ALTER TABLE "seo_content_draft" DROP CONSTRAINT "seo_content_draft_originating_chat_id_seo_chat_id_fk";
--> statement-breakpoint
ALTER TABLE "seo_content_draft" DROP CONSTRAINT "seo_content_draft_created_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "seo_content" DROP CONSTRAINT "seo_content_created_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "seo_content" DROP CONSTRAINT "seo_content_parent_content_id_seo_content_id_fk";
--> statement-breakpoint
DROP INDEX "seo_content_branch_org_project_chat_slug_prefix_idx";--> statement-breakpoint
DROP INDEX "seo_content_branch_org_idx";--> statement-breakpoint
DROP INDEX "seo_content_branch_project_idx";--> statement-breakpoint
DROP INDEX "seo_content_branch_base_content_id_idx";--> statement-breakpoint
DROP INDEX "seo_content_branch_originating_chat_id_idx";--> statement-breakpoint
DROP INDEX "seo_content_branch_status_idx";--> statement-breakpoint
DROP INDEX "seo_content_branch_deleted_at_idx";--> statement-breakpoint
DROP INDEX "seo_content_project_idx";--> statement-breakpoint
DROP INDEX "seo_content_organization_idx";--> statement-breakpoint
DROP INDEX "seo_content_created_by_user_idx";--> statement-breakpoint
DROP INDEX "seo_content_org_project_slug_live_idx";--> statement-breakpoint
DROP INDEX "seo_content_primary_keyword_idx";--> statement-breakpoint
DROP INDEX "seo_content_version_idx";--> statement-breakpoint
DROP INDEX "seo_content_is_live_version_idx";--> statement-breakpoint
ALTER TABLE "seo_content_draft" ALTER COLUMN "primary_keyword" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "seo_content" ADD COLUMN "published_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_content_chat" ADD CONSTRAINT "seo_content_chat_content_id_seo_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."seo_content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_chat" ADD CONSTRAINT "seo_content_chat_chat_id_seo_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."seo_chat"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_draft_chat" ADD CONSTRAINT "seo_content_draft_chat_draft_id_seo_content_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."seo_content_draft"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_draft_chat" ADD CONSTRAINT "seo_content_draft_chat_chat_id_seo_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."seo_chat"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_draft_contributor" ADD CONSTRAINT "seo_content_draft_contributor_draft_id_seo_content_draft_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."seo_content_draft"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_draft_contributor" ADD CONSTRAINT "seo_content_draft_contributor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_contributor" ADD CONSTRAINT "seo_content_contributor_content_id_seo_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."seo_content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_content_contributor" ADD CONSTRAINT "seo_content_contributor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_content_chat_content_idx" ON "seo_content_chat" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "seo_content_chat_chat_idx" ON "seo_content_chat" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "seo_content_draft_chat_draft_idx" ON "seo_content_draft_chat" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "seo_content_draft_chat_chat_idx" ON "seo_content_draft_chat" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "seo_content_draft_contributor_draft_idx" ON "seo_content_draft_contributor" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "seo_content_draft_contributor_user_idx" ON "seo_content_draft_contributor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "seo_content_contributor_content_idx" ON "seo_content_contributor" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "seo_content_contributor_user_idx" ON "seo_content_contributor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "seo_content_draft_org_project_slug_idx" ON "seo_content_draft" USING btree ("organization_id","project_id","slug" text_pattern_ops) WHERE "seo_content_draft"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "seo_content_draft_org_project_status_base_id_idx" ON "seo_content_draft" USING btree ("organization_id","project_id","status","base_content_id","id") WHERE "seo_content_draft"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "seo_content_org_project_slug_version_desc_idx" ON "seo_content" USING btree ("organization_id","project_id","slug","version" DESC) WHERE "seo_content"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "seo_content_draft" DROP COLUMN "originating_chat_id";--> statement-breakpoint
ALTER TABLE "seo_content_draft" DROP COLUMN "created_by_user_id";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "created_by_user_id";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "parent_content_id";--> statement-breakpoint
ALTER TABLE "seo_content" DROP COLUMN "is_live_version";--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD CONSTRAINT "seo_content_draft_project_slug_unique" UNIQUE("project_id","slug");
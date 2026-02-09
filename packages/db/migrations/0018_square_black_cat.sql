CREATE TABLE "seo_strategy_phase_content" (
	"id" uuid PRIMARY KEY NOT NULL,
	"phase_id" uuid NOT NULL,
	"content_draft_id" uuid,
	"action" text NOT NULL,
	"planned_title" text,
	"planned_primary_keyword" text,
	"role" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "seo_strategy_phase" (
	"id" uuid PRIMARY KEY NOT NULL,
	"strategy_id" uuid NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"observation_weeks" integer DEFAULT 0 NOT NULL,
	"success_criteria" text NOT NULL,
	"cadence" jsonb NOT NULL,
	"target_completion_date" timestamp with time zone,
	"status" text DEFAULT 'suggestion' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"observation_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "seo_strategy" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"motivation" text NOT NULL,
	"goal" jsonb NOT NULL,
	"status" text DEFAULT 'suggestion' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "seo_strategy_snapshot_content" (
	"id" uuid PRIMARY KEY NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"content_draft_id" uuid NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"avg_position" real DEFAULT 0 NOT NULL,
	"conversions" integer,
	"top_keywords" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "seo_strategy_snapshot" (
	"id" uuid PRIMARY KEY NOT NULL,
	"strategy_id" uuid NOT NULL,
	"phase_id" uuid,
	"taken_at" timestamp with time zone NOT NULL,
	"trigger_type" text NOT NULL,
	"aggregate" jsonb NOT NULL,
	"delta" jsonb,
	"ai_insight" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "seo_content_chat" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seo_content_contributor" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "seo_content_chat" CASCADE;--> statement-breakpoint
DROP TABLE "seo_content_contributor" CASCADE;--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD COLUMN "strategy_id" uuid;--> statement-breakpoint
ALTER TABLE "seo_strategy_phase_content" ADD CONSTRAINT "seo_strategy_phase_content_phase_id_seo_strategy_phase_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."seo_strategy_phase"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_strategy_phase_content" ADD CONSTRAINT "seo_strategy_phase_content_content_draft_id_seo_content_draft_id_fk" FOREIGN KEY ("content_draft_id") REFERENCES "public"."seo_content_draft"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_strategy_phase" ADD CONSTRAINT "seo_strategy_phase_strategy_id_seo_strategy_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."seo_strategy"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_strategy" ADD CONSTRAINT "seo_strategy_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_strategy_snapshot_content" ADD CONSTRAINT "seo_strategy_snapshot_content_snapshot_id_seo_strategy_snapshot_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."seo_strategy_snapshot"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_strategy_snapshot_content" ADD CONSTRAINT "seo_strategy_snapshot_content_content_draft_id_seo_content_draft_id_fk" FOREIGN KEY ("content_draft_id") REFERENCES "public"."seo_content_draft"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_strategy_snapshot" ADD CONSTRAINT "seo_strategy_snapshot_strategy_id_seo_strategy_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."seo_strategy"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_strategy_snapshot" ADD CONSTRAINT "seo_strategy_snapshot_phase_id_seo_strategy_phase_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."seo_strategy_phase"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "seo_strategy_phase_content_phase_idx" ON "seo_strategy_phase_content" USING btree ("phase_id");--> statement-breakpoint
CREATE INDEX "seo_strategy_phase_content_draft_idx" ON "seo_strategy_phase_content" USING btree ("content_draft_id");--> statement-breakpoint
CREATE INDEX "seo_strategy_phase_strategy_created_at_idx" ON "seo_strategy_phase" USING btree ("strategy_id","created_at") WHERE "seo_strategy_phase"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "seo_strategy_phase_status_idx" ON "seo_strategy_phase" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_strategy_status_idx" ON "seo_strategy" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_strategy_snapshot_content_snapshot_idx" ON "seo_strategy_snapshot_content" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "seo_strategy_snapshot_content_draft_idx" ON "seo_strategy_snapshot_content" USING btree ("content_draft_id");--> statement-breakpoint
CREATE INDEX "seo_strategy_snapshot_strategy_idx" ON "seo_strategy_snapshot" USING btree ("strategy_id");--> statement-breakpoint
CREATE INDEX "seo_strategy_snapshot_phase_idx" ON "seo_strategy_snapshot" USING btree ("phase_id");--> statement-breakpoint
CREATE INDEX "seo_strategy_snapshot_taken_at_idx" ON "seo_strategy_snapshot" USING btree ("taken_at");--> statement-breakpoint
ALTER TABLE "seo_content_draft" ADD CONSTRAINT "seo_content_draft_strategy_id_seo_strategy_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."seo_strategy"("id") ON DELETE set null ON UPDATE cascade;
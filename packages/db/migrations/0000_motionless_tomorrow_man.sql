CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"created_at" timestamp with time zone NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"source" text,
	"goal" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sm_company_background" (
	"id" uuid PRIMARY KEY NOT NULL,
	"website_url" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"last_indexed_at" timestamp with time zone,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sm_keyword" (
	"id" uuid PRIMARY KEY NOT NULL,
	"phrase" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sm_keyword_source_cursor" (
	"id" uuid PRIMARY KEY NOT NULL,
	"keyword_id" uuid NOT NULL,
	"source" text NOT NULL,
	"current_cursor" text,
	"latest_item_at" timestamp with time zone,
	"empty_streak" integer DEFAULT 0 NOT NULL,
	"next_earliest_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sm_mention" (
	"id" uuid PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'reddit' NOT NULL,
	"provider_id" text NOT NULL,
	"provider_url" text,
	"provider_created_at" timestamp with time zone,
	"author" text,
	"title" text,
	"content" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sm_project_keyword_mention" (
	"project_id" uuid NOT NULL,
	"keyword_id" uuid NOT NULL,
	"mention_id" uuid NOT NULL,
	"matched_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sm_project_keyword_mention_project_id_keyword_id_mention_id_pk" PRIMARY KEY("project_id","keyword_id","mention_id")
);
--> statement-breakpoint
CREATE TABLE "sm_project_keyword" (
	"project_id" uuid NOT NULL,
	"keyword_id" uuid NOT NULL,
	"polling_interval_sec" integer,
	"next_run_at" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"is_paused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sm_project_keyword_project_id_keyword_id_pk" PRIMARY KEY("project_id","keyword_id")
);
--> statement-breakpoint
CREATE TABLE "sm_project_mention_reply" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"mention_id" uuid NOT NULL,
	"attributed_keyword_id" uuid NOT NULL,
	"model" text,
	"prompt_override_id" uuid,
	"reply_text" text,
	"is_auto_generated" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"error" text,
	"provider_published_id" text,
	"provider_published_url" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sm_project" (
	"sm_project_id" uuid PRIMARY KEY NOT NULL,
	"organization_id" text,
	"current_reply_prompt_id" uuid,
	"polling_interval_sec" integer DEFAULT 900 NOT NULL,
	"auto_generate_replies" boolean DEFAULT false NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sm_prompt" (
	"sm_prompt_id" uuid PRIMARY KEY NOT NULL,
	"prompt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_audit_snapshot" (
	"seo_audit_snapshot_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"page_id" uuid,
	"keyword_id" uuid,
	"captured_at" timestamp with time zone NOT NULL,
	"overall_score" numeric(5, 2),
	"status" text DEFAULT 'ok' NOT NULL,
	"metrics" jsonb NOT NULL,
	"explanation_technical" text,
	"explanation_layman" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_calendar_event" (
	"seo_calendar_event_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"campaign_id" uuid,
	"task_id" uuid,
	"title" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_campaign" (
	"seo_campaign_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"proposal_id" uuid,
	"title" text NOT NULL,
	"thesis" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"goal_metrics" jsonb,
	"schedule" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_campaign_proposal" (
	"seo_campaign_proposal_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"thesis" text,
	"why_five_ws" jsonb,
	"explanation_technical" text,
	"explanation_layman" text,
	"baseline_metrics" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by" text,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_campaign_task" (
	"seo_campaign_task_id" uuid PRIMARY KEY NOT NULL,
	"campaign_id" uuid NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"title" text,
	"target_page_id" uuid,
	"target_keyword_id" uuid,
	"due_at" timestamp with time zone,
	"payload" jsonb,
	"result" jsonb,
	"assignee_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_cms_connection" (
	"seo_cms_connection_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_site_id" text,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"config" jsonb,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_keyword_cluster" (
	"seo_keyword_cluster_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"method" text,
	"centroid_keyword_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_keyword_cluster_member" (
	"seo_keyword_cluster_member_id" uuid PRIMARY KEY NOT NULL,
	"cluster_id" uuid NOT NULL,
	"keyword_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_metric_threshold" (
	"seo_metric_threshold_id" uuid PRIMARY KEY NOT NULL,
	"metric_key" text NOT NULL,
	"direction" text NOT NULL,
	"good_threshold" numeric(10, 3),
	"bad_threshold" numeric(10, 3),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_page" (
	"seo_page_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"url" text NOT NULL,
	"canonical_url" text,
	"title" text,
	"description" text,
	"content_text" text,
	"content_html" text,
	"content_markdown" text,
	"extractor" text,
	"http_status" integer,
	"robots_noindex" boolean,
	"robots_nofollow" boolean,
	"sitemap_priority" numeric(2, 1),
	"status" text DEFAULT 'discovered' NOT NULL,
	"last_crawled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_page_keyword" (
	"seo_page_keyword_id" uuid PRIMARY KEY NOT NULL,
	"page_id" uuid NOT NULL,
	"keyword_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"match_score" numeric(4, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_publishing_job" (
	"seo_publishing_job_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"cms_connection_id" uuid,
	"task_id" uuid,
	"target_page_id" uuid,
	"status" text DEFAULT 'enqueued' NOT NULL,
	"payload" jsonb,
	"external_job_id" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_sitemap_source" (
	"seo_sitemap_source_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"url" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"last_fetch_error" text,
	"discovered_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_project" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"website_url" text NOT NULL,
	"website_info" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_task_run" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"requested_by" text NOT NULL,
	"task_id" text NOT NULL,
	"provider" text DEFAULT 'trigger.dev' NOT NULL,
	"input_data" jsonb NOT NULL,
	"cost_in_cents" numeric(10, 5) DEFAULT '0.00000' NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sm_keyword_source_cursor" ADD CONSTRAINT "sm_keyword_source_cursor_keyword_id_sm_keyword_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."sm_keyword"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sm_project_keyword_mention" ADD CONSTRAINT "sm_project_keyword_mention_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sm_project_keyword_mention" ADD CONSTRAINT "sm_project_keyword_mention_keyword_id_sm_keyword_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."sm_keyword"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sm_project_keyword_mention" ADD CONSTRAINT "sm_project_keyword_mention_mention_id_sm_mention_id_fk" FOREIGN KEY ("mention_id") REFERENCES "public"."sm_mention"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sm_project_keyword_mention" ADD CONSTRAINT "sm_pkm_project_keyword_fk" FOREIGN KEY ("project_id","keyword_id") REFERENCES "public"."sm_project_keyword"("project_id","keyword_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sm_project_keyword" ADD CONSTRAINT "sm_project_keyword_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sm_project_keyword" ADD CONSTRAINT "sm_project_keyword_keyword_id_sm_keyword_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."sm_keyword"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sm_project_mention_reply" ADD CONSTRAINT "sm_project_mention_reply_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sm_project_mention_reply" ADD CONSTRAINT "sm_project_mention_reply_mention_id_sm_mention_id_fk" FOREIGN KEY ("mention_id") REFERENCES "public"."sm_mention"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sm_project_mention_reply" ADD CONSTRAINT "sm_project_mention_reply_attributed_keyword_id_sm_keyword_id_fk" FOREIGN KEY ("attributed_keyword_id") REFERENCES "public"."sm_keyword"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sm_project_mention_reply" ADD CONSTRAINT "sm_project_mention_reply_prompt_override_id_sm_prompt_sm_prompt_id_fk" FOREIGN KEY ("prompt_override_id") REFERENCES "public"."sm_prompt"("sm_prompt_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sm_project_mention_reply" ADD CONSTRAINT "sm_pmr_project_keyword_mention_fk" FOREIGN KEY ("project_id","mention_id","attributed_keyword_id") REFERENCES "public"."sm_project_keyword_mention"("project_id","mention_id","keyword_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sm_project" ADD CONSTRAINT "sm_project_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sm_project" ADD CONSTRAINT "sm_project_current_reply_prompt_id_sm_prompt_sm_prompt_id_fk" FOREIGN KEY ("current_reply_prompt_id") REFERENCES "public"."sm_prompt"("sm_prompt_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_audit_snapshot" ADD CONSTRAINT "seo_audit_snapshot_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_audit_snapshot" ADD CONSTRAINT "seo_audit_snapshot_page_id_seo_page_seo_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."seo_page"("seo_page_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_audit_snapshot" ADD CONSTRAINT "seo_audit_snapshot_keyword_id_sm_keyword_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."sm_keyword"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_calendar_event" ADD CONSTRAINT "seo_calendar_event_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_calendar_event" ADD CONSTRAINT "seo_calendar_event_campaign_id_seo_campaign_seo_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."seo_campaign"("seo_campaign_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_calendar_event" ADD CONSTRAINT "seo_calendar_event_task_id_seo_campaign_task_seo_campaign_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."seo_campaign_task"("seo_campaign_task_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_campaign" ADD CONSTRAINT "seo_campaign_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_campaign" ADD CONSTRAINT "seo_campaign_proposal_id_seo_campaign_proposal_seo_campaign_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."seo_campaign_proposal"("seo_campaign_proposal_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_campaign_proposal" ADD CONSTRAINT "seo_campaign_proposal_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_campaign_task" ADD CONSTRAINT "seo_campaign_task_campaign_id_seo_campaign_seo_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."seo_campaign"("seo_campaign_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_campaign_task" ADD CONSTRAINT "seo_campaign_task_target_page_id_seo_page_seo_page_id_fk" FOREIGN KEY ("target_page_id") REFERENCES "public"."seo_page"("seo_page_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_campaign_task" ADD CONSTRAINT "seo_campaign_task_target_keyword_id_sm_keyword_id_fk" FOREIGN KEY ("target_keyword_id") REFERENCES "public"."sm_keyword"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_cms_connection" ADD CONSTRAINT "seo_cms_connection_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_keyword_cluster" ADD CONSTRAINT "seo_keyword_cluster_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_keyword_cluster" ADD CONSTRAINT "seo_keyword_cluster_centroid_keyword_id_sm_keyword_id_fk" FOREIGN KEY ("centroid_keyword_id") REFERENCES "public"."sm_keyword"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_keyword_cluster_member" ADD CONSTRAINT "seo_keyword_cluster_member_cluster_id_seo_keyword_cluster_seo_keyword_cluster_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."seo_keyword_cluster"("seo_keyword_cluster_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_keyword_cluster_member" ADD CONSTRAINT "seo_keyword_cluster_member_keyword_id_sm_keyword_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."sm_keyword"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_page" ADD CONSTRAINT "seo_page_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_page_keyword" ADD CONSTRAINT "seo_page_keyword_page_id_seo_page_seo_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."seo_page"("seo_page_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_page_keyword" ADD CONSTRAINT "seo_page_keyword_keyword_id_sm_keyword_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."sm_keyword"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_publishing_job" ADD CONSTRAINT "seo_publishing_job_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_publishing_job" ADD CONSTRAINT "seo_publishing_job_cms_connection_id_seo_cms_connection_seo_cms_connection_id_fk" FOREIGN KEY ("cms_connection_id") REFERENCES "public"."seo_cms_connection"("seo_cms_connection_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_publishing_job" ADD CONSTRAINT "seo_publishing_job_task_id_seo_campaign_task_seo_campaign_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."seo_campaign_task"("seo_campaign_task_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_publishing_job" ADD CONSTRAINT "seo_publishing_job_target_page_id_seo_page_seo_page_id_fk" FOREIGN KEY ("target_page_id") REFERENCES "public"."seo_page"("seo_page_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_sitemap_source" ADD CONSTRAINT "seo_sitemap_source_project_id_sm_project_sm_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sm_project"("sm_project_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_project" ADD CONSTRAINT "seo_project_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_task_run" ADD CONSTRAINT "seo_task_run_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_task_run" ADD CONSTRAINT "seo_task_run_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "sm_company_background_website_url_unique" ON "sm_company_background" USING btree ("website_url");--> statement-breakpoint
CREATE UNIQUE INDEX "sm_keyword_phrase_unique" ON "sm_keyword" USING btree ("phrase");--> statement-breakpoint
CREATE UNIQUE INDEX "sm_keyword_source_cursor_source_keyword_unique" ON "sm_keyword_source_cursor" USING btree ("source","keyword_id");--> statement-breakpoint
CREATE INDEX "sm_keyword_source_cursor_src_idx" ON "sm_keyword_source_cursor" USING btree ("source");--> statement-breakpoint
CREATE INDEX "sm_keyword_source_cursor_kw_idx" ON "sm_keyword_source_cursor" USING btree ("keyword_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sm_mention_provider_unique" ON "sm_mention" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE INDEX "sm_mention_provider_created_at_idx" ON "sm_mention" USING btree ("provider_created_at");--> statement-breakpoint
CREATE INDEX "sm_pkm_project_idx" ON "sm_project_keyword_mention" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "sm_pkm_keyword_idx" ON "sm_project_keyword_mention" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "sm_pkm_mention_idx" ON "sm_project_keyword_mention" USING btree ("mention_id");--> statement-breakpoint
CREATE INDEX "sm_pkm_status_idx" ON "sm_project_keyword_mention" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sm_pkm_matched_at_idx" ON "sm_project_keyword_mention" USING btree ("matched_at");--> statement-breakpoint
CREATE INDEX "sm_project_keyword_project_idx" ON "sm_project_keyword" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "sm_project_keyword_keyword_idx" ON "sm_project_keyword" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "sm_project_keyword_next_run_at_idx" ON "sm_project_keyword" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "sm_project_keyword_proj_created_id_idx" ON "sm_project_keyword" USING btree ("project_id","created_at","keyword_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sm_pmr_unique" ON "sm_project_mention_reply" USING btree ("project_id","mention_id");--> statement-breakpoint
CREATE INDEX "sm_pmr_project_keyword_mention_idx" ON "sm_project_mention_reply" USING btree ("project_id","mention_id","attributed_keyword_id");--> statement-breakpoint
CREATE INDEX "sm_pmr_project_idx" ON "sm_project_mention_reply" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "sm_pmr_mention_idx" ON "sm_project_mention_reply" USING btree ("mention_id");--> statement-breakpoint
CREATE INDEX "sm_pmr_status_idx" ON "sm_project_mention_reply" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sm_project_org_idx" ON "sm_project" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sm_project_current_reply_prompt_idx" ON "sm_project" USING btree ("current_reply_prompt_id");--> statement-breakpoint
CREATE INDEX "sm_prompt_created_at_idx" ON "sm_prompt" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "seo_audit_snapshot_project_idx" ON "seo_audit_snapshot" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_audit_snapshot_captured_idx" ON "seo_audit_snapshot" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "seo_calendar_event_project_idx" ON "seo_calendar_event" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_campaign_project_idx" ON "seo_campaign" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_campaign_status_idx" ON "seo_campaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_campaign_proposal_project_idx" ON "seo_campaign_proposal" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_campaign_task_campaign_idx" ON "seo_campaign_task" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "seo_campaign_task_status_idx" ON "seo_campaign_task" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_cms_connection_project_idx" ON "seo_cms_connection" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_keyword_cluster_project_idx" ON "seo_keyword_cluster" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_keyword_cluster_member_unique" ON "seo_keyword_cluster_member" USING btree ("cluster_id","keyword_id");--> statement-breakpoint
CREATE INDEX "seo_keyword_cluster_member_cluster_idx" ON "seo_keyword_cluster_member" USING btree ("cluster_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_metric_threshold_metric_unique" ON "seo_metric_threshold" USING btree ("metric_key");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_page_project_url_unique" ON "seo_page" USING btree ("project_id","url");--> statement-breakpoint
CREATE INDEX "seo_page_project_idx" ON "seo_page" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_page_status_idx" ON "seo_page" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_page_keyword_unique" ON "seo_page_keyword" USING btree ("page_id","keyword_id");--> statement-breakpoint
CREATE INDEX "seo_page_keyword_page_idx" ON "seo_page_keyword" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "seo_page_keyword_keyword_idx" ON "seo_page_keyword" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "seo_publishing_job_project_idx" ON "seo_publishing_job" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_sitemap_source_project_url_unique" ON "seo_sitemap_source" USING btree ("project_id","url");--> statement-breakpoint
CREATE INDEX "seo_project_org_idx" ON "seo_project" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "seo_project_website_url_idx" ON "seo_project" USING btree ("website_url");--> statement-breakpoint
CREATE INDEX "seo_task_run_project_idx" ON "seo_task_run" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "seo_task_run_task_id_idx" ON "seo_task_run" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "seo_task_run_provider_idx" ON "seo_task_run" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "seo_task_run_requested_by_idx" ON "seo_task_run" USING btree ("requested_by");
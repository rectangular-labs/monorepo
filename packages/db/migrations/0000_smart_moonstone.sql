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
CREATE INDEX "sm_prompt_created_at_idx" ON "sm_prompt" USING btree ("created_at");
CREATE TABLE "seo_project_author" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"bio" text,
	"avatar_uri" text,
	"social_links" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "seo_project_author_project_name_unique" UNIQUE("project_id","name")
);
--> statement-breakpoint
ALTER TABLE "seo_project" ADD COLUMN "business_background" jsonb;--> statement-breakpoint
ALTER TABLE "seo_project" ADD COLUMN "image_settings" jsonb;--> statement-breakpoint
ALTER TABLE "seo_project" ADD COLUMN "article_settings" jsonb;--> statement-breakpoint
ALTER TABLE "seo_project_author" ADD CONSTRAINT "seo_project_author_project_id_seo_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."seo_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "seo_project" DROP COLUMN "website_info";
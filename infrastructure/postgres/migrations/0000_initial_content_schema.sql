CREATE TYPE "public"."content_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "post_projects" (
	"post_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	CONSTRAINT "post_projects_post_id_project_id_pk" PRIMARY KEY("post_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "post_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"seo_title" text NOT NULL,
	"seo_description" text NOT NULL,
	"og_image_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_published_at_required" CHECK ("posts"."status" <> 'published' OR "posts"."published_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "project_skills" (
	"project_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "project_skills_project_id_skill_id_pk" PRIMARY KEY("project_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"seo_title" text NOT NULL,
	"seo_description" text NOT NULL,
	"og_image_path" text,
	"repository_url" text,
	"live_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_published_at_required" CHECK ("projects"."status" <> 'published' OR "projects"."published_at" IS NOT NULL),
	CONSTRAINT "projects_display_order_nonnegative" CHECK ("projects"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"summary" text NOT NULL,
	"evidence" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_display_order_nonnegative" CHECK ("skills"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_projects" ADD CONSTRAINT "post_projects_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_projects" ADD CONSTRAINT "post_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_projects_project_index" ON "post_projects" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "post_tags_tag_index" ON "post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_unique" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_published_listing_index" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "project_skills_skill_index" ON "project_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_unique" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "projects_published_listing_index" ON "projects" USING btree ("status","featured","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_key_unique" ON "skills" USING btree ("key");--> statement-breakpoint
CREATE INDEX "skills_visible_order_index" ON "skills" USING btree ("visible","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_unique" ON "tags" USING btree ("slug");
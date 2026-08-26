CREATE TYPE "public"."post_kind" AS ENUM('article', 'retrospective');--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "kind" "post_kind" DEFAULT 'article' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "kind" DROP DEFAULT;--> statement-breakpoint
DROP INDEX "posts_published_listing_index";--> statement-breakpoint
CREATE INDEX "posts_kind_published_listing_index" ON "posts" USING btree ("kind","status","published_at");

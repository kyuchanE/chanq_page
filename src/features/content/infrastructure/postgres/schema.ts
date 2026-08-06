import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const auditTimestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
};

export const contentStatus = pgEnum("content_status", ["draft", "published"]);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    summary: text("summary").notNull(),
    evidence: text("evidence").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    visible: boolean("visible").default(true).notNull(),
    ...auditTimestamps,
  },
  (table) => [
    uniqueIndex("skills_key_unique").on(table.key),
    index("skills_visible_order_index").on(table.visible, table.displayOrder),
    check("skills_display_order_nonnegative", sql`${table.displayOrder} >= 0`),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    status: contentStatus("status").default("draft").notNull(),
    featured: boolean("featured").default(false).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "date",
    }),
    seoTitle: text("seo_title").notNull(),
    seoDescription: text("seo_description").notNull(),
    ogImagePath: text("og_image_path"),
    repositoryUrl: text("repository_url"),
    liveUrl: text("live_url"),
    ...auditTimestamps,
  },
  (table) => [
    uniqueIndex("projects_slug_unique").on(table.slug),
    index("projects_published_listing_index").on(
      table.status,
      table.featured,
      table.displayOrder,
    ),
    check(
      "projects_published_at_required",
      sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`,
    ),
    check(
      "projects_display_order_nonnegative",
      sql`${table.displayOrder} >= 0`,
    ),
  ],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    status: contentStatus("status").default("draft").notNull(),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "date",
    }),
    seoTitle: text("seo_title").notNull(),
    seoDescription: text("seo_description").notNull(),
    ogImagePath: text("og_image_path"),
    ...auditTimestamps,
  },
  (table) => [
    uniqueIndex("posts_slug_unique").on(table.slug),
    index("posts_published_listing_index").on(table.status, table.publishedAt),
    check(
      "posts_published_at_required",
      sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`,
    ),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    ...auditTimestamps,
  },
  (table) => [uniqueIndex("tags_slug_unique").on(table.slug)],
);

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index("post_tags_tag_index").on(table.tagId),
  ],
);

export const postProjects = pgTable(
  "post_projects",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.projectId] }),
    index("post_projects_project_index").on(table.projectId),
  ],
);

export const projectSkills = pgTable(
  "project_skills",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.skillId] }),
    index("project_skills_skill_index").on(table.skillId),
  ],
);

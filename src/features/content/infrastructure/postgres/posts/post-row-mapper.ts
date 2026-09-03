import { z } from "zod";

import {
  POST_KINDS,
  type PostSlug,
  type PublishedPostDetail,
  type PublishedPostListItem,
  type PublishedPostProject,
  type PublishedPostTag,
  parsePostSlug,
} from "@/features/content/domain/posts/post";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const nonEmptyText = z.string().trim().min(1);
const relatedSlug = nonEmptyText
  .max(100)
  .regex(slugPattern, "Expected a lowercase, URL-safe related slug.");
const postSlug = nonEmptyText.transform((value, context) => {
  const slug = parsePostSlug(value);

  if (slug === null) {
    context.addIssue({
      code: "custom",
      message: "Expected a lowercase, URL-safe post slug.",
    });

    return z.NEVER;
  }

  return slug;
});
const publishedAt = z.date().transform((value) => value.toISOString());
const imagePath = z
  .string()
  .startsWith("/")
  .refine((value) => !value.startsWith("//"), {
    message: "Expected an application-relative image path.",
  });

const postListRowSchema = z
  .object({
    kind: z.enum(POST_KINDS),
    publishedAt,
    slug: postSlug,
    summary: nonEmptyText,
    tagName: nonEmptyText.nullable(),
    tagSlug: relatedSlug.nullable(),
    title: nonEmptyText,
  })
  .strict()
  .superRefine((row, context) => {
    if ((row.tagName === null) !== (row.tagSlug === null)) {
      context.addIssue({
        code: "custom",
        message: "Expected either a complete tag relation or no tag relation.",
      });
    }
  });

const postDetailRowSchema = z
  .object({
    body: nonEmptyText,
    kind: z.enum(POST_KINDS),
    ogImagePath: imagePath.nullable(),
    projectDisplayOrder: z.int().nonnegative().nullable(),
    projectFeatured: z.boolean().nullable(),
    projectPublishedAt: publishedAt.nullable(),
    projectSlug: relatedSlug.nullable(),
    projectTitle: nonEmptyText.nullable(),
    publishedAt,
    seoDescription: nonEmptyText,
    seoTitle: nonEmptyText,
    slug: postSlug,
    summary: nonEmptyText,
    tagName: nonEmptyText.nullable(),
    tagSlug: relatedSlug.nullable(),
    title: nonEmptyText,
  })
  .strict()
  .superRefine((row, context) => {
    const tagFields = [row.tagName, row.tagSlug];
    const hasTag = tagFields.some((field) => field !== null);
    const hasCompleteTag = tagFields.every((field) => field !== null);

    if (hasTag && !hasCompleteTag) {
      context.addIssue({
        code: "custom",
        message: "Expected either a complete tag relation or no tag relation.",
      });
    }

    const projectFields = [
      row.projectDisplayOrder,
      row.projectFeatured,
      row.projectPublishedAt,
      row.projectSlug,
      row.projectTitle,
    ];
    const hasProject = projectFields.some((field) => field !== null);
    const hasCompleteProject = projectFields.every((field) => field !== null);

    if (hasProject && !hasCompleteProject) {
      context.addIssue({
        code: "custom",
        message:
          "Expected either a complete published project relation or no project relation.",
      });
    }
  });

type ParsedListRow = z.infer<typeof postListRowSchema>;
type ParsedDetailRow = z.infer<typeof postDetailRowSchema>;

export class InvalidPostRowError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidPostRowError";
  }
}

function parseRow<T>(schema: z.ZodType<T>, row: unknown): T {
  const result = schema.safeParse(row);

  if (!result.success) {
    throw new InvalidPostRowError(
      "PostgreSQL returned a post row that does not match the public post contract.",
      { cause: result.error },
    );
  }

  return result.data;
}

function assertConsistentListRow(
  firstRow: ParsedListRow,
  row: ParsedListRow,
): void {
  if (
    row.kind !== firstRow.kind ||
    row.publishedAt !== firstRow.publishedAt ||
    row.summary !== firstRow.summary ||
    row.title !== firstRow.title
  ) {
    throw new InvalidPostRowError(
      "PostgreSQL returned inconsistent post data across tag relations.",
    );
  }
}

function assertConsistentDetailRow(
  firstRow: ParsedDetailRow,
  row: ParsedDetailRow,
): void {
  if (
    row.body !== firstRow.body ||
    row.kind !== firstRow.kind ||
    row.ogImagePath !== firstRow.ogImagePath ||
    row.publishedAt !== firstRow.publishedAt ||
    row.seoDescription !== firstRow.seoDescription ||
    row.seoTitle !== firstRow.seoTitle ||
    row.slug !== firstRow.slug ||
    row.summary !== firstRow.summary ||
    row.title !== firstRow.title
  ) {
    throw new InvalidPostRowError(
      "PostgreSQL returned inconsistent post data across relations.",
    );
  }
}

function addTag(
  tags: Map<string, PublishedPostTag>,
  slug: string | null,
  name: string | null,
): void {
  if (slug === null || name === null) {
    return;
  }

  const existingTag = tags.get(slug);

  if (existingTag !== undefined && existingTag.name !== name) {
    throw new InvalidPostRowError(
      "PostgreSQL returned conflicting names for one post tag.",
    );
  }

  tags.set(slug, { name, slug });
}

function addProject(
  projects: Map<string, PublishedPostProject>,
  slug: string | null,
  title: string | null,
): void {
  if (slug === null || title === null) {
    return;
  }

  const existingProject = projects.get(slug);

  if (existingProject !== undefined && existingProject.title !== title) {
    throw new InvalidPostRowError(
      "PostgreSQL returned conflicting titles for one related project.",
    );
  }

  projects.set(slug, { slug, title });
}

export function mapPublishedPostListRows(
  rows: readonly unknown[],
): readonly PublishedPostListItem[] {
  const posts = new Map<
    PostSlug,
    { firstRow: ParsedListRow; tags: Map<string, PublishedPostTag> }
  >();

  for (const candidateRow of rows) {
    const row = parseRow(postListRowSchema, candidateRow);
    const existingPost = posts.get(row.slug);

    if (existingPost === undefined) {
      const tags = new Map<string, PublishedPostTag>();
      addTag(tags, row.tagSlug, row.tagName);
      posts.set(row.slug, { firstRow: row, tags });
      continue;
    }

    assertConsistentListRow(existingPost.firstRow, row);
    addTag(existingPost.tags, row.tagSlug, row.tagName);
  }

  return Array.from(posts.values(), ({ firstRow, tags }) => ({
    kind: firstRow.kind,
    publishedAt: firstRow.publishedAt,
    slug: firstRow.slug,
    summary: firstRow.summary,
    tags: Array.from(tags.values()),
    title: firstRow.title,
  }));
}

export function mapPublishedPostDetailRows(
  rows: readonly unknown[],
): PublishedPostDetail | null {
  if (rows.length === 0) {
    return null;
  }

  const parsedRows = rows.map((row) => parseRow(postDetailRowSchema, row));
  const [firstRow] = parsedRows;

  if (firstRow === undefined) {
    return null;
  }

  const tags = new Map<string, PublishedPostTag>();
  const projects = new Map<string, PublishedPostProject>();

  for (const row of parsedRows) {
    assertConsistentDetailRow(firstRow, row);
    addTag(tags, row.tagSlug, row.tagName);
    addProject(projects, row.projectSlug, row.projectTitle);
  }

  return {
    body: firstRow.body,
    kind: firstRow.kind,
    ogImagePath: firstRow.ogImagePath,
    projects: Array.from(projects.values()),
    publishedAt: firstRow.publishedAt,
    seoDescription: firstRow.seoDescription,
    seoTitle: firstRow.seoTitle,
    slug: firstRow.slug,
    summary: firstRow.summary,
    tags: Array.from(tags.values()),
    title: firstRow.title,
  };
}

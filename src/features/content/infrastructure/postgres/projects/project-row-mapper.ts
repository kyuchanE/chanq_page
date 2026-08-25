import { z } from "zod";

import type {
  PublishedProjectDetail,
  PublishedProjectListItem,
} from "@/features/content/domain/projects/project";
import { parseProjectSlug } from "@/features/content/domain/projects/project";

const nonEmptyText = z.string().trim().min(1);
const projectSlug = nonEmptyText.transform((value, context) => {
  const slug = parseProjectSlug(value);

  if (slug === null) {
    context.addIssue({
      code: "custom",
      message: "Expected a lowercase, URL-safe project slug.",
    });

    return z.NEVER;
  }

  return slug;
});
const publishedAt = z.date().transform((value) => value.toISOString());
const webUrl = z
  .url()
  .refine(
    (value) => value.startsWith("https://") || value.startsWith("http://"),
    {
      message: "Expected an HTTP or HTTPS URL.",
    },
  );
const imagePath = z
  .string()
  .startsWith("/")
  .refine((value) => !value.startsWith("//"), {
    message: "Expected an application-relative image path.",
  });

const projectListRowSchema = z
  .object({
    featured: z.boolean(),
    publishedAt,
    slug: projectSlug,
    summary: nonEmptyText,
    title: nonEmptyText,
  })
  .strict();

const projectDetailRowSchema = z
  .object({
    body: nonEmptyText,
    featured: z.boolean(),
    liveUrl: webUrl.nullable(),
    ogImagePath: imagePath.nullable(),
    publishedAt,
    repositoryUrl: webUrl.nullable(),
    seoDescription: nonEmptyText,
    seoTitle: nonEmptyText,
    skillDisplayOrder: z.int().nonnegative().nullable(),
    skillKey: nonEmptyText.nullable(),
    skillName: nonEmptyText.nullable(),
    slug: projectSlug,
    summary: nonEmptyText,
    title: nonEmptyText,
  })
  .strict()
  .superRefine((row, context) => {
    const skillFields = [row.skillDisplayOrder, row.skillKey, row.skillName];
    const hasSkill = skillFields.some((field) => field !== null);
    const hasCompleteSkill = skillFields.every((field) => field !== null);

    if (hasSkill && !hasCompleteSkill) {
      context.addIssue({
        code: "custom",
        message:
          "Expected either a complete skill relation or no skill relation.",
      });
    }
  });

export class InvalidProjectRowError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidProjectRowError";
  }
}

function parseRow<T>(schema: z.ZodType<T>, row: unknown): T {
  const result = schema.safeParse(row);

  if (!result.success) {
    throw new InvalidProjectRowError(
      "PostgreSQL returned a project row that does not match the public project contract.",
      { cause: result.error },
    );
  }

  return result.data;
}

export function mapPublishedProjectListRows(
  rows: readonly unknown[],
): readonly PublishedProjectListItem[] {
  return rows.map((row) => parseRow(projectListRowSchema, row));
}

export function mapPublishedProjectDetailRows(
  rows: readonly unknown[],
): PublishedProjectDetail | null {
  if (rows.length === 0) {
    return null;
  }

  const parsedRows = rows.map((row) => parseRow(projectDetailRowSchema, row));
  const [firstRow] = parsedRows;

  if (firstRow === undefined) {
    return null;
  }

  for (const row of parsedRows.slice(1)) {
    if (
      row.slug !== firstRow.slug ||
      row.title !== firstRow.title ||
      row.summary !== firstRow.summary ||
      row.body !== firstRow.body ||
      row.featured !== firstRow.featured ||
      row.publishedAt !== firstRow.publishedAt ||
      row.seoTitle !== firstRow.seoTitle ||
      row.seoDescription !== firstRow.seoDescription ||
      row.ogImagePath !== firstRow.ogImagePath ||
      row.repositoryUrl !== firstRow.repositoryUrl ||
      row.liveUrl !== firstRow.liveUrl
    ) {
      throw new InvalidProjectRowError(
        "PostgreSQL returned inconsistent project data across skill relations.",
      );
    }
  }

  return {
    body: firstRow.body,
    featured: firstRow.featured,
    liveUrl: firstRow.liveUrl,
    ogImagePath: firstRow.ogImagePath,
    publishedAt: firstRow.publishedAt,
    repositoryUrl: firstRow.repositoryUrl,
    seoDescription: firstRow.seoDescription,
    seoTitle: firstRow.seoTitle,
    skills: parsedRows.flatMap((row) =>
      row.skillKey === null || row.skillName === null
        ? []
        : [{ key: row.skillKey, name: row.skillName }],
    ),
    slug: firstRow.slug,
    summary: firstRow.summary,
    title: firstRow.title,
  };
}

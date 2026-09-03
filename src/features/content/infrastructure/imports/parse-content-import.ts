import { z } from "zod";

import {
  ContentImportError,
  type ContentImportDocument,
} from "../../domain/imports/content-import";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

const text = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine((value) => !value.includes("\0"), "NUL characters are not allowed.");
const identifier = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(100);
const references = z
  .array(identifier)
  .max(1000)
  .superRefine((values, context) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({
        code: "custom",
        message: "Duplicate relation identifier.",
      });
    }
  })
  .transform((values) => values.sort());
const webUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
  );
}, "Expected an HTTP(S) URL without credentials.");
const imagePath = z
  .string()
  .max(500)
  .regex(/^\/(?!\/)[^\\?#\s\u0000-\u001f]+$/)
  .refine(
    (value) => !value.split("/").some((part) => part === "." || part === ".."),
    "Expected an application-relative image path without traversal.",
  );
const writingFields = {
  slug: identifier,
  title: text,
  summary: text,
  body: z
    .string()
    .trim()
    .min(1)
    .max(200_000)
    .refine(
      (value) => !value.includes("\0") && !/^---\r?\n/.test(value),
      "Use Markdown text without NUL characters or frontmatter; metadata belongs in JSON fields.",
    ),
  status: z.enum(["draft", "published"]),
  publishedAt: z.iso.datetime({ precision: 3 }).nullable(),
  seoTitle: text,
  seoDescription: text,
  ogImagePath: imagePath.nullable(),
};

function checkPublication(
  row: { status: string; publishedAt: string | null },
  context: z.RefinementCtx,
) {
  if ((row.status === "published") !== (row.publishedAt !== null)) {
    context.addIssue({
      code: "custom",
      path: ["publishedAt"],
      message:
        "Published content requires a UTC timestamp; drafts require null.",
    });
  }
}

export const importProjectSchema = z
  .object({
    ...writingFields,
    featured: z.boolean(),
    displayOrder: z.int().nonnegative().max(2_147_483_647),
    repositoryUrl: webUrl.nullable(),
    liveUrl: webUrl.nullable(),
    skillKeys: references,
  })
  .strict()
  .superRefine(checkPublication);

export const importPostSchema = z
  .object({
    ...writingFields,
    kind: z.enum(["article", "retrospective"]),
    tagSlugs: references,
    projectSlugs: references,
  })
  .strict()
  .superRefine(checkPublication);

export const importSkillSchema = z
  .object({
    key: identifier,
    name: text,
    category: text,
    summary: text,
    evidence: text,
    displayOrder: z.int().nonnegative().max(2_147_483_647),
    visible: z.boolean(),
  })
  .strict();

export const importTagSchema = z
  .object({ slug: identifier, name: text })
  .strict();

const documentSchema = z
  .object({
    version: z.literal(1),
    skills: z.array(importSkillSchema).max(1000),
    tags: z.array(importTagSchema).max(1000),
    projects: z.array(importProjectSchema).max(1000),
    posts: z.array(importPostSchema).max(1000),
  })
  .strict()
  .superRefine((document, context) => {
    for (const collection of ["skills", "tags", "projects", "posts"] as const) {
      const identifiers = document[collection].map((row) =>
        "key" in row ? row.key : row.slug,
      );
      if (new Set(identifiers).size !== identifiers.length) {
        context.addIssue({
          code: "custom",
          path: [collection],
          message: "Duplicate stable identifier.",
        });
      }
    }
    // Fixture ownership must not enter authored content, including copy or references.
    if (/dev-seed-|test-fixture-/i.test(JSON.stringify(document))) {
      context.addIssue({
        code: "custom",
        message: "Reserved development/test markers are not importable.",
      });
    }
  });

export function parseContentImport(input: unknown): ContentImportDocument {
  const result = documentSchema.safeParse(input);
  if (!result.success) {
    const paths = result.error.issues
      .slice(0, 8)
      .map((issue) => issue.path.join(".") || "document");
    // Do not echo Zod messages, unknown property names, or source values.
    throw new ContentImportError(
      "invalid-input",
      `Invalid import fields: ${paths.join(", ")}. See the version-1 format.`,
    );
  }
  return result.data;
}

export function parseContentImportJson(source: string): ContentImportDocument {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new ContentImportError(
      "invalid-input",
      "Input must be valid JSON; no source content was logged.",
    );
  }
  return parseContentImport(value);
}

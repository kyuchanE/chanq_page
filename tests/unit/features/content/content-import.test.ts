import { describe, expect, it } from "vitest";

import {
  importContent,
  type ContentImportDocument,
  type ContentImportRepository,
} from "@/features/content/imports";
import {
  parseContentImport,
  parseContentImportJson,
} from "@/features/content/imports.server";
import { importFixture } from "../../../fixtures/content-import";

describe("content import file boundary", () => {
  it("rejects identities and references beyond the public read contract's 100-character limit", () => {
    const document = importFixture();
    document.posts[0].slug = "a".repeat(100);
    expect(parseContentImport(document).posts[0].slug).toHaveLength(100);
    document.posts[0].slug += "a";
    expect(() => parseContentImport(document)).toThrow();
    document.posts[0].slug = "valid-post";
    document.posts[0].tagSlugs = ["a".repeat(101)];
    expect(() => parseContentImport(document)).toThrow();
  });

  it("accepts explicit drafts and classified publications with UTC millisecond timestamps", () => {
    const document = importFixture();
    document.posts[0].kind = "retrospective";
    document.posts[0].status = "published";
    document.posts[0].publishedAt = "2025-01-01T00:00:00.000Z";
    expect(parseContentImport(document)).toEqual(document);
    expect(parseContentImportJson(JSON.stringify(document))).toEqual(document);
  });

  it.each([
    [
      "unknown version",
      (value: ContentImportDocument) => ({ ...value, version: 2 }),
    ],
    [
      "unknown field",
      (value: ContentImportDocument) => ({ ...value, mdx: "secret" }),
    ],
    [
      "duplicate key",
      (value: ContentImportDocument) => ({
        ...value,
        skills: [...value.skills, ...value.skills],
      }),
    ],
    [
      "duplicate slug across kinds",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [...value.posts, { ...value.posts[0], kind: "retrospective" }],
      }),
    ],
    [
      "duplicate relation",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], tagSlugs: ["same", "same"] }],
      }),
    ],
    [
      "missing classification",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], kind: undefined }],
      }),
    ],
    [
      "unknown status",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], status: "scheduled" }],
      }),
    ],
    [
      "missing status",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], status: undefined }],
      }),
    ],
    [
      "publication without date",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], status: "published" }],
      }),
    ],
    [
      "draft with date",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], publishedAt: "2025-01-01T00:00:00.000Z" }],
      }),
    ],
    [
      "invalid date",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [
          {
            ...value.posts[0],
            status: "published",
            publishedAt: "2025-02-30T00:00:00.000Z",
          },
        ],
      }),
    ],
    [
      "offset date",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [
          {
            ...value.posts[0],
            status: "published",
            publishedAt: "2025-01-01T00:00:00.000+09:00",
          },
        ],
      }),
    ],
    [
      "invalid slug",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], slug: "../Invalid" }],
      }),
    ],
    [
      "empty summary",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], summary: "  " }],
      }),
    ],
    [
      "frontmatter",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [
          { ...value.posts[0], body: "---\nstatus: published\n---\nBody" },
        ],
      }),
    ],
    [
      "NUL body",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], body: "bad\0body" }],
      }),
    ],
    [
      "executable URL",
      (value: ContentImportDocument) => ({
        ...value,
        projects: [{ ...value.projects[0], liveUrl: "javascript:alert(1)" }],
      }),
    ],
    [
      "URL credentials",
      (value: ContentImportDocument) => ({
        ...value,
        projects: [
          { ...value.projects[0], liveUrl: "https://user:secret@example.com" },
        ],
      }),
    ],
    [
      "external image",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], ogImagePath: "//example.com/image.png" }],
      }),
    ],
    [
      "image traversal",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], ogImagePath: "/../image.png" }],
      }),
    ],
    [
      "negative order",
      (value: ContentImportDocument) => ({
        ...value,
        skills: [{ ...value.skills[0], displayOrder: -1 }],
      }),
    ],
    [
      "missing relation array",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [{ ...value.posts[0], tagSlugs: undefined }],
      }),
    ],
    [
      "UUID override",
      (value: ContentImportDocument) => ({
        ...value,
        posts: [
          { ...value.posts[0], id: "11111111-1111-4111-8111-111111111111" },
        ],
      }),
    ],
  ])("rejects %s", (_name, change) => {
    expect(() => parseContentImport(change(importFixture()))).toThrow(
      /Invalid import fields/,
    );
  });

  it.each(["dev-seed-", "test-fixture-"])(
    "rejects reserved %s markers in identities, relations, and copy",
    (marker) => {
      for (const key of ["slug", "body"] as const) {
        const document = importFixture();
        document.posts[0][key] = `${marker}private`;
        expect(() => parseContentImport(document)).toThrow();
      }
      const document = importFixture();
      document.posts[0].tagSlugs = [`${marker}tag`];
      expect(() => parseContentImport(document)).toThrow();
    },
  );

  it("does not expose invalid JSON, values, or unknown property names in errors", () => {
    expect(() => parseContentImportJson('{"secret-body":')).toThrow(
      "Input must be valid JSON; no source content was logged.",
    );
    try {
      parseContentImport({
        ...importFixture(),
        "secret-property": "secret-body",
      });
    } catch (error) {
      expect(String(error)).not.toMatch(/secret-property|secret-body/);
    }
  });
});

function memoryRepository(initial?: ContentImportDocument) {
  let stored = initial ?? {
    version: 1 as const,
    skills: [],
    tags: [],
    projects: [],
    posts: [],
  };
  let saves = 0;
  const repository: ContentImportRepository = {
    async transaction(_mode, work) {
      return work({
        async load() {
          return {
            content: stored,
            references: { skillKeys: [], tagSlugs: [], projectSlugs: [] },
          };
        },
        async save(changes) {
          stored = changes;
          saves++;
        },
      });
    },
  };
  return { repository, saves: () => saves };
}

describe("content import application policy", () => {
  it("plans all entities without invoking the write port during dry-run", async () => {
    const memory = memoryRepository();
    const summary = await importContent(memory.repository, importFixture(), {
      mode: "dry-run",
      allowPublish: false,
    });
    expect(summary.posts).toEqual({ created: 1, updated: 0, unchanged: 0 });
    expect(summary.projects.created).toBe(1);
    expect(memory.saves()).toBe(0);
  });

  it("keeps drafts as drafts even when publication is permitted", async () => {
    const document = importFixture();
    const memory = memoryRepository();
    await importContent(memory.repository, document, {
      mode: "apply",
      allowPublish: true,
    });
    expect(document.posts[0].status).toBe("draft");
  });

  it("requires explicit publication for new rows and existing drafts, but allows published edits", async () => {
    const draft = importFixture();
    const publication = importFixture();
    publication.posts[0].status = "published";
    publication.posts[0].publishedAt = "2025-01-01T00:00:00.000Z";
    for (const initial of [undefined, draft]) {
      const memory = memoryRepository(initial);
      await expect(
        importContent(memory.repository, publication, {
          mode: "apply",
          allowPublish: false,
        }),
      ).rejects.toMatchObject({ code: "conflict" });
      expect(memory.saves()).toBe(0);
      await expect(
        importContent(memory.repository, publication, {
          mode: "apply",
          allowPublish: true,
        }),
      ).resolves.toBeDefined();
    }
    const memory = memoryRepository(publication);
    const update = structuredClone(publication);
    update.posts[0].title = "Reviewed update";
    expect(
      (
        await importContent(memory.repository, update, {
          mode: "dry-run",
          allowPublish: false,
        })
      ).posts.updated,
    ).toBe(1);
  });

  it("rejects missing references and changes to URL-owning post kinds before saving", async () => {
    const document = importFixture();
    const memory = memoryRepository(document);
    const wrongKind = structuredClone(document);
    wrongKind.posts[0].kind = "retrospective";
    await expect(
      importContent(memory.repository, wrongKind, {
        mode: "apply",
        allowPublish: true,
      }),
    ).rejects.toMatchObject({ code: "conflict" });
    const missing = structuredClone(document);
    missing.posts[0].projectSlugs.push("missing-project");
    await expect(
      importContent(memory.repository, missing, {
        mode: "apply",
        allowPublish: false,
      }),
    ).rejects.toMatchObject({ code: "conflict" });
    expect(memory.saves()).toBe(0);
  });
});

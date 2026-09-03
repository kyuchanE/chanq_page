import { describe, expect, it } from "vitest";

import {
  InvalidPostRowError,
  mapPublishedPostDetailRows,
  mapPublishedPostListRows,
} from "@/features/content/infrastructure/postgres/posts/post-row-mapper";

const publishedAt = new Date("2026-02-15T00:00:00.000Z");

describe("post row mapping", () => {
  it("groups validated list rows and their ordered tags", () => {
    expect(
      mapPublishedPostListRows([
        {
          kind: "article",
          publishedAt,
          slug: "validated-post-rows",
          summary: "A tested post summary.",
          tagName: "Architecture",
          tagSlug: "architecture",
          title: "Validated Post Rows",
        },
        {
          kind: "article",
          publishedAt,
          slug: "validated-post-rows",
          summary: "A tested post summary.",
          tagName: "PostgreSQL",
          tagSlug: "postgresql",
          title: "Validated Post Rows",
        },
      ]),
    ).toEqual([
      {
        kind: "article",
        publishedAt: "2026-02-15T00:00:00.000Z",
        slug: "validated-post-rows",
        summary: "A tested post summary.",
        tags: [
          { name: "Architecture", slug: "architecture" },
          { name: "PostgreSQL", slug: "postgresql" },
        ],
        title: "Validated Post Rows",
      },
    ]);
  });

  it("rejects malformed public post values at the database boundary", () => {
    expect(() =>
      mapPublishedPostListRows([
        {
          kind: "article",
          publishedAt,
          slug: "Not URL Safe",
          summary: "A tested post summary.",
          tagName: null,
          tagSlug: null,
          title: "Invalid Post",
        },
      ]),
    ).toThrow(InvalidPostRowError);
  });

  it("deduplicates cross-joined tags and published projects in detail rows", () => {
    const baseRow = {
      body: "# Post\n\nTrusted Markdown.",
      kind: "retrospective",
      ogImagePath: "/images/post.png",
      publishedAt,
      seoDescription: "Post detail description.",
      seoTitle: "Post detail title",
      slug: "validated-post-rows",
      summary: "A tested post summary.",
      title: "Validated Post Rows",
    } as const;

    expect(
      mapPublishedPostDetailRows([
        {
          ...baseRow,
          projectDisplayOrder: 1,
          projectFeatured: true,
          projectPublishedAt: publishedAt,
          projectSlug: "portfolio-foundation",
          projectTitle: "Portfolio Foundation",
          tagName: "Architecture",
          tagSlug: "architecture",
        },
        {
          ...baseRow,
          projectDisplayOrder: 1,
          projectFeatured: true,
          projectPublishedAt: publishedAt,
          projectSlug: "portfolio-foundation",
          projectTitle: "Portfolio Foundation",
          tagName: "PostgreSQL",
          tagSlug: "postgresql",
        },
      ]),
    ).toMatchObject({
      projects: [
        { slug: "portfolio-foundation", title: "Portfolio Foundation" },
      ],
      tags: [
        { name: "Architecture", slug: "architecture" },
        { name: "PostgreSQL", slug: "postgresql" },
      ],
    });
  });

  it("rejects partial relation data instead of leaking a malformed row", () => {
    expect(() =>
      mapPublishedPostDetailRows([
        {
          body: "# Post",
          kind: "article",
          ogImagePath: null,
          projectDisplayOrder: 1,
          projectFeatured: true,
          projectPublishedAt: publishedAt,
          projectSlug: "portfolio-foundation",
          projectTitle: null,
          publishedAt,
          seoDescription: "Post detail description.",
          seoTitle: "Post detail title",
          slug: "validated-post-rows",
          summary: "A tested post summary.",
          tagName: null,
          tagSlug: null,
          title: "Validated Post Rows",
        },
      ]),
    ).toThrow(InvalidPostRowError);
  });
});

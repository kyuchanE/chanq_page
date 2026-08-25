import { describe, expect, it } from "vitest";

import {
  InvalidProjectRowError,
  mapPublishedProjectDetailRows,
  mapPublishedProjectListRows,
} from "@/features/content/infrastructure/postgres/projects/project-row-mapper";

const publishedAt = new Date("2026-01-15T00:00:00.000Z");

describe("project row mapping", () => {
  it("maps validated list rows into project-owned values", () => {
    expect(
      mapPublishedProjectListRows([
        {
          featured: true,
          publishedAt,
          slug: "portfolio-foundation",
          summary: "A tested summary.",
          title: "Portfolio Foundation",
        },
      ]),
    ).toEqual([
      {
        featured: true,
        publishedAt: "2026-01-15T00:00:00.000Z",
        slug: "portfolio-foundation",
        summary: "A tested summary.",
        title: "Portfolio Foundation",
      },
    ]);
  });

  it("rejects malformed public project values at the database boundary", () => {
    expect(() =>
      mapPublishedProjectListRows([
        {
          featured: false,
          publishedAt,
          slug: "Not URL Safe",
          summary: "A tested summary.",
          title: "Invalid Project",
        },
      ]),
    ).toThrow(InvalidProjectRowError);
  });

  it("maps deterministically ordered skill relations into project detail", () => {
    const baseRow = {
      body: "# Project\n\nTrusted Markdown.",
      featured: true,
      liveUrl: "https://example.com/project",
      ogImagePath: "/images/project.png",
      publishedAt,
      repositoryUrl: "https://github.com/example/project",
      seoDescription: "Project detail description.",
      seoTitle: "Project detail title",
      slug: "portfolio-foundation",
      summary: "A tested summary.",
      title: "Portfolio Foundation",
    };

    expect(
      mapPublishedProjectDetailRows([
        {
          ...baseRow,
          skillDisplayOrder: 1,
          skillKey: "postgresql",
          skillName: "PostgreSQL",
        },
        {
          ...baseRow,
          skillDisplayOrder: 2,
          skillKey: "typescript",
          skillName: "TypeScript",
        },
      ]),
    ).toMatchObject({
      skills: [
        { key: "postgresql", name: "PostgreSQL" },
        { key: "typescript", name: "TypeScript" },
      ],
      slug: "portfolio-foundation",
    });
  });

  it("rejects partial relation data instead of leaking a malformed row", () => {
    expect(() =>
      mapPublishedProjectDetailRows([
        {
          body: "# Project",
          featured: false,
          liveUrl: null,
          ogImagePath: null,
          publishedAt,
          repositoryUrl: null,
          seoDescription: "Project detail description.",
          seoTitle: "Project detail title",
          skillDisplayOrder: 1,
          skillKey: "postgresql",
          skillName: null,
          slug: "portfolio-foundation",
          summary: "A tested summary.",
          title: "Portfolio Foundation",
        },
      ]),
    ).toThrow(InvalidProjectRowError);
  });
});

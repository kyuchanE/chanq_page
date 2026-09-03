import { describe, expect, it } from "vitest";

import { loadHomeHighlights } from "@/features/content/home";
import { parsePostSlug } from "@/features/content/posts";
import {
  homeRepositories,
  previewPosts,
  previewProjects,
  previewSkills,
} from "../../../fixtures/home-repositories";

describe("Home highlights", () => {
  it("bounds projects and skills while excluding skills without published project evidence", async () => {
    const repositories = homeRepositories();
    repositories.projects.listFeatured = async () => [
      ...previewProjects,
      ...previewProjects,
    ];
    repositories.skills.listVisible = async () => [
      { ...previewSkills[0], evidence: " " },
      { ...previewSkills[0], projects: [] },
      ...previewSkills,
    ];

    const result = await loadHomeHighlights(repositories);

    expect(result.projects.items).toEqual(previewProjects);
    expect(result.skills.items).toEqual(previewSkills.slice(0, 3));
    expect(result.skills.unavailable).toBe(false);
  });

  it("merges both writing kinds by newest date with a stable slug tie-breaker and a limit", async () => {
    const repositories = homeRepositories();
    const tied = {
      ...previewPosts[2],
      publishedAt: previewPosts[0].publishedAt,
      slug: parsePostSlug("aaa-tied-post")!,
    };
    repositories.posts.listPublished = async (kind) =>
      kind === "article"
        ? previewPosts.filter((post) => post.kind === kind)
        : [previewPosts[2], tied];

    const result = await loadHomeHighlights(repositories);

    expect(result.writing.items.map((post) => post.slug)).toEqual([
      "aaa-tied-post",
      "sample-safe-retries",
      "sample-publish-together",
    ]);
    expect(result.writing.unavailable).toBe(false);
  });

  it("preserves available sections and writing when another read fails", async () => {
    const repositories = homeRepositories();
    repositories.projects.listFeatured = async () => {
      throw new Error("private database detail");
    };
    repositories.posts.listPublished = async (kind) => {
      if (kind === "article") throw new Error("private database detail");
      return previewPosts.filter((post) => post.kind === kind);
    };

    const result = await loadHomeHighlights(repositories);

    expect(result.projects).toEqual({ items: [], unavailable: true });
    expect(result.skills.items).toHaveLength(3);
    expect(result.writing).toEqual({
      items: [previewPosts[2]],
      unavailable: true,
    });
    expect(JSON.stringify(result)).not.toContain("private database detail");
  });

  it("distinguishes a successful empty query from a failed query", async () => {
    const result = await loadHomeHighlights({
      projects: { listFeatured: async () => [] },
      skills: { listVisible: async () => [] },
      posts: { listPublished: async () => [] },
    });
    expect(result).toEqual({
      projects: { items: [], unavailable: false },
      skills: { items: [], unavailable: false },
      writing: { items: [], unavailable: false },
    });
  });
});

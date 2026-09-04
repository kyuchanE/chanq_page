/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostDetail } from "@/features/content/presentation/posts/post-detail";
import { parsePostSlug, PostList } from "@/features/content/posts";

function postSlug(value: string) {
  const slug = parsePostSlug(value);

  if (slug === null) {
    throw new Error("The component fixture uses an invalid post slug.");
  }

  return slug;
}

describe("post presentation", () => {
  it("renders article summaries, topics, and accessible owning-section links", () => {
    render(
      <PostList
        kind="article"
        posts={[
          {
            kind: "article",
            publishedAt: "2026-02-15T00:00:00.000Z",
            slug: postSlug("validated-post-rows"),
            summary: "A tested post summary.",
            tags: [{ name: "PostgreSQL", slug: "postgresql" }],
            title: "Validated Post Rows",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("list", { name: "Topics for Validated Post Rows" }),
    ).toHaveTextContent("PostgreSQL");
    expect(
      screen.getByRole("link", {
        name: "Read article: Validated Post Rows",
      }),
    ).toHaveAttribute("href", "/blog/validated-post-rows");
  });

  it("renders kind-specific empty states", () => {
    render(<PostList kind="retrospective" posts={[]} />);

    expect(
      screen.getByText(/No retrospectives are published yet/),
    ).toBeVisible();
  });

  it("renders trusted Markdown, topics, and published related projects", () => {
    const { container } = render(
      <PostDetail
        post={{
          body: [
            "# Decision",
            "",
            "The implementation uses **validated rows**.",
            "",
            "<script>window.insecure = true</script>",
            "",
            "[Reference](https://example.com/reference)",
          ].join("\n"),
          kind: "retrospective",
          ogImagePath: null,
          projects: [
            { slug: "portfolio-foundation", title: "Portfolio Foundation" },
          ],
          publishedAt: "2026-02-15T00:00:00.000Z",
          seoDescription: "A tested retrospective.",
          seoTitle: "Validated Post Rows",
          slug: postSlug("validated-post-rows"),
          summary: "A tested post summary.",
          tags: [{ name: "Architecture", slug: "architecture" }],
          title: "Validated Post Rows",
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Validated Post Rows",
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Decision" }),
    ).toBeVisible();
    expect(screen.getByText("validated rows")).toBeVisible();
    expect(container.querySelector("script")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Portfolio Foundation" }),
    ).toHaveAttribute("href", "/projects/portfolio-foundation");
    expect(screen.getByRole("link", { name: /Reference/ })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });
});

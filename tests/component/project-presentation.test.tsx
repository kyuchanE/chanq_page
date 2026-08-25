/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  parseProjectSlug,
  ProjectDetail,
  ProjectList,
} from "@/features/content/projects";

function projectSlug(value: string) {
  const slug = parseProjectSlug(value);

  if (slug === null) {
    throw new Error("The component fixture uses an invalid project slug.");
  }

  return slug;
}

describe("project presentation", () => {
  it("renders published project summaries as accessible case-study links", () => {
    render(
      <ProjectList
        projects={[
          {
            featured: true,
            publishedAt: "2026-01-15T00:00:00.000Z",
            slug: projectSlug("portfolio-foundation"),
            summary: "A project summary.",
            title: "Portfolio Foundation",
          },
        ]}
      />,
    );

    expect(screen.getByText("Featured")).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: "Read the Portfolio Foundation case study",
      }),
    ).toHaveAttribute("href", "/projects/portfolio-foundation");
  });

  it("renders an honest empty state when no project is published", () => {
    render(<ProjectList projects={[]} />);

    expect(
      screen.getByText(/No project case studies are published/),
    ).toBeVisible();
  });

  it("renders CommonMark without executing embedded HTML", () => {
    const { container } = render(
      <ProjectDetail
        project={{
          body: [
            "# Decision",
            "",
            "The implementation uses **validated rows**.",
            "",
            "<script>window.insecure = true</script>",
            "",
            "[Reference](https://example.com/reference)",
          ].join("\n"),
          featured: false,
          liveUrl: null,
          ogImagePath: null,
          publishedAt: "2026-01-15T00:00:00.000Z",
          repositoryUrl: null,
          seoDescription: "A tested project.",
          seoTitle: "Portfolio Foundation",
          skills: [{ key: "typescript", name: "TypeScript" }],
          slug: projectSlug("portfolio-foundation"),
          summary: "A project summary.",
          title: "Portfolio Foundation",
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Portfolio Foundation",
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Decision" }),
    ).toBeVisible();
    expect(screen.getByText("validated rows")).toBeVisible();
    expect(container.querySelector("script")).toBeNull();
    const externalLink = screen.getByRole("link", { name: /Reference/ });

    expect(externalLink).toHaveAttribute("target", "_blank");
    expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});

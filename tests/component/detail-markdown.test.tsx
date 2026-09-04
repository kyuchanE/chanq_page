/** @vitest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DetailMarkdown } from "@/features/content/presentation/markdown/detail-markdown";
import { PostDetail } from "@/features/content/presentation/posts/post-detail";
import { ProjectDetail } from "@/features/content/presentation/projects/project-detail";
import { parsePostSlug } from "@/features/content/posts";
import { parseProjectSlug } from "@/features/content/projects";
import {
  detailMarkdownBody,
  invalidDetailBodies,
} from "../fixtures/detail-markdown";

afterEach(cleanup);

describe("shared detail Markdown", () => {
  it("renders ordered semantic sections, fixed underline, literal code, and safe links", () => {
    const { container } = render(
      <DetailMarkdown
        body={detailMarkdownBody}
        contentSlug="synthetic-markdown"
      />,
    );
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(["Context", "Decision", "Evidence", "References"]);
    expect(container.querySelector("strong")).toHaveTextContent(
      "strong evidence",
    );
    expect(container.querySelector("em")).toHaveTextContent("emphasis");
    const underline = container.querySelector(".content-underline");
    expect(underline).toHaveTextContent(
      "a constraint with weight, care, and code",
    );
    expect(underline?.querySelector("strong")).toHaveTextContent("weight");
    expect(underline?.querySelector("em")).toHaveTextContent("care");
    expect(underline?.querySelector("code")).toHaveTextContent("code");
    expect(container.querySelectorAll(".content-underline")).toHaveLength(1);
    expect(container.querySelector("blockquote")).toHaveTextContent(
      "A quoted limitation.",
    );
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelectorAll("ol li")).toHaveLength(2);
    expect(container.querySelector("pre code")).toHaveTextContent(
      ":underline[fenced] <script>example()</script>",
    );
    expect(screen.getByText(":underline[literal]").tagName).toBe("CODE");
    expect(container).toHaveTextContent(
      ":underline[escaped] and *literal stars*",
    );
    expect(container).toHaveTextContent("{expression}");
    expect(container.querySelector("script")).toBeNull();
    const external = screen.getByRole("link", {
      name: "website (opens in a new tab)",
    });
    expect(external).toHaveAttribute("href", "https://example.com/reference");
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: /source/ })).toHaveAttribute(
      "href",
      "https://github.com/example/example",
    );
    const internal = screen.getByRole("link", { name: "all projects" });
    expect(internal).toHaveAttribute("href", "/projects");
    expect(internal).not.toHaveAttribute("target");
    const fragment = screen.getByRole("link", { name: "context" });
    expect(fragment).toHaveAttribute("href", "#content-context");
    expect(fragment).not.toHaveAttribute("target");
    expect(screen.getByRole("heading", { name: "Context" })).toHaveAttribute(
      "id",
      "content-context",
    );
  });

  it.each(invalidDetailBodies)(
    "defends stored input independently: %s",
    (body) => {
      const { container } = render(
        <DetailMarkdown
          body={`${body}\n\nSurrounding explanation.`}
          contentSlug="synthetic-markdown"
        />,
      );
      expect(
        container.querySelector(
          "a, script, iframe, u, [style], [onclick], .content-underline",
        ),
      ).toBeNull();
      expect(screen.getByText("Surrounding explanation.")).toBeVisible();
      expect(container.querySelector("[href], img[src='']")).toBeNull();
      if (body.startsWith("[unsafe]"))
        expect(container).toHaveTextContent("unsafe");
    },
  );

  it("gives duplicate headings unique prefixed targets and leaves missing links readable", () => {
    const { container } = render(
      <DetailMarkdown
        body={
          "[Second](#content-context-2) [Missing](#not-real)\n\n## Context\n\n## Context\n\n### constructor\n\n#### Deeper\n\n##### Fifth\n\n###### Sixth"
        }
        contentSlug="synthetic-markdown"
      />,
    );
    expect(screen.getAllByRole("heading").map((heading) => heading.id)).toEqual(
      [
        "content-context",
        "content-context-2",
        "content-constructor",
        "content-deeper",
        "content-fifth",
        "content-sixth",
      ],
    );
    expect(screen.getByRole("link", { name: "Second" })).toHaveAttribute(
      "href",
      "#content-context-2",
    );
    expect(screen.queryByRole("link", { name: "Missing" })).toBeNull();
    expect(container).toHaveTextContent("Missing");
  });

  it("reserves local image space and controls GIF playback from a static poster", async () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        addEventListener: (
          _name: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => listeners.add(listener),
        matches: false,
        removeEventListener: (
          _name: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => listeners.delete(listener),
      }),
    });
    const body = [
      "Before the still image.",
      "",
      "![Generated architecture](/media/media-policy-demo/architecture.png)",
      "",
      "![Generated interaction](/media/media-policy-demo/interaction.gif)",
      "",
      "After the GIF.",
    ].join("\n");
    render(<DetailMarkdown body={body} contentSlug="media-policy-demo" />);

    const still = screen.getByRole("img", { name: "Generated architecture" });
    expect(still).toHaveAttribute(
      "src",
      "/media/media-policy-demo/architecture.png",
    );
    expect(still).toHaveAttribute("width", "320");
    expect(still).toHaveAttribute("height", "180");
    expect(still).toHaveAttribute("loading", "lazy");
    const gif = screen.getByRole("img", { name: "Generated interaction" });
    expect(gif).toHaveAttribute(
      "src",
      "/media/media-policy-demo/interaction.poster.webp",
    );
    const play = await screen.findByRole("button", { name: "Play animation" });
    fireEvent.click(play);
    expect(gif).toHaveAttribute(
      "src",
      "/media/media-policy-demo/interaction.gif",
    );
    const stop = screen.getByRole("button", { name: "Stop animation" });
    fireEvent.click(stop);
    expect(gif).toHaveAttribute(
      "src",
      "/media/media-policy-demo/interaction.poster.webp",
    );
    fireEvent.click(screen.getByRole("button", { name: "Play animation" }));
    act(() => {
      for (const listener of listeners) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });
    expect(
      screen.getByRole("button", { name: "Play animation" }),
    ).toBeVisible();
    expect(gif).toHaveAttribute(
      "src",
      "/media/media-policy-demo/interaction.poster.webp",
    );
    expect(screen.getByText("After the GIF.")).toBeVisible();
  });

  it("keeps useful fallback text when stored media is invalid or missing", () => {
    render(
      <DetailMarkdown
        body={
          "Before.\n\n![Stored evidence](/media/missing-content/missing.png)\n\nAfter."
        }
        contentSlug="missing-content"
      />,
    );
    expect(
      screen.getByRole("img", { name: "Stored evidence" }),
    ).toHaveTextContent("Image unavailable: Stored evidence");
    expect(screen.getByText("Before.")).toBeVisible();
    expect(screen.getByText("After.")).toBeVisible();
  });

  it("preserves identical body output across project, article, and retrospective with one plain title each", () => {
    const projectSlug = parseProjectSlug("synthetic-markdown");
    const postSlug = parsePostSlug("synthetic-markdown");
    if (!projectSlug || !postSlug) throw new Error("Invalid fixture slug");
    const fields = {
      body: detailMarkdownBody,
      title: "Plain **title** :underline[example]",
      summary: "Synthetic summary.",
      seoTitle: "Plain SEO title",
      seoDescription: "Plain SEO description",
      ogImagePath: null,
      publishedAt: "2025-01-01T00:00:00.000Z",
    };
    const { container } = render(
      <>
        <ProjectDetail
          project={{
            ...fields,
            slug: projectSlug,
            featured: false,
            skills: [],
            repositoryUrl: null,
            liveUrl: null,
          }}
        />
        <PostDetail
          post={{
            ...fields,
            slug: postSlug,
            kind: "article",
            tags: [],
            projects: [],
          }}
        />
        <PostDetail
          post={{
            ...fields,
            slug: postSlug,
            kind: "retrospective",
            tags: [],
            projects: [],
          }}
        />
      </>,
    );
    const bodies = [...container.querySelectorAll(".content-markdown")].map(
      (body) => body.innerHTML,
    );
    expect(bodies).toHaveLength(3);
    expect(new Set(bodies).size).toBe(1);
    for (const article of container.querySelectorAll("article")) {
      expect(
        within(article).getAllByRole("heading", { level: 1 }),
      ).toHaveLength(1);
      expect(article.querySelector("h1")).toHaveTextContent(fields.title);
      expect(
        article.querySelector("h1 strong, h1 .content-underline"),
      ).toBeNull();
    }
  });
});

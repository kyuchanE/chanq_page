import { describe, expect, it } from "vitest";

import draftExample from "../../../../content/examples/local-draft.json";
import mediaExample from "../../../../content/examples/media-policy-demo.json";
import previewExample from "../../../../content/examples/portfolio-preview.json";
import { resolveBodyLink } from "@/features/content/domain/markdown/body-link";
import { inspectDetailMarkdown } from "@/features/content/infrastructure/markdown/detail-markdown";
import { parseContentImport } from "@/features/content/imports.server";
import { importContent } from "@/features/content/imports";
import { importFixture } from "../../../fixtures/content-import";
import {
  detailMarkdownBody,
  invalidDetailBodies,
} from "../../../fixtures/detail-markdown";

describe("body destination policy", () => {
  it.each([
    ["HTTPS://EXAMPLE.COM/reference", "https://example.com/reference", true],
    ["http://example.com", "http://example.com/", true],
    [
      "/projects?kind=app#content-context",
      "/projects?kind=app#content-context",
      false,
    ],
    ["/projects/hello%20world", "/projects/hello%20world", false],
    ["#content-context", "#content-context", false],
  ])("normalizes an allowed destination %s", (input, href, external) => {
    expect(resolveBodyLink(input)).toEqual({ href, external });
  });

  it.each([
    "",
    "#",
    "relative/path",
    "https:example.com",
    "https:///example.com",
    "https://user:secret@example.com",
    "https://@example.com",
    "//example.com",
    "\\\\example.com",
    "/\\example.com",
    "https://example.com\\path",
    "https://example.com/../path",
    "/./path",
    "/%252e%252e/path",
    "/%25252fexample.com",
    "/%255cexample.com",
    "/%E0%A4",
    "/bad%",
    "/%00",
    "/%2509",
    "/%0a",
    "/%0D",
    "/%7f",
    "/%C2%85",
    "/%E2%80%8B",
    "java\tscript:example",
    "https://example.com\n/path",
    " https://example.com",
    "https://example.com ",
    "javascript:example",
    "data:text/plain,example",
    "file:///path",
    "vbscript:example",
    "mailto:example@example.com",
  ])("rejects %s", (input) => {
    expect(resolveBodyLink(input)).toBeNull();
  });

  it("checks decoded fragments against generated targets, including forward references", () => {
    const targets = new Set(["content-context"]);
    expect(resolveBodyLink("#content-%63ontext", targets)).not.toBeNull();
    expect(resolveBodyLink("#missing", targets)).toBeNull();
    expect(
      inspectDetailMarkdown("[Later](#content-context)\n\n## Context"),
    ).toEqual([]);
  });
});

describe("controlled Markdown import boundary", () => {
  it("preserves existing reviewed inputs and the synthetic text contract", () => {
    for (const example of [draftExample, mediaExample, previewExample]) {
      const parsed = parseContentImport(example);
      expect(
        [...parsed.projects, ...parsed.posts].map((row) => row.body),
      ).toEqual([...example.projects, ...example.posts].map((row) => row.body));
      for (const row of [...example.projects, ...example.posts]) {
        expect(
          inspectDetailMarkdown(row.body, { contentSlug: row.slug }),
        ).toEqual([]);
      }
    }
    const document = importFixture();
    document.projects[0].body = detailMarkdownBody;
    document.posts[0].body = detailMarkdownBody;
    expect(parseContentImport(document)).toEqual(document);
  });

  it.each(invalidDetailBodies)(
    "rejects unsafe syntax without exposing the body: %s",
    (body) => {
      expect(inspectDetailMarkdown(body).length).toBeGreaterThan(0);
      for (const collection of ["projects", "posts"] as const) {
        const document = importFixture();
        document[collection][0].body = body;
        try {
          parseContentImport(document);
          expect.fail("Invalid body was accepted.");
        } catch (error) {
          expect(String(error)).toContain(`${collection}.0.body`);
          expect(String(error)).not.toContain("private-body-value");
        }
      }
    },
  );

  it.each(["dry-run", "apply"] as const)(
    "rejects before any transaction in %s",
    async (mode) => {
      let transactions = 0;
      const repository = {
        transaction: async () => {
          transactions++;
          throw new Error("Unexpected transaction");
        },
      };
      for (const body of invalidDetailBodies) {
        const document = importFixture();
        document.posts[0].body = body;
        await expect(
          (async () =>
            importContent(repository, parseContentImport(document), {
              mode,
              allowPublish: false,
            }))(),
        ).rejects.toMatchObject({ code: "invalid-input" });
      }
      expect(transactions).toBe(0);
    },
  );

  it("returns safe rule locations and accepts code/escaped examples literally", () => {
    expect(
      inspectDetailMarkdown("## Context\n\n[unsafe](javascript:secret)"),
    ).toEqual([{ rule: "link", line: 3, column: 1 }]);
    expect(inspectDetailMarkdown(detailMarkdownBody)).toEqual([]);
    expect(
      inspectDetailMarkdown(
        "`<u>literal</u>` and `:unknown[text]`\n\n    <script>code()</script>",
      ),
    ).toEqual([]);
    expect(
      inspectDetailMarkdown("## Section\n\n" + "Text. ".repeat(30_000)),
    ).toEqual([]);
  });
});

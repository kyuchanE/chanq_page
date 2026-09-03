import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import { importContent } from "../../src/features/content/imports";
import {
  connectPostgresContentImport,
  parseContentImport,
  parseLocalImportTarget,
} from "../../src/features/content/imports.server";
import { importFixture } from "../fixtures/content-import";
import { detailMarkdownBody } from "../fixtures/detail-markdown";

const target = parseLocalImportTarget("test", process.env);
const input = importFixture();
input.posts.push({
  ...input.posts[0],
  slug: "import-check-detail-retro",
  kind: "retrospective",
});
for (const row of [...input.projects, ...input.posts]) {
  row.body = detailMarkdownBody;
  row.status = "published";
  row.publishedAt = "2025-01-01T00:00:00.000Z";
}
const importDocument = parseContentImport(input);

test.beforeAll(async () => {
  const connection = connectPostgresContentImport(target);
  try {
    await importContent(connection.repository, importDocument, {
      mode: "apply",
      allowPublish: true,
    });
  } finally {
    await connection.close();
  }
});

test.afterAll(async () => {
  const pool = new Pool({ connectionString: target.connectionString, max: 1 });
  try {
    const identity = await pool.query(
      "select current_database() as database, current_user as role",
    );
    expect(identity.rows[0]).toEqual({
      database: "chanq_page_test",
      role: "chanq_page_test_app",
    });
    for (const table of ["posts", "projects", "tags", "skills"] as const) {
      const identities = importDocument[table].map((row) =>
        "key" in row ? row.key : row.slug,
      );
      await pool.query(
        `delete from ${table} where ${table === "skills" ? "key" : "slug"} = any($1::text[])`,
        [identities],
      );
    }
  } finally {
    await pool.end();
  }
});

for (const item of [...importDocument.projects, ...importDocument.posts]) {
  const section =
    "kind" in item
      ? item.kind === "article"
        ? "blog"
        : "retrospectives"
      : "projects";
  test(`${section} preserves controlled text, headings, links, and keyboard access`, async ({
    page,
  }, testInfo) => {
    const path = `/${section}/${item.slug}`;
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect((await page.goto(path))?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        item.title,
      );
      const body = page.locator(".content-markdown");
      await expect(body.getByRole("heading", { level: 2 })).toHaveText([
        "Context",
        "Decision",
        "Evidence",
        "References",
      ]);
      await expect(body.locator(".content-underline")).toHaveCount(1);
      await expect(body.locator(".content-underline")).toHaveCSS(
        "text-decoration-line",
        "underline",
      );
      await expect(body.locator("ul")).toHaveCSS("list-style-type", "disc");
      await expect(body.locator("ol")).toHaveCSS("list-style-type", "decimal");
      const external = body.getByRole("link", {
        name: "website (opens in a new tab)",
      });
      await expect(external).toHaveAttribute(
        "href",
        "https://example.com/reference",
      );
      await expect(external).toHaveAttribute("rel", "noopener noreferrer");
      await expect(external).toHaveAttribute("target", "_blank");
      await expect(external).toHaveCSS("text-decoration-style", "double");
      await external.focus();
      await expect(external).toBeFocused();
      await expect(external).toHaveCSS("outline-style", "solid");
      await page.keyboard.press("Tab");
      await expect(
        body.getByRole("link", { name: "source (opens in a new tab)" }),
      ).toBeFocused();
      const fragment = body.getByRole("link", { name: "context", exact: true });
      await fragment.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(`${path}#content-context`);
      await expect(
        body.getByRole("heading", { name: "Context", exact: true }),
      ).toBeInViewport();
      const headingBox = await body
        .getByRole("heading", { name: "Context", exact: true })
        .boundingBox();
      const headerBox = await page.getByRole("banner").boundingBox();
      expect(headingBox).not.toBeNull();
      expect(headerBox).not.toBeNull();
      expect(headingBox!.y).toBeGreaterThanOrEqual(
        headerBox!.y + headerBox!.height,
      );
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        ),
      ).toBe(false);
      expect((await page.reload())?.status()).toBe(200);
      // Project canonical metadata is an existing DEV-10 gap, not a text-renderer change.
      if ("kind" in item) {
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          new RegExp(`${path}$`),
        );
      }
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        item.seoDescription,
      );
      await expect(page).toHaveTitle(new RegExp(item.seoTitle));
      // Capture the document from the top, not a full-page image of a scrolled sticky header.
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement)
          document.activeElement.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({
        path: testInfo.outputPath(`${section}-${width}.png`),
        fullPage: true,
      });
    }
    const internal = page
      .locator(".content-markdown")
      .getByRole("link", { name: "all projects" });
    await internal.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/projects");
  });
}

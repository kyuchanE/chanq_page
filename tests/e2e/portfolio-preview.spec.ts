import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import { importContent } from "../../src/features/content/imports";
import {
  connectPostgresContentImport,
  parseContentImport,
  parseLocalImportTarget,
} from "../../src/features/content/imports.server";

import previewContent from "../../content/examples/portfolio-preview.json";

const target = parseLocalImportTarget("test", process.env);

test.beforeAll(async () => {
  const document = parseContentImport(previewContent);
  const connection = connectPostgresContentImport(target);
  try {
    const preview = await importContent(connection.repository, document, {
      mode: "dry-run",
      allowPublish: true,
    });
    expect(preview.projects).toEqual({ created: 2, updated: 0, unchanged: 0 });
    expect(preview.posts).toEqual({ created: 3, updated: 0, unchanged: 0 });
    const applied = await importContent(connection.repository, document, {
      mode: "apply",
      allowPublish: true,
    });
    expect(applied.projects.created).toBe(2);
    expect(applied.posts.created).toBe(3);
    const repeated = await importContent(connection.repository, document, {
      mode: "apply",
      allowPublish: true,
    });
    for (const collection of ["skills", "tags", "projects", "posts"] as const) {
      expect(repeated[collection]).toEqual({
        created: 0,
        updated: 0,
        unchanged: document[collection].length,
      });
    }
  } finally {
    await connection.close();
  }
});

test.afterAll(async () => {
  const document = parseContentImport(previewContent);
  const pool = new Pool({ connectionString: target.connectionString, max: 1 });
  try {
    const identity = await pool.query(
      "select current_database() as database, current_user as role",
    );
    expect(identity.rows[0]).toEqual({
      database: "chanq_page_test",
      role: "chanq_page_test_app",
    });
    // This file owns only these sample rows in the resettable test database.
    for (const table of ["posts", "projects", "tags", "skills"] as const) {
      const keys = document[table].map((row) =>
        "key" in row ? row.key : row.slug,
      );
      await pool.query(
        `delete from ${table} where ${table === "skills" ? "key" : "slug"} = any($1::text[])`,
        [keys],
      );
    }
  } finally {
    await pool.end();
  }
});

test("sample content survives import, primary navigation, detail navigation, and refresh", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("complementary", { name: "Sample content notice" }),
  ).toBeVisible();
  const featured = page.getByRole("region", { name: "Featured projects" });
  await expect(featured.getByRole("heading", { level: 3 })).toHaveText([
    "Field Notes — sample offline journal",
    "Reading Room — sample publishing site",
  ]);
  const recent = page.getByRole("region", { name: "Recent writing" });
  await expect(recent.getByRole("heading", { level: 3 })).toHaveText([
    "Sample article: a retry is a state transition",
    "Sample article: publish a post and its links together",
    "Sample retrospective: make unsynced work visible",
  ]);
  for (const name of [
    "About",
    "Skills",
    "Projects",
    "Retrospectives",
    "Blog",
    "Contact",
    "Home",
  ]) {
    await page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name, exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect((await page.reload())?.status()).toBe(200);
  }

  const document = parseContentImport(previewContent);
  for (const item of [...document.projects, ...document.posts]) {
    const section =
      "kind" in item
        ? item.kind === "article"
          ? "blog"
          : "retrospectives"
        : "projects";
    expect((await page.goto(`/${section}/${item.slug}`))?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: item.title }),
    ).toBeVisible();
    await expect(
      page.locator(".content-markdown blockquote").first(),
    ).toContainText(/sample|fictional/i);
    for (const link of await page
      .locator('.content-markdown a[href^="/"]')
      .all()) {
      const href = await link.getAttribute("href");
      expect((await page.request.get(href!)).status()).toBe(200);
    }
    expect((await page.reload())?.status()).toBe(200);
  }
});

test("Home, About, and Contact fit mobile, tablet, and desktop with coherent headings", async ({
  page,
}) => {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    for (const path of ["/", "/about", "/contact"]) {
      expect((await page.goto(path))?.status()).toBe(200);
      if (path === "/")
        await expect(
          page.getByRole("heading", { level: 2, name: "Recent writing" }),
        ).toBeVisible();
      const state = await page.evaluate(() => ({
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        headings: Array.from(
          document.querySelectorAll("main h1, main h2, main h3"),
        ).map((heading) => Number(heading.tagName.slice(1))),
        missingAlt: document.querySelectorAll("main img:not([alt])").length,
      }));
      expect(state.overflow).toBe(false);
      expect(state.headings[0]).toBe(1);
      expect(state.headings.filter((level) => level === 1)).toHaveLength(1);
      expect(
        state.headings.some(
          (level, index) => index > 0 && level > state.headings[index - 1] + 1,
        ),
      ).toBe(false);
      expect(state.missingAlt).toBe(0);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${path === "/" ? "/" : path}$`),
      );
    }
  }
});

test("keyboard users can reach project, writing, and sample contact links", async ({
  page,
}) => {
  await page.goto("/");
  const project = page.getByRole("link", {
    name: "Read the Field Notes — sample offline journal case study",
  });
  await project.focus();
  await expect(project).toBeFocused();
  const focusStyle = await project.evaluate((element) => ({
    style: getComputedStyle(element).outlineStyle,
    width: getComputedStyle(element).outlineWidth,
  }));
  expect(focusStyle.style).toBe("solid");
  expect(focusStyle.width).not.toBe("0px");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projects\/sample-field-notes$/);
  await page.goto("/");
  const writing = page.getByRole("link", {
    name: "Read retrospective: Sample retrospective: make unsynced work visible",
  });
  await writing.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/retrospectives\/sample-visible-state$/);
  await page.goto("/contact");
  const email = page.getByRole("link", {
    name: "hello@example.com (sample email)",
  });
  await email.focus();
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("href", "mailto:hello@example.com");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Visit the sample profile destination" }),
  ).toBeFocused();
  await expect(page.locator("form")).toHaveCount(0);
});

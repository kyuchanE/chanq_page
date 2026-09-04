import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import mediaExample from "../../content/examples/media-policy-demo.json";
import { importContent } from "../../src/features/content/imports";
import {
  connectPostgresContentImport,
  parseContentImport,
  parseLocalImportTarget,
} from "../../src/features/content/imports.server";

const target = parseLocalImportTarget("test", process.env);
const mediaDocument = parseContentImport(mediaExample);
const detailItems = [
  ...mediaDocument.projects,
  ...mediaDocument.posts,
] as const;

function detailContext(item: (typeof detailItems)[number]) {
  if (!("kind" in item)) {
    return { label: "project", section: "projects" } as const;
  }
  return item.kind === "article"
    ? ({ label: "article", section: "blog" } as const)
    : ({ label: "retrospective", section: "retrospectives" } as const);
}

test.beforeAll(async () => {
  const connection = connectPostgresContentImport(target);
  try {
    const preview = await importContent(connection.repository, mediaDocument, {
      mode: "dry-run",
      allowPublish: true,
    });
    expect(preview.projects.created).toBe(1);
    expect(preview.posts.created).toBe(2);
    await importContent(connection.repository, mediaDocument, {
      mode: "apply",
      allowPublish: true,
    });
    const repeat = await importContent(connection.repository, mediaDocument, {
      mode: "apply",
      allowPublish: true,
    });
    expect(repeat.projects.unchanged).toBe(1);
    expect(repeat.posts.unchanged).toBe(2);
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
      const identities = mediaDocument[table].map((row) =>
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

for (const item of detailItems) {
  const { label, section } = detailContext(item);
  test(`${section} completes the public mixed-content round trip`, async ({
    browser,
    page,
  }, testInfo) => {
    const path = `/${section}/${item.slug}`;
    const assetRoot = `/media/${item.slug}`;
    const stillAlt = `Synthetic ${label} diagram with green and cream bands crossed by an orange marker`;
    const cardAlt = `Synthetic ${label} review card with green and orange blocks labeled Synthetic`;
    const gifAlt = `Synthetic ${label} ${label === "project" ? "workflow" : "sequence"} shown as diagonal stripes moving between two positions`;
    const animationRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith(`${assetRoot}/interaction.gif`)) {
        animationRequests.push(request.url());
      }
    });
    await page.emulateMedia({ reducedMotion: "no-preference" });

    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect((await page.goto(path))?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        item.title,
      );

      const body = page.locator(".content-markdown");
      await expect(body.getByRole("heading", { level: 2 })).toHaveText([
        "Context and constraints",
        "Still-image evidence",
        "Controlled interaction",
        "Website reference",
        "GitHub source",
      ]);
      await expect(
        body.locator("strong", { hasText: "bold evidence" }),
      ).toHaveCount(1);
      await expect(
        body.locator("em", { hasText: "italic context" }),
      ).toHaveCount(1);
      const underlined = body.locator(".content-underline", {
        hasText: "a fixed constraint",
      });
      await expect(underlined).toHaveCSS("text-decoration-line", "underline");

      const internal = body.getByRole("link", {
        name: "internal project index",
      });
      await expect(internal).toHaveAttribute("href", "/projects");
      const inParagraphReference = body.getByRole("link", {
        name: "in-paragraph authoring reference (opens in a new tab)",
      });
      await expect(inParagraphReference).toHaveAttribute(
        "href",
        "https://example.com/reference",
      );
      await expect(inParagraphReference).toHaveCSS(
        "text-decoration-style",
        "double",
      );
      await expect(body.locator("ul").first()).toHaveCSS(
        "list-style-type",
        "disc",
      );
      await expect(body.locator("ol")).toHaveCSS("list-style-type", "decimal");

      const still = body.getByRole("img", { name: stillAlt });
      const card = body.getByRole("img", { name: cardAlt });
      const gif = body.getByRole("img", { name: gifAlt });
      for (const image of [still, card, gif]) {
        await expect(image).toHaveAttribute("width", "320");
        await expect(image).toHaveAttribute("height", "180");
        await expect(image).toHaveAttribute("loading", "lazy");
        await expect
          .poll(() =>
            image.evaluate((element: HTMLImageElement) => ({
              height: element.naturalHeight,
              width: element.naturalWidth,
            })),
          )
          .toEqual({ height: 180, width: 320 });
      }
      await expect(still).toHaveAttribute(
        "src",
        `${assetRoot}/architecture.png`,
      );
      await expect(card).toHaveAttribute("src", `${assetRoot}/still.jpg`);
      await expect(gif).toHaveAttribute(
        "src",
        `${assetRoot}/interaction.poster.webp`,
      );
      await expect(
        still.locator("xpath=ancestor::p/preceding-sibling::*[1]"),
      ).toContainText("exercise reserved intrinsic sizing");
      await expect(
        gif.locator("xpath=ancestor::p/following-sibling::*[1]"),
      ).toContainText("explanation follows the GIF");

      const website = body.getByRole("link", {
        name: `Synthetic ${label} website (opens in a new tab)`,
      });
      const source = body.getByRole("link", {
        name: `Synthetic ${label} source (opens in a new tab)`,
      });
      for (const external of [website, source]) {
        await expect(external).toHaveAttribute("rel", "noopener noreferrer");
        await expect(external).toHaveAttribute("target", "_blank");
      }

      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        ),
      ).toBe(false);
      expect(
        await gif.evaluate(
          (element) =>
            element.getBoundingClientRect().width <=
            element.closest(".content-markdown")!.getBoundingClientRect().width,
        ),
      ).toBe(true);
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
      expect((await page.reload())?.status()).toBe(200);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: testInfo.outputPath(`${section}-${width}.png`),
        fullPage: true,
      });
    }

    expect(animationRequests).toEqual([]);
    const internal = page.getByRole("link", {
      name: "internal project index",
    });
    const inParagraphReference = page.getByRole("link", {
      name: "in-paragraph authoring reference (opens in a new tab)",
    });
    await internal.focus();
    await expect(internal).toBeFocused();
    await expect(internal).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Tab");
    await expect(inParagraphReference).toBeFocused();

    const fragment = page.getByRole("link", {
      name: "Return to context",
      exact: true,
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await fragment.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${path}#content-context-and-constraints`);
    const contextHeading = page.getByRole("heading", {
      level: 2,
      name: "Context and constraints",
    });
    await expect(contextHeading).toBeInViewport();
    const headingBox = await contextHeading.boundingBox();
    const headerBox = await page.getByRole("banner").boundingBox();
    expect(headingBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    // Sticky-header borders and heading line boxes can differ by a few fractional
    // pixels while the text remains fully visible below the header.
    expect(headingBox!.y + 4).toBeGreaterThanOrEqual(
      headerBox!.y + headerBox!.height,
    );

    await page.emulateMedia({ reducedMotion: "no-preference" });
    const play = page.getByRole("button", { name: "Play animation" });
    await play.focus();
    await expect(play).toBeFocused();
    await expect(play).toHaveCSS("outline-style", "solid");
    const animationResponse = page.waitForResponse((response) =>
      response.url().endsWith(`${assetRoot}/interaction.gif`),
    );
    await page.keyboard.press("Enter");
    expect((await animationResponse).status()).toBe(200);
    const gif = page.getByRole("img", { name: gifAlt });
    await expect(gif).toHaveAttribute("src", `${assetRoot}/interaction.gif`);
    await page.getByRole("button", { name: "Stop animation" }).click();
    await expect(gif).toHaveAttribute(
      "src",
      `${assetRoot}/interaction.poster.webp`,
    );
    await page.getByRole("button", { name: "Play animation" }).click();
    await expect(gif).toHaveAttribute("src", `${assetRoot}/interaction.gif`);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(
      page.getByRole("button", { name: "Play animation" }),
    ).toBeVisible();
    await expect(gif).toHaveAttribute(
      "src",
      `${assetRoot}/interaction.poster.webp`,
    );

    const noScriptContext = await browser.newContext({
      baseURL: test.info().project.use.baseURL as string,
      javaScriptEnabled: false,
    });
    try {
      const noScriptPage = await noScriptContext.newPage();
      expect((await noScriptPage.goto(path))?.status()).toBe(200);
      await expect(
        noScriptPage.getByRole("img", { name: gifAlt }),
      ).toHaveAttribute("src", `${assetRoot}/interaction.poster.webp`);
      await expect(noScriptPage.getByRole("button")).toHaveCount(0);
    } finally {
      await noScriptContext.close();
    }

    await internal.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/projects");
  });
}

test("mixed-content posts retain kind-owned 404 behavior", async ({ page }) => {
  for (const { heading, path } of [
    {
      heading: "This article is not available.",
      path: "/blog/media-policy-retrospective-demo",
    },
    {
      heading: "This retrospective is not available.",
      path: "/retrospectives/media-policy-article-demo",
    },
  ]) {
    expect((await page.goto(path))?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  }
});

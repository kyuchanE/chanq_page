import { expect, test } from "@playwright/test";

const routes = [
  { currentLink: "Home", path: "/" },
  { currentLink: "About", path: "/about" },
  { currentLink: "Skills", path: "/skills" },
  { currentLink: "Projects", path: "/projects" },
  { currentLink: "Retrospectives", path: "/retrospectives" },
  { currentLink: "Blog", path: "/blog" },
  { currentLink: "Contact", path: "/contact" },
];

test("a visitor can open every primary route directly", async ({ page }) => {
  for (const { currentLink, path } of routes) {
    await test.step(path, async () => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("link", { exact: true, name: currentLink }),
      ).toHaveAttribute("aria-current", "page");
    });
  }
});

test("the public shell exposes landmarks and keyboard skip navigation", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(
    page.getByRole("banner").getByText("Hello, World!", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeAttached();

  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("the shell adapts without page overflow at primary viewport sizes", async ({
  page,
}) => {
  const viewports = [
    { expectedGutter: "1rem", height: 812, name: "mobile", width: 375 },
    { expectedGutter: "2rem", height: 1024, name: "tablet", width: 768 },
    { expectedGutter: "3rem", height: 900, name: "desktop", width: 1440 },
  ] as const;

  for (const viewport of viewports) {
    await test.step(viewport.name, async () => {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const layoutState = await page.locator("html").evaluate((element) => {
        const title = document.querySelector<HTMLElement>(
          ".site-header__title",
        );
        const navigation = document.querySelector<HTMLElement>(
          ".primary-navigation__list",
        );
        const links = Array.from(
          document.querySelectorAll<HTMLElement>(".primary-navigation__link"),
        );
        const titleBounds = title?.getBoundingClientRect();
        const navigationBounds = navigation?.getBoundingClientRect();

        return {
          gutter: getComputedStyle(element)
            .getPropertyValue("--page-gutter")
            .trim(),
          hasClippedHeaderText:
            title === null || title.scrollWidth > title.clientWidth,
          hasClippedNavigationLink:
            navigationBounds === undefined ||
            links.some((link) => {
              const bounds = link.getBoundingClientRect();

              return (
                bounds.left < navigationBounds.left ||
                bounds.right > navigationBounds.right
              );
            }),
          hasPageOverflow:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
          isNavigationBelowTitle:
            titleBounds !== undefined &&
            navigationBounds !== undefined &&
            navigationBounds.top >= titleBounds.bottom,
        };
      });

      expect(layoutState.gutter).toBe(viewport.expectedGutter);
      expect(layoutState.hasClippedHeaderText).toBe(false);
      expect(layoutState.hasClippedNavigationLink).toBe(false);
      expect(layoutState.hasPageOverflow).toBe(false);
      expect(layoutState.isNavigationBelowTitle).toBe(true);
    });
  }
});

test("only the navigation remains pinned after the title scrolls away", async ({
  page,
}) => {
  const viewports = [
    { height: 720, name: "mobile", width: 375 },
    { height: 720, name: "desktop", width: 1280 },
  ] as const;

  for (const viewport of viewports) {
    await test.step(viewport.name, async () => {
      await page.setViewportSize(viewport);
      await page.goto("/about");

      const title = page.locator(".site-header__title");
      const navigationBar = page.locator(".site-navigation-bar");
      const navigationLink = page
        .getByRole("navigation", { name: "Primary navigation" })
        .getByRole("link", { name: "About", exact: true });
      const pageTitle = page.getByRole("heading", { level: 1 });

      const initialPositions = await page.evaluate(() => {
        const titleElement = document.querySelector<HTMLElement>(
          ".site-header__title",
        );
        const navigationElement = document.querySelector<HTMLElement>(
          ".site-navigation-bar",
        );

        if (titleElement === null || navigationElement === null) {
          throw new Error("The public shell header is incomplete.");
        }

        return {
          navigationTop: navigationElement.getBoundingClientRect().top,
          titleBottom: titleElement.getBoundingClientRect().bottom,
        };
      });
      const bodyFontFamily = await page
        .locator("body")
        .evaluate((element) => getComputedStyle(element).fontFamily);
      const titleFontFamily = await title.evaluate(
        (element) => getComputedStyle(element).fontFamily,
      );

      expect(initialPositions.navigationTop).toBeGreaterThanOrEqual(
        initialPositions.titleBottom,
      );
      await expect(navigationLink).toHaveCSS("font-family", bodyFontFamily);
      expect(titleFontFamily).toBe(
        await pageTitle.evaluate(
          (element) => getComputedStyle(element).fontFamily,
        ),
      );
      expect(titleFontFamily).not.toBe(bodyFontFamily);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(0);
      await expect
        .poll(() =>
          navigationBar.evaluate(
            (element) => element.getBoundingClientRect().top,
          ),
        )
        .toBe(0);
      await expect
        .poll(() =>
          title.evaluate((element) => element.getBoundingClientRect().bottom),
        )
        .toBeLessThanOrEqual(0);
    });
  }
});

test("reduced-motion preference disables smooth page scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const scrollBehavior = await page
    .locator("html")
    .evaluate((element) => getComputedStyle(element).scrollBehavior);

  expect(scrollBehavior).toBe("auto");
});

test("an unknown route returns a useful not-found response", async ({
  page,
}) => {
  const response = await page.goto("/route-that-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});

test("a visitor can browse and reopen a published project case study", async ({
  page,
}) => {
  const listResponse = await page.goto("/projects");

  expect(listResponse?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Published projects" }),
  ).toBeVisible();

  const caseStudyLink = page.getByRole("link", {
    name: "Read the Fixture Featured Project case study",
  });

  await expect(caseStudyLink).toBeVisible();
  await caseStudyLink.click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Fixture Featured Project" }),
  ).toBeVisible();
  await expect(page.getByText("Fixture PostgreSQL")).toBeVisible();
  await expect(page).toHaveTitle(
    "Fixture Featured Project | ChanQ Developer Portfolio",
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Synthetic featured project for integration tests.",
  );

  const refreshResponse = await page.reload();

  expect(refreshResponse?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 2, name: "Fixture Featured Project" }),
  ).toBeVisible();
});

test("draft, unknown, and malformed project slugs return project 404s", async ({
  page,
}) => {
  const paths = [
    "/projects/test-fixture-draft-project",
    "/projects/unknown-project",
    "/projects/Not-URL-Safe",
  ];

  for (const path of paths) {
    await test.step(path, async () => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(404);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "This case study is not available.",
        }),
      ).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    });
  }
});

test("skills expose published project evidence across responsive layouts", async ({
  page,
}) => {
  const viewports = [
    { height: 812, name: "mobile", width: 375 },
    { height: 900, name: "desktop", width: 1440 },
  ] as const;

  for (const viewport of viewports) {
    await test.step(viewport.name, async () => {
      await page.setViewportSize(viewport);
      const response = await page.goto("/skills");

      expect(response?.status()).toBe(200);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Skills",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 2, name: "Database" }),
      ).toBeVisible();
      await expect(page.getByText("Fixture Hidden Skill")).toHaveCount(0);
      await expect(page.getByText("Fixture Draft Project")).toHaveCount(0);

      const hasPageOverflow = await page
        .locator("html")
        .evaluate((element) => element.scrollWidth > element.clientWidth);

      expect(hasPageOverflow).toBe(false);
    });
  }

  await expect(page).toHaveTitle("Skills | ChanQ Developer Portfolio");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Technical skills connected to practical experience and supporting evidence.",
  );

  const evidenceLink = page
    .getByRole("link", { exact: true, name: "Fixture Featured Project" })
    .first();

  await evidenceLink.focus();
  await expect(evidenceLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projects\/test-fixture-featured-project$/);

  const refreshResponse = await page.reload();

  expect(refreshResponse?.status()).toBe(200);
});

test("a visitor can browse and reopen a published technical article", async ({
  page,
}) => {
  const listResponse = await page.goto("/blog");

  expect(listResponse?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Published articles" }),
  ).toBeVisible();
  await expect(page.locator(".post-card h3")).toHaveText([
    "Fixture Published Post",
    "Fixture Older Article",
  ]);
  await expect(page.getByText("Fixture Draft Article")).toHaveCount(0);
  await expect(page.getByText("Fixture Published Retrospective")).toHaveCount(
    0,
  );
  await expect(page).toHaveTitle("Blog | ChanQ Developer Portfolio");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/blog$/,
  );

  const articleLink = page.getByRole("link", {
    name: "Read article: Fixture Published Post",
  });

  await articleLink.focus();
  await expect(articleLink).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(
    page.getByRole("heading", { level: 1, name: "Fixture Published Post" }),
  ).toBeVisible();
  await expect(page.getByText("Fixture Architecture")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Fixture Featured Project" }),
  ).toBeVisible();
  await expect(page).toHaveTitle(
    "Fixture Published Post | ChanQ Developer Portfolio",
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Synthetic published post for integration tests.",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/blog\/test-fixture-published-post$/,
  );

  const refreshResponse = await page.reload();

  expect(refreshResponse?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 2, name: "Fixture Published Post" }),
  ).toBeVisible();
});

test("a visitor can open a retrospective directly with published relations", async ({
  page,
}) => {
  const listResponse = await page.goto("/retrospectives");

  expect(listResponse?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Published retrospectives" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Read retrospective: Fixture Published Retrospective",
    }),
  ).toBeVisible();
  await expect(page.getByText("Fixture Draft Post")).toHaveCount(0);
  await expect(page.getByText("Fixture Published Post")).toHaveCount(0);
  await expect(page).toHaveTitle("Retrospectives | ChanQ Developer Portfolio");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/retrospectives$/,
  );

  const detailResponse = await page.goto(
    "/retrospectives/test-fixture-published-retrospective",
  );

  expect(detailResponse?.status()).toBe(200);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Fixture Published Retrospective",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Fixture Standard Project" }),
  ).toBeVisible();
  await expect(page.getByText("Fixture Draft Project")).toHaveCount(0);
  await expect(page).toHaveTitle(
    "Fixture Published Retrospective | ChanQ Developer Portfolio",
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Synthetic published retrospective for integration tests.",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/retrospectives\/test-fixture-published-retrospective$/,
  );

  const refreshResponse = await page.reload();

  expect(refreshResponse?.status()).toBe(200);
});

test("post lists and details remain usable without horizontal overflow", async ({
  page,
}) => {
  const paths = [
    "/blog",
    "/blog/test-fixture-published-post",
    "/retrospectives",
    "/retrospectives/test-fixture-published-retrospective",
  ];
  const viewports = [
    { height: 812, name: "mobile", width: 375 },
    { height: 900, name: "desktop", width: 1440 },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const path of paths) {
      await test.step(`${viewport.name} ${path}`, async () => {
        const response = await page.goto(path);

        expect(response?.status()).toBe(200);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

        const hasPageOverflow = await page
          .locator("html")
          .evaluate((element) => element.scrollWidth > element.clientWidth);

        expect(hasPageOverflow).toBe(false);
      });
    }
  }
});

test("draft, mismatched, unknown, and malformed article URLs return 404", async ({
  page,
}) => {
  const paths = [
    "/blog/test-fixture-draft-article",
    "/blog/test-fixture-published-retrospective",
    "/blog/unknown-article",
    "/blog/Not-URL-Safe",
  ];

  for (const path of paths) {
    await test.step(path, async () => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(404);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "This article is not available.",
        }),
      ).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    });
  }
});

test("draft, mismatched, unknown, and malformed retrospective URLs return 404", async ({
  page,
}) => {
  const paths = [
    "/retrospectives/test-fixture-draft-post",
    "/retrospectives/test-fixture-published-post",
    "/retrospectives/unknown-retrospective",
    "/retrospectives/Not-URL-Safe",
  ];

  for (const path of paths) {
    await test.step(path, async () => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(404);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "This retrospective is not available.",
        }),
      ).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    });
  }
});

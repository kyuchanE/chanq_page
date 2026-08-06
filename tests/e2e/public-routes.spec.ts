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
        const navigation = document
          .querySelector(".primary-navigation__list")
          ?.getBoundingClientRect();
        const links = Array.from(
          document.querySelectorAll(".primary-navigation__link"),
        );

        return {
          gutter: getComputedStyle(element)
            .getPropertyValue("--page-gutter")
            .trim(),
          hasClippedNavigationLink:
            navigation === undefined ||
            links.some((link) => {
              const bounds = link.getBoundingClientRect();

              return (
                bounds.left < navigation.left || bounds.right > navigation.right
              );
            }),
          hasPageOverflow:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        };
      });

      expect(layoutState.gutter).toBe(viewport.expectedGutter);
      expect(layoutState.hasClippedNavigationLink).toBe(false);
      expect(layoutState.hasPageOverflow).toBe(false);
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

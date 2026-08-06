import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/about",
  "/skills",
  "/projects",
  "/retrospectives",
  "/blog",
  "/contact",
];

test("a visitor can open every primary route directly", async ({ page }) => {
  for (const route of routes) {
    await test.step(route, async () => {
      const response = await page.goto(route);

      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});

test("an unknown route returns a useful not-found response", async ({
  page,
}) => {
  const response = await page.goto("/route-that-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});

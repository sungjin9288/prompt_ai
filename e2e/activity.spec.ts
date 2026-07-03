import { test, expect } from "@playwright/test";

/**
 * Activity timeline renders empty-state guidance for an empty workspace and is
 * reachable from the app shell navigation.
 */
test("shows empty-state guidance for an empty workspace", async ({ page }) => {
  await page.goto("/activity");

  await expect(page.getByRole("heading", { name: "최근 활동" })).toBeVisible();
  await expect(page.getByText("아직 활동이 없어요")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Studio 열기" }),
  ).toBeVisible();
});

test("navigates to the activity page from the app shell nav", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("navigation", { name: "주요 메뉴" })
    .getByRole("link", { name: "활동" })
    .click();

  await expect(page).toHaveURL("/activity");
  await expect(page.getByRole("heading", { name: "최근 활동" })).toBeVisible();
});

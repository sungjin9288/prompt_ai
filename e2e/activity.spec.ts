import { test, expect } from "@playwright/test";

/**
 * Activity timeline is co-located on the dashboard home as the `#activity`
 * section. It renders empty-state guidance for an empty workspace and stays
 * reachable from the app shell's go-to shortcuts and command palette.
 */
test("shows empty-state guidance for an empty workspace", async ({ page }) => {
  await page.goto("/#activity");

  await expect(page.getByRole("heading", { name: "최근 활동" })).toBeVisible();
  await expect(page.getByText("아직 활동이 없어요")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Studio 열기" }),
  ).toBeVisible();
});

test("redirects the legacy /activity route to the dashboard activity section", async ({
  page,
}) => {
  await page.goto("/activity");

  await expect(page).toHaveURL("/#activity");
  await expect(page.getByRole("heading", { name: "최근 활동" })).toBeVisible();
});

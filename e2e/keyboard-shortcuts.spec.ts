import { test, expect } from "@playwright/test";

/**
 * Global keyboard shortcuts: a "?" help overlay, a "g" prefixed go-to
 * navigation sequence, and an input guard so typing in a field never
 * triggers navigation or the help overlay.
 */
test("opens the help overlay with ? and closes it with Esc", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();

  const dialog = page.getByRole("dialog", { name: "키보드 단축키" });

  // The global keydown listener attaches in a post-hydration effect, so an
  // early "?" can be dropped; retry the press until the overlay appears.
  await expect(async () => {
    await page.keyboard.press("Shift+Slash");
    await expect(dialog).toBeVisible({ timeout: 800 });
  }).toPass({ timeout: 6000, intervals: [900] });

  await expect(dialog.getByText("검색 팔레트 열기")).toBeVisible();
  await expect(dialog.getByText("홈으로 이동")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(dialog).toBeHidden();
});

test("navigates with the g then l go-to sequence", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();

  await page.keyboard.press("g");
  await page.keyboard.press("l");

  await expect(page).toHaveURL(/\/library$/);
});

test("ignores shortcuts while a text input has focus", async ({ page }) => {
  await page.goto("/studio");

  const textInput = page.locator('input[type="text"], textarea').first();
  await textInput.waitFor({ state: "visible" });
  await textInput.click();

  await page.keyboard.press("g");
  await page.keyboard.press("l");

  await expect(page).toHaveURL(/\/studio$/);
  await expect(
    page.getByRole("dialog", { name: "키보드 단축키" }),
  ).toBeHidden();
});

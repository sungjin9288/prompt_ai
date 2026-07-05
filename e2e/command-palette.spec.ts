import { test, expect } from "@playwright/test";

/**
 * Command palette: open with the keyboard shortcut from anywhere, search for a
 * navigation target, and confirm Enter navigates and closes the dialog.
 */
test("opens with a keyboard shortcut and navigates to a search result", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();

  const dialog = page.getByRole("dialog", { name: "워크스페이스 검색" });

  // Control+K is used on Linux/Windows CI runners; Cmd+K is the Mac
  // equivalent. The keydown listener attaches in a post-hydration effect, so
  // retry the open until it takes.
  await expect(async () => {
    await page.keyboard.press("Control+k");
    await expect(dialog).toBeVisible({ timeout: 800 });
  }).toPass({ timeout: 6000, intervals: [900] });

  const input = page.getByRole("combobox", {
    name: "저장본, 스킬, 메모리 검색 또는 이동",
  });
  await expect(input).toBeFocused();

  await input.fill("라이브러리");

  // Scope to the palette dialog: the mobile nav <select> also exposes an
  // option whose accessible name contains "라이브러리", and it can linger in
  // the accessibility tree during the dev-server CSS-injection window even at
  // desktop widths, tripping strict mode on an unscoped page-level locator.
  const libraryOption = dialog.getByRole("option", { name: "라이브러리" });
  await expect(libraryOption).toBeVisible();

  await input.press("Enter");

  await expect(page).toHaveURL(/\/library$/);
  await expect(dialog).toBeHidden();
});

test("closes with Escape and restores focus", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();

  const dialog = page.getByRole("dialog", { name: "워크스페이스 검색" });

  await expect(async () => {
    await page.keyboard.press("Control+k");
    await expect(dialog).toBeVisible({ timeout: 800 });
  }).toPass({ timeout: 6000, intervals: [900] });

  await page.keyboard.press("Escape");

  await expect(dialog).toBeHidden();
});

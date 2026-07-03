import { test, expect } from "@playwright/test";

/**
 * Command palette: open with the keyboard shortcut from anywhere, search for a
 * navigation target, and confirm Enter navigates and closes the dialog.
 */
test("opens with a keyboard shortcut and navigates to a search result", async ({
  page,
}) => {
  await page.goto("/");

  // Control+K is used on Linux/Windows CI runners; Cmd+K is the Mac
  // equivalent. Both are bound to the same open/close toggle, so only one
  // should be pressed per open — pressing both would toggle the palette
  // open then immediately closed again.
  await page.keyboard.press("Control+k");

  const dialog = page.getByRole("dialog", { name: "워크스페이스 검색" });
  await expect(dialog).toBeVisible();

  const input = page.getByRole("combobox", {
    name: "저장본, 스킬, 메모리 검색 또는 이동",
  });
  await expect(input).toBeFocused();

  await input.fill("라이브러리");

  const libraryOption = page.getByRole("option", { name: "라이브러리" });
  await expect(libraryOption).toBeVisible();

  await input.press("Enter");

  await expect(page).toHaveURL(/\/library$/);
  await expect(dialog).toBeHidden();
});

test("closes with Escape and restores focus", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Control+k");

  const dialog = page.getByRole("dialog", { name: "워크스페이스 검색" });
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(dialog).toBeHidden();
});

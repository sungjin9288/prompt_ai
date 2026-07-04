import { test, expect } from "@playwright/test";

/**
 * Context section switcher implements the WAI-ARIA APG Tabs pattern with
 * roving tabindex and automatic activation. ArrowRight/ArrowLeft move focus
 * and selection between the profile and company tabs with wrap-around, and
 * moving selection swaps the visible panel.
 */
test("moves and activates tabs with arrow keys", async ({ page }) => {
  await page.goto("/context");

  const profileTab = page.getByTestId("context-section-tab-profile");
  const companyTab = page.getByTestId("context-section-tab-company");

  await expect(profileTab).toHaveAttribute("aria-selected", "true");
  await expect(companyTab).toHaveAttribute("aria-selected", "false");
  await expect(profileTab).toHaveAttribute("tabindex", "0");
  await expect(companyTab).toHaveAttribute("tabindex", "-1");
  await expect(page.getByTestId("context-section-panel-profile")).toBeVisible();

  await profileTab.focus();
  await page.keyboard.press("ArrowRight");

  await expect(companyTab).toBeFocused();
  await expect(companyTab).toHaveAttribute("aria-selected", "true");
  await expect(profileTab).toHaveAttribute("aria-selected", "false");
  await expect(profileTab).toHaveAttribute("tabindex", "-1");
  await expect(companyTab).toHaveAttribute("tabindex", "0");
  await expect(page.getByTestId("context-section-panel-company")).toBeVisible();

  await page.keyboard.press("ArrowRight");

  await expect(profileTab).toBeFocused();
  await expect(profileTab).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("ArrowLeft");

  await expect(companyTab).toBeFocused();
  await expect(companyTab).toHaveAttribute("aria-selected", "true");
});

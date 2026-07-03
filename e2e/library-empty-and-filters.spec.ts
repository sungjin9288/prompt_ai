import { test, expect } from "@playwright/test";

/**
 * Library with an empty workspace shows empty-state guidance, and a model filter
 * passed via the URL is reflected in the filter UI without crashing.
 */
test("shows empty-state guidance for an empty workspace", async ({ page }) => {
  await page.goto("/library");

  await expect(
    page.getByRole("heading", { name: "프롬프트 라이브러리" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "목록" })).toBeVisible();

  // With no saved prompts and no filters, the results panel shows guidance.
  await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
});

test("reflects a model filter passed through the URL", async ({ page }) => {
  await page.goto("/library?model=gpt");

  // The page still renders (does not crash) with the URL filter applied.
  await expect(
    page.getByRole("heading", { name: "프롬프트 라이브러리" }),
  ).toBeVisible();

  // The "대상 AI 도구" (target model) select reflects the gpt filter from the URL.
  const targetModelSelect = page
    .locator("#library-filters")
    .locator("select")
    .filter({ hasText: "GPT" })
    .first();
  await expect(targetModelSelect).toHaveValue("gpt");

  // The active filter chip surfaces the applied model filter (rendered in more
  // than one place, so assert on the first occurrence).
  await expect(page.getByText("대상 GPT").first()).toBeVisible();
});

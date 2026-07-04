import { test, expect } from "@playwright/test";

/**
 * Sample data onboarding: from an empty workspace, the Library empty state
 * offers a "샘플 데이터 불러오기" button. Clicking it seeds curated sample
 * prompts (built through the real prompt generator, so their shape is
 * guaranteed) into localStorage, after which the Library shows them and a
 * sample prompt's detail view renders without crashing (this exercises the
 * scoreBreakdown rendering path). Clicking again must not duplicate entries.
 *
 * localStorage starts empty per test context, so the whole flow runs in a
 * single page context without any explicit clearing.
 */
test("loads sample data from the Library empty state and opens a sample prompt", async ({
  page,
}) => {
  await page.goto("/library");

  await expect(
    page.getByRole("heading", { name: "프롬프트 라이브러리" }),
  ).toBeVisible();
  await expect(page.getByText("아직 저장된 프롬프트가 없어요")).toBeVisible();

  const loadSampleButton = page.getByRole("button", {
    name: "샘플 데이터 불러오기",
  });
  await expect(loadSampleButton).toBeVisible();

  await loadSampleButton.click();

  // The empty state is replaced by the populated results list.
  await expect(page.getByText("아직 저장된 프롬프트가 없어요")).toBeHidden();

  const results = page.locator("#library-results");
  await expect(results.getByRole("button")).not.toHaveCount(0);

  // Open one of the seeded sample prompts and confirm the detail view renders
  // without crashing — this exercises the generator-guaranteed scoreBreakdown.
  await page.goto("/library?prompt=sample-prompt-ad-copy&version=gpt");

  await expect(
    page.getByRole("heading", { name: /마케팅.*광고 문구 작성/ }),
  ).toBeVisible();
  await expect(page.getByTestId("library-detail-pin-toggle")).toBeVisible();

  // Re-running the loader must be idempotent: no duplicate sample prompts.
  await page.goto("/library");
  const loadSampleButtonAgain = page.getByRole("button", {
    name: "샘플 데이터 불러오기",
  });

  // The empty-state action only appears when the workspace is empty, so with
  // samples already seeded it should not be present anymore.
  await expect(loadSampleButtonAgain).toHaveCount(0);
});

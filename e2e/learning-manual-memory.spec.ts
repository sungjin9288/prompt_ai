import { test, expect } from "@playwright/test";

const MEMORY_TITLE = "E2E 회사 톤 기준";
const MEMORY_CONTENT =
  "모든 답변은 존댓말과 간결한 3문단 구조를 사용합니다.";

/**
 * Learning: add a manual memory through the manual-memory form and confirm it
 * appears in the memory list and the summary counters update.
 */
test("adds a manual memory and updates the memory list and counters", async ({
  page,
}) => {
  await page.goto("/learning");

  await expect(
    page.getByRole("heading", { name: "학습 메모리", exact: true }),
  ).toBeVisible();

  const form = page.locator("#learning-manual-memory");
  await expect(form.getByRole("heading", { name: "수동 메모리 추가" })).toBeVisible();

  // The default scope is "회사" (company); fill title and content to enable save.
  await form.getByPlaceholder("예: 투자자 문서 회사 기준").fill(MEMORY_TITLE);
  await form
    .getByPlaceholder("다음 생성에 반영할 구체적인 기준을 적어주세요.")
    .fill(MEMORY_CONTENT);

  await form.getByRole("button", { name: "학습 메모리 저장" }).click();

  // Save confirms.
  await expect(form.getByRole("button", { name: "저장됨" })).toBeVisible();

  // The saved memory appears in the accumulated-memory list.
  const memoryList = page.getByRole("heading", { name: "축적된 메모리" });
  await expect(memoryList).toBeVisible();
  await expect(
    page.getByRole("heading", { name: MEMORY_TITLE }),
  ).toBeVisible();

  // The summary counters update: total memory count is now 1.
  const summary = page.getByTestId("learning-summary-metrics");
  await expect(summary).toContainText("전체 메모리");
  await expect(summary).toContainText("1");

  // Readiness scope coverage advances beyond an empty workspace.
  await expect(
    page.getByTestId("learning-readiness-metrics"),
  ).toContainText("1/4");
});

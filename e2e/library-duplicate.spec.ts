import { test, expect } from "@playwright/test";

/**
 * Library duplicate: clicking the detail panel's 복제 button creates a new
 * prompt titled "<original> (사본)", navigates to its detail, and the
 * results list count goes from 1 to 2.
 */
// addInitScript serializes this function by stringifying it and running it
// in the browser context, so it cannot close over outer module variables —
// everything it needs must be declared inside the function body.
function seedScript(promptId: string) {
  const scoreBreakdown = {
    clarity: 16,
    context: 16,
    outputFormat: 16,
    constraints: 16,
    expertise: 16,
    modelFit: 16,
    reusability: 16,
  };

  const prompt = {
    id: promptId,
    title: "복제 테스트 프롬프트",
    source: "local",
    rawInput: "복제 테스트 프롬프트",
    goal: "개발",
    domain: "개발",
    targetModels: ["codex"],
    versions: [
      {
        id: `${promptId}-v`,
        targetModel: "codex",
        modelLabel: "Codex",
        content: "Role: engineer\nTask: do something.",
        qualityScore: 80,
        scoreBreakdown,
        assumptions: [],
        missingContext: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    tags: [],
  };

  window.localStorage.setItem(
    "prompt-ai-studio:prompts",
    JSON.stringify([prompt]),
  );
}

test("duplicates the selected prompt and navigates to the copy", async ({
  page,
}) => {
  const promptId = "e2e-duplicate-prompt";

  await page.addInitScript(seedScript, promptId);
  await page.goto(`/library?prompt=${promptId}&version=codex`);

  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();
  await expect(
    page.getByRole("heading", { name: "복제 테스트 프롬프트", exact: true }),
  ).toBeVisible();

  // Each result row's title renders as a <p> inside its select button; count
  // rows via the title text rather than every <button> in the panel, since a
  // row can also render secondary "저장 링크" action buttons alongside it.
  const results = page.locator("#library-results");
  const rowTitles = results.locator("p.line-clamp-2");
  await expect(rowTitles).toHaveCount(1);

  await page.getByTestId("library-detail-duplicate").click();

  // Navigates to the new duplicate's detail (a new prompt id in the URL,
  // different from the original).
  await expect(page).toHaveURL(/[?&]prompt=(?!e2e-duplicate-prompt)[^&]+/);

  await expect(
    page.getByRole("heading", { name: "복제 테스트 프롬프트 (사본)" }),
  ).toBeVisible();

  // The results list now has both the original and the duplicate.
  await expect(rowTitles).toHaveCount(2);
  await expect(results.getByText("복제 테스트 프롬프트 (사본)")).toBeVisible();
});

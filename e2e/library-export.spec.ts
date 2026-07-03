import { test, expect } from "@playwright/test";

/**
 * Library export: the detail panel's Markdown/JSON export buttons trigger a
 * browser download with the expected file extension. Uses Playwright's
 * download API rather than reading file content, since these buttons build
 * the file client-side via a Blob URL.
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
    title: "내보내기 테스트 프롬프트",
    source: "local",
    rawInput: "내보내기 테스트 프롬프트",
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

test("exports the selected prompt as Markdown and as JSON", async ({
  page,
}) => {
  const promptId = "e2e-export-prompt";

  await page.addInitScript(seedScript, promptId);
  await page.goto(`/library?prompt=${promptId}&version=codex`);

  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();
  await expect(
    page.getByRole("heading", { name: "내보내기 테스트 프롬프트" }),
  ).toBeVisible();

  const markdownButton = page.getByTestId("library-detail-export-markdown");
  const jsonButton = page.getByTestId("library-detail-export-json");

  await expect(markdownButton).toBeVisible();
  await expect(jsonButton).toBeVisible();
  await expect(markdownButton).toBeEnabled();
  await expect(jsonButton).toBeEnabled();

  const [markdownDownload] = await Promise.all([
    page.waitForEvent("download"),
    markdownButton.click(),
  ]);
  expect(markdownDownload.suggestedFilename()).toMatch(/\.md$/);

  const [jsonDownload] = await Promise.all([
    page.waitForEvent("download"),
    jsonButton.click(),
  ]);
  expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/);

  // Clicking export does not navigate away from the Library detail view.
  await expect(page).toHaveURL(new RegExp(`prompt=${promptId}`));
});

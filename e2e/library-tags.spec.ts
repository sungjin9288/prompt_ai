import { test, expect } from "@playwright/test";

/**
 * Library tags: add a tag from the detail panel's "태그 추가" input, confirm it
 * renders as a chip, confirm the tag filter select picks it up and the filter
 * applies (?tag= in the URL), then remove the tag chip.
 *
 * Seeded via addInitScript before navigation so the prompt exists on first
 * render (evaluating localStorage after goto risks a reload race).
 */
// addInitScript serializes this function by stringifying it and running it
// in the browser context, so it cannot close over outer module variables
// (e.g. a shared scoreBreakdown const) — everything it needs must come
// through its single argument or be declared inside the function body.
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
    title: "태그 테스트 프롬프트",
    source: "local",
    rawInput: "태그 테스트 프롬프트",
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

test("adds a tag, filters by it via the URL, and removes it", async ({
  page,
}) => {
  const promptId = "e2e-tag-prompt";

  await page.addInitScript(seedScript, promptId);
  await page.goto(`/library?prompt=${promptId}&version=codex`);

  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();
  await expect(
    page.getByRole("heading", { name: "태그 테스트 프롬프트" }),
  ).toBeVisible();

  const tagsRegion = page.getByTestId("library-detail-tags");
  const tagInput = tagsRegion.getByPlaceholder("태그 추가");

  await tagInput.fill("긴급");
  await tagInput.press("Enter");

  const tagChip = tagsRegion.locator("span", { hasText: "긴급" }).first();
  await expect(tagChip).toBeVisible();
  await expect(tagInput).toHaveValue("");

  // The tag filter select (in the filters panel) now lists the new tag.
  const tagFilterSelect = page
    .locator("#library-filters")
    .locator("select")
    .filter({ has: page.locator("option", { hasText: "긴급" }) })
    .first();
  await expect(tagFilterSelect).toBeVisible();

  await tagFilterSelect.selectOption("긴급");

  await expect(page).toHaveURL(/[?&]tag=%EA%B8%B4%EA%B8%89/);
  // The prompt still shows up in the filtered results.
  await expect(
    page.getByRole("heading", { name: "태그 테스트 프롬프트" }),
  ).toBeVisible();
  await expect(page.getByText("태그 긴급").first()).toBeVisible();

  // Remove the tag chip.
  await tagsRegion.getByRole("button", { name: "긴급 태그 삭제" }).click();
  await expect(tagChip).toBeHidden();
});

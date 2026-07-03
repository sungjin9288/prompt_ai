import { test, expect } from "@playwright/test";

/**
 * Library pin: pinning an older prompt from its detail panel flips
 * aria-pressed, moves it ahead of a newer unpinned prompt in the results
 * list, and shows a "고정됨" badge in the list.
 *
 * Seeded via addInitScript before navigation. Prompt A is newer (createdAt
 * later) and unpinned; prompt B is older and gets pinned during the test.
 */
// addInitScript serializes this function by stringifying it and running it
// in the browser context, so it cannot close over outer module variables —
// everything it needs must be declared inside the function body.
function seedScript() {
  const scoreBreakdown = {
    clarity: 16,
    context: 16,
    outputFormat: 16,
    constraints: 16,
    expertise: 16,
    modelFit: 16,
    reusability: 16,
  };

  function makePrompt(id: string, title: string, createdAt: string) {
    return {
      id,
      title,
      source: "local",
      rawInput: title,
      goal: "개발",
      domain: "개발",
      targetModels: ["codex"],
      versions: [
        {
          id: `${id}-v`,
          targetModel: "codex",
          modelLabel: "Codex",
          content: "Role: engineer\nTask: do something.",
          qualityScore: 80,
          scoreBreakdown,
          assumptions: [],
          missingContext: [],
          createdAt,
        },
      ],
      feedback: [],
      createdAt,
      updatedAt: createdAt,
      tags: [],
    };
  }

  const promptA = makePrompt(
    "e2e-pin-a-newest",
    "핀 테스트 A (최신)",
    "2026-02-01T00:00:00.000Z",
  );
  const promptB = makePrompt(
    "e2e-pin-b-older",
    "핀 테스트 B (이전)",
    "2026-01-01T00:00:00.000Z",
  );

  window.localStorage.setItem(
    "prompt-ai-studio:prompts",
    JSON.stringify([promptA, promptB]),
  );
}

test("pinning an older prompt moves it ahead of a newer one", async ({
  page,
}) => {
  await page.addInitScript(seedScript);
  await page.goto(
    "/library?prompt=e2e-pin-b-older&version=codex",
  );

  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();
  await expect(
    page.getByRole("heading", { name: "핀 테스트 B (이전)" }),
  ).toBeVisible();

  const results = page.locator("#library-results");
  const pinToggle = page.getByTestId("library-detail-pin-toggle");

  await expect(pinToggle).toHaveAttribute("aria-pressed", "false");
  await expect(pinToggle).toContainText("고정", { useInnerText: true });
  await expect(pinToggle).not.toContainText("고정 해제");

  await pinToggle.click();

  await expect(pinToggle).toHaveAttribute("aria-pressed", "true");
  await expect(pinToggle).toContainText("고정 해제");

  // B now appears before A in the results list (pinned-first ordering) and
  // carries the pin indicator badge.
  const resultEntries = results.getByRole("button");
  await expect(resultEntries.first()).toContainText("핀 테스트 B (이전)");
  await expect(resultEntries.first()).toContainText("고정됨");

  await expect(results.getByTestId("library-pin-indicator")).toHaveCount(1);
  await expect(
    results.getByTestId("library-pin-indicator").first(),
  ).toHaveText("고정됨");
});

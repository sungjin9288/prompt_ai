import { test, expect } from "@playwright/test";

/**
 * Library import: the "가져오기" dialog accepts pasted exported-prompt JSON,
 * creates a new prompt, and navigates to its detail. Malformed JSON shows a
 * Korean error (role="alert") without crashing or navigating.
 */
const scoreBreakdown = {
  clarity: 16,
  context: 16,
  outputFormat: 16,
  constraints: 16,
  expertise: 16,
  modelFit: 16,
  reusability: 16,
};

function buildValidImportJson(title: string): string {
  return JSON.stringify({
    title,
    source: "local",
    rawInput: title,
    goal: "개발",
    domain: "개발",
    targetModels: ["codex"],
    tags: ["가져옴"],
    versions: [
      {
        id: "imported-version-0",
        targetModel: "codex",
        modelLabel: "Codex",
        content: "Role: engineer\nTask: imported prompt.",
        qualityScore: 77,
        scoreBreakdown,
        assumptions: [],
        missingContext: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
}

test("imports a valid prompt JSON and navigates to its detail", async ({
  page,
}) => {
  await page.goto("/library");
  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();

  await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();

  await page.getByRole("button", { name: "가져오기" }).click();

  const dialog = page.getByRole("dialog", { name: "프롬프트 가져오기" });
  await expect(dialog).toBeVisible();

  const textarea = dialog.locator("textarea");
  await textarea.fill(buildValidImportJson("가져오기 테스트 프롬프트"));

  const submit = dialog.getByRole("button", { name: "가져오기", exact: true });
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/[?&]prompt=/);
  await expect(
    page.getByRole("heading", { name: "가져오기 테스트 프롬프트" }),
  ).toBeVisible();
});

test("shows a Korean error for malformed JSON without crashing", async ({
  page,
}) => {
  await page.goto("/library");
  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();

  await page.getByRole("button", { name: "가져오기" }).click();

  const dialog = page.getByRole("dialog", { name: "프롬프트 가져오기" });
  await expect(dialog).toBeVisible();

  const textarea = dialog.locator("textarea");
  await textarea.fill("{ this is not valid json");

  const submit = dialog.getByRole("button", { name: "가져오기", exact: true });
  await submit.click();

  const alert = dialog.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(alert).toHaveText("JSON 형식이 올바르지 않습니다.");

  // No navigation happened and the dialog is still open (no crash).
  await expect(page).toHaveURL(/\/library$/);
  await expect(dialog).toBeVisible();
});

import { test, expect } from "@playwright/test";

/**
 * Data: trigger backup creation and confirm the backup summary (counts and
 * fingerprint UI) appears.
 */
test("creates a backup and shows the backup summary with a fingerprint", async ({
  page,
}) => {
  await page.goto("/data");

  await expect(
    page.getByRole("heading", { name: "데이터 관리" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "내보내기" })).toBeVisible();

  await page.getByRole("button", { name: "백업 JSON 생성" }).click();

  // The export summary card renders after backup creation.
  await expect(page.getByText("백업 파일 확보")).toBeVisible();

  // The summary exposes the backup fingerprint and prompt/skill counts.
  await expect(page.getByText("백업 지문")).toBeVisible();
  await expect(page.getByText("프롬프트", { exact: true }).first()).toBeVisible();

  // The backup JSON textarea is populated (non-empty).
  const exportJson = page.locator("textarea[readonly]").first();
  await expect(exportJson).not.toHaveValue("");
});

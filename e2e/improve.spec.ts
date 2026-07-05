import { test, expect } from "@playwright/test";

/**
 * /improve is a focused single-purpose page: a prefilled or blank draft
 * textarea, an 개선하기 button that runs the local engine synchronously, a
 * result section with a quality score, and a 라이브러리에 저장 action that
 * lands the prompt in the library.
 */
test("prefills the draft from the query string, shows provenance, and improves it", async ({
  page,
}) => {
  const draft = "이 프로젝트의 온보딩 문서를 정리해줘";

  await page.goto(
    `/improve?draft=${encodeURIComponent(draft)}&source=extension&origin=chatgpt`,
  );

  const textarea = page.getByLabel("프롬프트 초안");
  await expect(textarea).toHaveValue(draft);

  await expect(
    page.getByText("확장 프로그램에서 전달된 초안입니다. 출처: ChatGPT"),
  ).toBeVisible();

  await page.getByTestId("improve-run").click();

  const result = page.getByTestId("improve-result");
  await expect(result).toBeVisible();
  await expect(result).not.toHaveValue("");
  await expect(page.getByText("품질 점수")).toBeVisible();
});

test("saves the improved prompt to the library", async ({ page }) => {
  const draft = "신규 기능 발표 이메일 초안을 작성해줘";

  await page.goto(`/improve?draft=${encodeURIComponent(draft)}`);

  await page.getByTestId("improve-run").click();
  await expect(page.getByTestId("improve-result")).toBeVisible();

  await page.getByTestId("improve-save-to-library").click();

  const libraryLink = page.getByTestId("improve-library-link");
  await expect(libraryLink).toBeVisible();

  await libraryLink.click();

  await page.getByRole("navigation", { name: "주요 메뉴" }).waitFor();
  await expect(
    page.getByRole("heading", { name: "프롬프트 라이브러리" }),
  ).toBeVisible();
  await expect(page.getByText(draft).first()).toBeVisible();
});

test("renders an empty editor with no query params", async ({ page }) => {
  await page.goto("/improve");

  const textarea = page.getByLabel("프롬프트 초안");
  await expect(textarea).toHaveValue("");
  await expect(page.getByTestId("improve-run")).toBeDisabled();
  await expect(page.getByTestId("improve-result")).toHaveCount(0);
});

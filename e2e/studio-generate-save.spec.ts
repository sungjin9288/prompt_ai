import { test, expect } from "@playwright/test";

const RAW_INPUT =
  "투자자에게 보낼 제품 소개 프롬프트를 만들어줘. 대상은 B2B SaaS 구매 담당자.";

/**
 * Critical path: open Studio, type a Korean raw input, generate a prompt with the
 * local fallback (no API key), save it to the Library, then follow the saved
 * prompt into the Library detail and confirm it renders.
 *
 * localStorage starts empty per test context, so the whole chain runs in a single
 * page context.
 */
test("generates a prompt locally, saves it, and opens it in the Library", async ({
  page,
}) => {
  // Stub window.open so the "copy and open external AI" action never truly
  // navigates away from the test page; we only assert it was called.
  await page.addInitScript(() => {
    (window as unknown as { __openedUrls: string[] }).__openedUrls = [];
    window.open = (url?: string | URL) => {
      (window as unknown as { __openedUrls: string[] }).__openedUrls.push(
        String(url ?? ""),
      );
      return null;
    };
  });

  await page.goto("/studio");

  await expect(
    page.getByRole("heading", { name: "프롬프트 스튜디오" }),
  ).toBeVisible();

  await page.locator("#studio-raw-input").fill(RAW_INPUT);

  await page
    .getByRole("button", { name: "전문 프롬프트 생성" })
    .click();

  // The generated result section renders (local fallback, no key required).
  await expect(
    page.getByRole("heading", { name: "생성 결과" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("studio-result-handoff-summary"),
  ).toBeVisible();

  // The generated prompt body from the local builder is present.
  await expect(page.getByText("Role:", { exact: false }).first()).toBeVisible();

  // The "copy and open external AI" action appears with the mapped target label
  // and copies the prompt while opening the mapped AI in a new tab on click.
  const copyAndOpenButton = page.getByTestId(
    "studio-result-copy-and-open-external-ai",
  );
  await expect(copyAndOpenButton).toBeVisible();
  await expect(copyAndOpenButton).toBeEnabled();
  await expect(copyAndOpenButton).toHaveText(/복사 후 .+에서 열기/);

  await copyAndOpenButton.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __openedUrls: string[] }).__openedUrls
            .length,
      ),
    )
    .toBeGreaterThan(0);

  // Save to the Library.
  await page
    .getByRole("button", { name: "라이브러리에 저장", exact: true })
    .first()
    .click();

  // The save button confirms persistence and the "open in Library" affordance shows.
  await expect(
    page.getByRole("button", { name: "라이브러리에 저장됨" }).first(),
  ).toBeVisible();

  const openInLibrary = page
    .getByRole("button", { name: "Library에서 보기" })
    .first();
  await expect(openInLibrary).toBeVisible();

  // Follow the saved prompt into the Library detail.
  await openInLibrary.click();
  await page.waitForURL(/\/library\?.*prompt=/);

  // The saved prompt title (derived from goal + raw input) appears in the Library.
  await expect(page.getByText("B2B SaaS", { exact: false }).first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "프롬프트 라이브러리" }),
  ).toBeVisible();
});

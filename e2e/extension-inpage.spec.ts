import { readFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

/**
 * In-page improve content-script coverage.
 *
 * We cannot drive the real chatgpt.com / claude.ai / gemini.google.com, and
 * loading an unpacked extension via launchPersistentContext is flaky headless.
 * Instead we inject the shipped content scripts (adapters.js + inpage.js) onto a
 * static fixture with the three composer shapes, stub the background messaging
 * seam (window.__pasTestSendMessage) with a canned refine success, and assert
 * the real adapter + UI logic: the 개선 button mounts, clicking replaces the
 * composer text, and 되돌리기 restores it — for ALL THREE composer shapes.
 *
 * This covers everything except Chrome's runtime.sendMessage plumbing, which the
 * static chrome-extension smoke verify already pins.
 */

const repoRoot = process.cwd();
const fixtureHtml = readFileSync(
  join(repoRoot, "e2e", "fixtures", "inpage-composer.html"),
  "utf8",
);
const adaptersJs = readFileSync(
  join(repoRoot, "extensions", "chrome", "content", "adapters.js"),
  "utf8",
);
const inpageJs = readFileSync(
  join(repoRoot, "extensions", "chrome", "content", "inpage.js"),
  "utf8",
);

const IMPROVED_PROMPT = "IMPROVED: 전문 프롬프트 본문";

interface ComposerCase {
  adapterId: string;
  fixture: string;
  original: string;
  selector: string;
}

const cases: ComposerCase[] = [
  {
    adapterId: "chatgpt",
    fixture: "chatgpt",
    original: "chatgpt draft",
    selector: "#prompt-textarea",
  },
  {
    adapterId: "claude",
    fixture: "claude",
    original: "claude draft",
    selector: '[data-fixture="claude"] .ProseMirror',
  },
  {
    adapterId: "gemini",
    fixture: "gemini",
    original: "gemini draft",
    selector: '[data-fixture="gemini"] .ql-editor',
  },
];

for (const composer of cases) {
  test(`in-page improve mounts, replaces, and undoes for ${composer.adapterId}`, async ({
    page,
  }) => {
    // Serve the fixture directly so no dev server / hostname is required.
    await page.setContent(fixtureHtml);

    // Prune the DOM to only this site's composer so the adapter's
    // document.querySelector resolves to the right shape.
    await page.evaluate((keep) => {
      document.querySelectorAll("[data-fixture]").forEach((node) => {
        if (node.getAttribute("data-fixture") !== keep) {
          node.remove();
        }
      });
    }, composer.fixture);

    // Install the messaging seam BEFORE inpage.js runs so its click handler
    // resolves through the canned success.
    await page.evaluate((improved) => {
      (window as unknown as Record<string, unknown>).__pasTestSendMessage = (
        message: { type: string },
      ) => {
        if (message.type === "pas-refine") {
          return { ok: true, improvedPrompt: improved };
        }

        if (message.type === "pas-studio-url") {
          return { studioUrl: "http://localhost:3000" };
        }

        return undefined;
      };
    }, IMPROVED_PROMPT);

    await page.addScriptTag({ content: adaptersJs });

    // Force the adapter selection to this site regardless of the test hostname.
    await page.evaluate((adapterId) => {
      const registry = (window as unknown as Record<string, unknown>)
        .pasInpageAdapters as {
        adapters: Array<{ id: string }>;
        selectAdapter: (hostname: string) => unknown;
      };
      const target = registry.adapters.find((item) => item.id === adapterId);
      registry.selectAdapter = () => target ?? null;
    }, composer.adapterId);

    await page.addScriptTag({ content: inpageJs });

    // inpage.js auto-starts on a ready document; re-run to be deterministic.
    await page.evaluate(() => {
      const start = (window as unknown as Record<string, unknown>)
        .pasInpageStart as () => void;
      start();
    });

    const button = page.getByTestId("pas-inpage-improve");
    await expect(button).toBeVisible();
    await expect(button).toHaveText(/개선/);

    // The composer starts with the original draft.
    const target = page.locator(composer.selector);
    await expect(target).toHaveText(composer.original);

    await button.click();

    // Clicking replaces the composer text with the improved prompt.
    await expect(target).toHaveText(IMPROVED_PROMPT);

    // Result bar with 되돌리기 / 복사 / Studio에서 열기 appears.
    const undo = page.getByRole("button", { name: "되돌리기" });
    await expect(undo).toBeVisible();
    await expect(page.getByRole("button", { name: "복사" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Studio에서 열기" }),
    ).toBeVisible();

    // 되돌리기 restores the original draft.
    await undo.click();
    await expect(target).toHaveText(composer.original);
  });
}

test("in-page improve shows an empty-draft hint when the composer is blank", async ({
  page,
}) => {
  await page.setContent(fixtureHtml);

  await page.evaluate(() => {
    document.querySelectorAll("[data-fixture]").forEach((node) => {
      if (node.getAttribute("data-fixture") !== "chatgpt") {
        node.remove();
      }
    });
    const composer = document.querySelector("#prompt-textarea");
    if (composer) {
      composer.textContent = "";
    }
  });

  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).__pasTestSendMessage = () => ({
      ok: true,
      improvedPrompt: "should not be used",
    });
  });

  await page.addScriptTag({ content: adaptersJs });
  await page.evaluate(() => {
    const registry = (window as unknown as Record<string, unknown>)
      .pasInpageAdapters as {
      adapters: Array<{ id: string }>;
      selectAdapter: (hostname: string) => unknown;
    };
    const target = registry.adapters.find((item) => item.id === "chatgpt");
    registry.selectAdapter = () => target ?? null;
  });
  await page.addScriptTag({ content: inpageJs });
  await page.evaluate(() => {
    const start = (window as unknown as Record<string, unknown>)
      .pasInpageStart as () => void;
    start();
  });

  await page.getByTestId("pas-inpage-improve").click();

  await expect(page.getByText("입력한 초안이 없습니다")).toBeVisible();
});

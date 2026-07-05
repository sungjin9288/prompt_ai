import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Generates the 4 Chrome Web Store listing screenshots at exactly
 * 1280x800 PNG. Requires the Next.js dev server already running at
 * http://localhost:3000 (see README "Chrome Web Store 스크린샷" section):
 *
 *   npm run dev &
 *   node scripts/generate-store-screenshots.mjs
 *
 * Screenshot 1 (in-page improve) does not hit the dev server at all — it
 * injects the shipped extension content scripts onto the static composer
 * fixture, exactly like e2e/extension-inpage.spec.ts, so the shot reflects
 * the real adapter + UI logic without needing a loaded Chrome extension.
 *
 * Screenshots 2-4 load real app routes and drive the same sample-data /
 * improve flows the e2e suite exercises, so what ships in the listing is
 * never a mockup.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(repoRoot, "store", "chrome", "screenshots");
const baseURL = process.env.STORE_SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const viewport = { width: 1280, height: 800 };

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

const IMPROVED_PROMPT =
  "당신은 시니어 프로덕트 마케터입니다. 20-30대 직장인을 대상으로 한 생산성 앱의" +
  " 신규 기능 출시를 알리는 이메일을 작성하세요. 목표: 기능 사용 전환율 상승." +
  " 톤: 친근하지만 전문적. 분량: 200단어 내외. 출력 형식: 제목 + 본문 + CTA 버튼 문구.";
const KOREAN_DRAFT = "신규 기능 발표 이메일 초안을 작성해줘";

async function screenshotInpageImprove(browser, outputPath) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });

  try {
    await page.setContent(fixtureHtml);

    // Keep only the ChatGPT-shaped composer so the shot matches the store
    // copy's "ChatGPT composer" caption.
    await page.evaluate(() => {
      document.querySelectorAll("[data-fixture]").forEach((node) => {
        if (node.getAttribute("data-fixture") !== "chatgpt") {
          node.remove();
        }
      });
    });

    // Cosmetic-only presentation styling for the store screenshot (does not
    // touch the pinned e2e fixture file itself, and does not affect the
    // adapter/selector logic under test since it targets unrelated
    // properties on the composer chrome, not the ProseMirror text node).
    await page.addStyleTag({
      content: `
        html, body {
          margin: 0;
          padding: 48px;
          background: #f7f7f8;
          font-family: -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
        }
        #prompt-textarea {
          max-width: 900px;
          padding: 16px;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06);
          font-size: 16px;
          line-height: 1.5;
        }
      `,
    });

    // Give the composer a realistic Korean draft before the content script
    // mounts so the "before" state looks like a real user's half-formed
    // prompt, not a placeholder.
    await page.evaluate((draft) => {
      const composer = document.querySelector("#prompt-textarea");
      if (composer) {
        composer.textContent = draft;
      }
    }, KOREAN_DRAFT);

    await page.evaluate((improved) => {
      window.__pasTestSendMessage = (message) => {
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
    await page.evaluate(() => {
      const registry = window.pasInpageAdapters;
      const target = registry.adapters.find((item) => item.id === "chatgpt");
      registry.selectAdapter = () => target ?? null;
    });
    await page.addScriptTag({ content: inpageJs });
    await page.evaluate(() => {
      window.pasInpageStart();
    });

    const button = page.getByTestId("pas-inpage-improve");
    await button.waitFor({ state: "visible" });
    await button.click();

    // Wait for the improved text and result bar so the shot captures the
    // 되돌리기/복사/Studio에서 열기 result state, not the pre-click state.
    await page.getByRole("button", { name: "되돌리기" }).waitFor({ state: "visible" });

    await page.screenshot({ path: outputPath });
  } finally {
    await page.close();
  }
}

async function screenshotImprovePage(browser, outputPath) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });

  try {
    await page.goto(
      `${baseURL}/improve?${new URLSearchParams({
        draft: KOREAN_DRAFT,
        source: "extension",
        origin: "chatgpt",
      }).toString()}`,
      { waitUntil: "networkidle" },
    );

    await page.getByTestId("improve-run").click();
    await page.getByTestId("improve-result").waitFor({ state: "visible" });
    await page.getByText("품질 점수").waitFor({ state: "visible" });

    // Scroll the quality score + result into view so the shot captures the
    // actual improvement output, not just the draft textarea above the fold.
    await page.getByText("품질 점수").scrollIntoViewIfNeeded();

    await page.screenshot({ path: outputPath });
  } finally {
    await page.close();
  }
}

async function seedSampleWorkspace(page) {
  const sampleButton = page.getByRole("button", { name: "샘플 데이터 불러오기" });

  if (await sampleButton.count()) {
    await sampleButton.click();
  }
}

async function screenshotLibraryPage(browser, outputPath) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });

  try {
    await page.goto(`${baseURL}/library`, { waitUntil: "networkidle" });
    await seedSampleWorkspace(page);
    await page
      .getByText("아직 저장된 프롬프트가 없어요")
      .waitFor({ state: "hidden" })
      .catch(() => undefined);

    await page.screenshot({ path: outputPath });
  } finally {
    await page.close();
  }
}

async function screenshotDashboardPage(browser, outputPath) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });

  try {
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await seedSampleWorkspace(page);
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 0));

    await page.screenshot({ path: outputPath });
  } finally {
    await page.close();
  }
}

function assertDimensions(buffer, expectedWidth, expectedHeight, label) {
  // PNG: width/height are big-endian uint32 at byte offsets 16 and 20 of the
  // IHDR chunk, which always starts right after the 8-byte signature.
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(
      `${label} is ${width}x${height}, expected ${expectedWidth}x${expectedHeight}.`,
    );
  }
}

async function generateStoreScreenshots() {
  mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const targets = [
    {
      name: "screenshot-1.png",
      run: screenshotInpageImprove,
      caption: "ChatGPT composer의 개선 버튼과 결과 바",
    },
    {
      name: "screenshot-2.png",
      run: screenshotImprovePage,
      caption: "/improve 품질 점수가 표시된 개선 결과",
    },
    {
      name: "screenshot-3.png",
      run: screenshotLibraryPage,
      caption: "/library 샘플 데이터가 채워진 라이브러리",
    },
    {
      name: "screenshot-4.png",
      run: screenshotDashboardPage,
      caption: "/ 대시보드 샘플 데이터 요약",
    },
  ];

  try {
    for (const target of targets) {
      const outputPath = join(outputDir, target.name);

      await target.run(browser, outputPath);

      const buffer = readFileSync(outputPath);

      assertDimensions(buffer, viewport.width, viewport.height, target.name);

      console.log(`Generated ${outputPath} (${target.caption})`);
    }
  } finally {
    await browser.close();
  }

  console.log("Chrome Web Store screenshots generated (4/4, 1280x800).");
}

await generateStoreScreenshots();

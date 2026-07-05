import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  brandAccentColor,
  brandBackgroundColor,
  buildBrandMarkSvg,
} from "./lib/brand-mark.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteName = "Prompt AI Studio";
const siteTagline = "프롬프트를 전문가 수준으로 다듬는 로컬 우선 워크스페이스";

const iconTargets = [
  { size: 512, outputPath: join(repoRoot, "src", "app", "icon.png") },
  { size: 180, outputPath: join(repoRoot, "src", "app", "apple-icon.png") },
];
const ogImageTarget = {
  width: 1200,
  height: 630,
  outputPath: join(repoRoot, "public", "og.png"),
};
const faviconTarget = {
  sizes: [16, 32, 48],
  outputPath: join(repoRoot, "src", "app", "favicon.ico"),
};

/**
 * Build a minimal ICO container embedding PNG frames directly (the
 * "PNG-in-ICO" format supported by every modern browser and OS). Avoids an
 * image-processing dependency for a one-off multi-size favicon build.
 */
function buildIcoFromPngBuffers(pngBuffersBySize) {
  const headerSize = 6;
  const entrySize = 16;
  const entries = pngBuffersBySize.length;
  const header = Buffer.alloc(headerSize);

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries, 4);

  const directory = [];
  const imageData = [];
  let offset = headerSize + entrySize * entries;

  for (const { size, buffer } of pngBuffersBySize) {
    const entry = Buffer.alloc(entrySize);
    const dimension = size >= 256 ? 0 : size;

    entry.writeUInt8(dimension, 0);
    entry.writeUInt8(dimension, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);

    directory.push(entry);
    imageData.push(buffer);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...directory, ...imageData]);
}

function buildIconHtml(size) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: ${size}px;
        height: ${size}px;
        background: transparent;
      }
    </style>
  </head>
  <body>
    ${buildBrandMarkSvg(size)}
  </body>
</html>`;
}

function buildOgHtml(width, height) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: ${width}px;
        height: ${height}px;
        background: ${brandBackgroundColor};
      }
      .og-canvas {
        width: ${width}px;
        height: ${height}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 32px;
        font-family: -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
      }
      .og-mark {
        width: 160px;
        height: 160px;
      }
      .og-title {
        font-size: 64px;
        font-weight: 700;
        color: #f5f7fa;
        letter-spacing: -0.02em;
      }
      .og-tagline {
        font-size: 28px;
        font-weight: 400;
        color: ${brandAccentColor};
      }
    </style>
  </head>
  <body>
    <div class="og-canvas">
      <div class="og-mark">${buildBrandMarkSvg(160)}</div>
      <div class="og-title">${siteName}</div>
      <div class="og-tagline">${siteTagline}</div>
    </div>
  </body>
</html>`;
}

async function renderPngBuffer(browser, html, width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });

  try {
    await page.setContent(html, { waitUntil: "load" });
    return await page.screenshot({ omitBackground: true });
  } finally {
    await page.close();
  }
}

async function generateAppIcons() {
  const browser = await chromium.launch();

  try {
    for (const { size, outputPath } of iconTargets) {
      const buffer = await renderPngBuffer(browser, buildIconHtml(size), size, size);

      writeFileSync(outputPath, buffer);
      console.log(`Generated ${outputPath}`);
    }

    const ogBuffer = await renderPngBuffer(
      browser,
      buildOgHtml(ogImageTarget.width, ogImageTarget.height),
      ogImageTarget.width,
      ogImageTarget.height,
    );

    writeFileSync(ogImageTarget.outputPath, ogBuffer);
    console.log(`Generated ${ogImageTarget.outputPath}`);

    const faviconFrames = [];

    for (const size of faviconTarget.sizes) {
      const buffer = await renderPngBuffer(browser, buildIconHtml(size), size, size);

      faviconFrames.push({ size, buffer });
    }

    writeFileSync(faviconTarget.outputPath, buildIcoFromPngBuffers(faviconFrames));
    console.log(`Generated ${faviconTarget.outputPath}`);
  } finally {
    await browser.close();
  }

  console.log("App icons, favicon, and OG image generated.");
}

await generateAppIcons();

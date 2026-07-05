import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = join(repoRoot, "extensions", "chrome", "icons");
const iconSizes = [16, 32, 48, 128];

const backgroundColor = "#13171d";
const accentColor = "#67d4c3";

/**
 * Build a self-contained HTML page that renders the brand mark at an exact
 * pixel size. A bold geometric "P" glyph on a dark rounded square stays
 * legible down to 16px, matching the popup's dark/accent theme.
 */
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
    <svg
      width="${size}"
      height="${size}"
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="128" height="128" rx="24" fill="${backgroundColor}" />
      <path
        d="M40 30 H70 C86 30 98 42 98 58 C98 74 86 86 70 86 H56 V98 H40 Z
           M56 46 V70 H70 C77 70 82 65 82 58 C82 51 77 46 70 46 Z"
        fill="${accentColor}"
      />
    </svg>
  </body>
</html>`;
}

async function renderIcon(browser, size, outputPath) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });

  try {
    await page.setContent(buildIconHtml(size), { waitUntil: "load" });
    await page.screenshot({ path: outputPath, omitBackground: true });
  } finally {
    await page.close();
  }
}

async function generateExtensionIcons() {
  mkdirSync(iconsDir, { recursive: true });

  const browser = await chromium.launch();

  try {
    for (const size of iconSizes) {
      const outputPath = join(iconsDir, `icon-${size}.png`);

      await renderIcon(browser, size, outputPath);
      console.log(`Generated ${outputPath}`);
    }
  } finally {
    await browser.close();
  }

  console.log("Chrome extension icons generated.");
}

await generateExtensionIcons();

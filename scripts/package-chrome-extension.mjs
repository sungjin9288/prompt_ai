import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = join(repoRoot, "extensions", "chrome");
const outputDir = join(repoRoot, "output", "extension");

const packagedEntries = [
  "manifest.json",
  "popup.html",
  "popup.js",
  "popup.css",
  "background.js",
  "content",
  "icons",
];

function readManifestVersion() {
  const manifestPath = join(extensionDir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  if (!manifest.version) {
    throw new Error(`manifest.json is missing a version field: ${manifestPath}`);
  }

  return manifest.version;
}

function assertZipCliAvailable() {
  const result = spawnSync("zip", ["-v"], { encoding: "utf8" });

  if (result.error || result.status !== 0) {
    throw new Error(
      "The macOS `zip` CLI is required to package the extension but was not found. " +
        "Install it (it ships with macOS by default) and try again.",
    );
  }
}

function assertPackagedEntriesExist() {
  const missing = packagedEntries.filter(
    (entry) => !existsSync(join(extensionDir, entry)),
  );

  if (missing.length > 0) {
    throw new Error(
      `Cannot package the Chrome extension; missing entries: ${missing.join(", ")}. ` +
        "Run `npm run icons:extension` if icons/ is missing.",
    );
  }
}

function packageChromeExtension() {
  assertZipCliAvailable();
  assertPackagedEntriesExist();

  const version = readManifestVersion();
  const zipName = `prompt-ai-studio-refine-v${version}.zip`;
  const zipPath = join(outputDir, zipName);

  mkdirSync(outputDir, { recursive: true });
  rmSync(zipPath, { force: true });

  execFileSync("zip", ["-r", zipPath, ...packagedEntries], {
    cwd: extensionDir,
    stdio: "inherit",
  });

  console.log(`Chrome extension artifact written to ${zipPath}`);

  return zipPath;
}

packageChromeExtension();

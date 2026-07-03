import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Read a UTF-8 text file relative to the current working directory.
 * Thin wrapper around readFileSync(path, "utf8") shared across verify scripts.
 */
export function readSource(path) {
  return readFileSync(path, "utf8");
}

/**
 * Read a list of UTF-8 text files and join their contents with newlines.
 * Mirrors the paths.map((path) => readFileSync(path, "utf8")).join("\n")
 * pattern repeated across the operational-summary verify scripts.
 */
export function readConcatenatedSources(paths) {
  return paths.map((path) => readSource(path)).join("\n");
}

function getExtension(filePath) {
  const lastDot = filePath.lastIndexOf(".");

  return lastDot === -1 ? "" : filePath.slice(lastDot);
}

/**
 * Recursively walk rootDir (or each root in an array) and collect file paths
 * matching the given options. Mirrors the collectFiles() implementations
 * duplicated across verify-build-stability.mjs, verify-secret-safety.mjs,
 * and verify-terminology-consistency.mjs.
 *
 * options:
 *   - extensions: Set|Array of allowed file extensions (e.g. [".ts", ".tsx"]).
 *       When omitted, all files are included.
 *   - skipDirectories: Set|Array of directory names to skip entirely.
 *   - skipHidden: when true, skip any entry whose name starts with "."
 *       (used by verify-secret-safety.mjs instead of an explicit skip set).
 */
export function collectFiles(rootDir, options = {}) {
  const extensions = options.extensions ? new Set(options.extensions) : null;
  const skipDirectories = options.skipDirectories
    ? new Set(options.skipDirectories)
    : null;
  const skipHidden = options.skipHidden ?? false;

  function walk(entryPath) {
    const stats = statSync(entryPath);

    if (stats.isFile()) {
      return !extensions || extensions.has(getExtension(entryPath))
        ? [entryPath]
        : [];
    }

    if (!stats.isDirectory()) {
      return [];
    }

    return readdirSync(entryPath)
      .filter((name) => {
        if (skipHidden && name.startsWith(".")) {
          return false;
        }

        return !skipDirectories || !skipDirectories.has(name);
      })
      .flatMap((name) => walk(join(entryPath, name)));
  }

  const roots = Array.isArray(rootDir) ? rootDir : [rootDir];

  return roots.flatMap(walk);
}

/**
 * Escape a literal string for safe interpolation into a RegExp source.
 */
export function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

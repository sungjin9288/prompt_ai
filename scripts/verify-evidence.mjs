import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { loadTypescriptModule } from "./lib/load-typescript-module.mjs";
import {
  formatVerificationCommand,
  verificationChecks,
} from "./lib/verification-checks.mjs";

function formatEvidenceTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function formatBoolean(value) {
  return value ? "yes" : "no";
}

function sanitizeEvidenceText(value) {
  return value
    .replace(/([A-Za-z0-9_]*KEY=)[^\s]+/g, "$1[redacted]")
    .replace(/([A-Za-z0-9_]*TOKEN=)[^\s]+/g, "$1[redacted]")
    .replace(/(service_role)[^\s]*/gi, "$1[redacted]");
}

function formatOutputExcerpt(value) {
  if (!value) {
    return "";
  }

  const normalized = sanitizeEvidenceText(String(value).trim());

  if (!normalized) {
    return "";
  }

  return normalized.length > 1200
    ? `${normalized.slice(0, 1200)}\n[truncated]`
    : normalized;
}

function formatRuntimeVariableEvidence(item) {
  return [
    `- variable \`${item.key}\``,
    `configured ${formatBoolean(item.configured)}`,
    `owner ${item.owner}`,
    `status ${item.status}`,
  ].join("; ");
}

function getFailureDetails(error) {
  if (!error || typeof error !== "object") {
    return {
      error: "Unknown verification failure",
      stderr: "",
      stdout: "",
    };
  }

  return {
    error:
      error instanceof Error
        ? sanitizeEvidenceText(error.message)
        : "Unknown verification failure",
    stderr: formatOutputExcerpt(error.stderr),
    stdout: formatOutputExcerpt(error.stdout),
  };
}

function getUsageText() {
  return [
    "Usage:",
    "  npm run verify:evidence",
    "  npm run verify:evidence -- --out <path>",
    "  npm run verify:evidence -- --out-dir <dir>",
    "",
    "Options:",
    "  --out <path>      Write evidence to an exact Markdown file path.",
    "  --out-dir <dir>   Write evidence to a timestamped Markdown file in a directory.",
    "  --help, -h        Show this help without running verification checks.",
  ].join("\n");
}

function parseCliArgs(args) {
  const knownOptions = new Set(["--out", "--out-dir", "--help", "-h"]);
  const countOption = (option) => args.filter((arg) => arg === option).length;

  if (args.includes("--help") || args.includes("-h")) {
    return { help: true, outputPath: "" };
  }

  if (countOption("--out") > 1) {
    throw new Error("Use --out only once.");
  }

  if (countOption("--out-dir") > 1) {
    throw new Error("Use --out-dir only once.");
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("--")) {
      throw new Error(
        `Unexpected argument: ${arg}. Run npm run verify:evidence -- --help.`,
      );
    }

    if (!knownOptions.has(arg)) {
      throw new Error(
        `Unknown option: ${arg}. Run npm run verify:evidence -- --help.`,
      );
    }

    if (arg === "--out" || arg === "--out-dir") {
      index += 1;

      if (!args[index] || args[index].startsWith("--")) {
        const valueName = arg === "--out" ? "path" : "dir";
        throw new Error(
          `Usage: npm run verify:evidence -- ${arg} <${valueName}>`,
        );
      }
    }
  }

  const outIndex = args.findIndex((arg) => arg === "--out");
  const outDirIndex = args.findIndex((arg) => arg === "--out-dir");

  if (outIndex !== -1 && outDirIndex !== -1) {
    throw new Error("Use only one output option: --out or --out-dir.");
  }

  if (outIndex === -1 && outDirIndex === -1) {
    return { help: false, outputPath: "" };
  }

  if (outDirIndex !== -1) {
    const outputDir = args[outDirIndex + 1];

    if (!outputDir || outputDir.startsWith("--")) {
      throw new Error("Usage: npm run verify:evidence -- --out-dir <dir>");
    }

    return {
      help: false,
      outputPath: resolve(
        join(
          outputDir,
          `prompt-ai-studio-verification-evidence-${formatEvidenceTimestamp(
            new Date(),
          )}.md`,
        ),
      ),
    };
  }

  const outputPath = args[outIndex + 1];

  if (!outputPath || outputPath.startsWith("--")) {
    throw new Error("Usage: npm run verify:evidence -- --out <path>");
  }

  return { help: false, outputPath: resolve(outputPath) };
}

function buildRuntimeStatus() {
  const { buildEnvironmentRuntimeStatusFromEnv } = loadTypescriptModule(
    "src/lib/data/environment-readiness.ts",
  );

  return buildEnvironmentRuntimeStatusFromEnv(process.env);
}

function buildRuntimeReadinessEvidence(runtimeStatus) {
  return [
    "## Runtime Readiness",
    `- checkedAt: ${runtimeStatus.checkedAt}`,
    `- releaseGate: ${runtimeStatus.releaseGate.stage} (${runtimeStatus.releaseGate.score}/100)`,
    `- generationMode: ${runtimeStatus.generation.mode}`,
    `- generationModel: ${runtimeStatus.generation.model || "local fallback"}`,
    `- storageMode: ${runtimeStatus.storage.mode}`,
    `- supabasePublicClientConfigured: ${formatBoolean(
      runtimeStatus.supabase.publicClientConfigured,
    )}`,
    `- supabaseServerImporterConfigured: ${formatBoolean(
      runtimeStatus.supabase.serverImporterConfigured,
    )}`,
    `- supabaseProjectRefConfigured: ${formatBoolean(
      runtimeStatus.supabase.projectRefConfigured,
    )}`,
    `- supabaseReadyForMigration: ${formatBoolean(
      runtimeStatus.supabase.readyForMigration,
    )}`,
    `- supabaseImportExecutionEnabled: ${formatBoolean(
      runtimeStatus.supabase.importExecutionEnabled,
    )}`,
    "",
    "## Runtime Variables",
    ...runtimeStatus.variables.map(formatRuntimeVariableEvidence),
    "",
    "## Runtime Warnings",
    ...(runtimeStatus.warnings.length > 0
      ? runtimeStatus.warnings.map((warning) => `- ${warning}`)
      : ["- none"]),
  ];
}

let cli;

try {
  cli = parseCliArgs(process.argv.slice(2));
} catch (error) {
  console.error(
    error instanceof Error
      ? sanitizeEvidenceText(error.message)
      : "Invalid arguments.",
  );
  process.exit(1);
}

if (cli.help) {
  console.log(getUsageText());
  process.exit(0);
}

const outputPath = cli.outputPath;
const runtimeStatus = buildRuntimeStatus();

const startedAt = new Date().toISOString();
const results = [];

for (const check of verificationChecks) {
  const checkStartedAt = new Date().toISOString();

  try {
    execFileSync(check.command, check.args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    results.push({
      ...check,
      finishedAt: new Date().toISOString(),
      startedAt: checkStartedAt,
      status: "pass",
    });
  } catch (error) {
    const failureDetails = getFailureDetails(error);
    results.push({
      ...check,
      ...failureDetails,
      finishedAt: new Date().toISOString(),
      startedAt: checkStartedAt,
      status: "fail",
    });
    break;
  }
}

const failed = results.find((result) => result.status === "fail");
const markdown = [
  "# Prompt AI Studio Verification Evidence",
  "",
  `- startedAt: ${startedAt}`,
  `- finishedAt: ${new Date().toISOString()}`,
  `- status: ${failed ? "fail" : "pass"}`,
  `- outputPath: ${outputPath || "stdout"}`,
  "",
  "## Checks",
  ...results.map((result) => {
    const commandText = formatVerificationCommand(result);
    return [
      `### ${result.label}`,
      `- status: ${result.status}`,
      `- script: ${result.scriptName}`,
      `- command: \`${commandText}\``,
      `- startedAt: ${result.startedAt}`,
      `- finishedAt: ${result.finishedAt}`,
      ...(result.error ? [`- error: ${result.error}`] : []),
      ...(result.stderr
        ? ["- stderr:", "```text", result.stderr, "```"]
        : []),
      ...(result.stdout
        ? ["- stdout:", "```text", result.stdout, "```"]
        : []),
    ].join("\n");
  }),
  "",
  ...buildRuntimeReadinessEvidence(runtimeStatus),
  "",
  "## Operator Notes",
  "- This evidence contains command status, runtime readiness booleans, and bounded failure excerpts.",
  "- Failed checks include bounded stdout/stderr excerpts with basic key/token redaction.",
  "- Run one verification command at a time because `next build` uses a build lock.",
  "- It should not contain raw API keys, Supabase keys, or other secrets.",
  "- Save this output with release or migration handoff records when needed.",
].join("\n");

console.log(markdown);

if (outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${markdown}\n`, "utf8");
  console.error(`Verification evidence written to ${outputPath}`);
}

if (failed) {
  process.exitCode = 1;
}

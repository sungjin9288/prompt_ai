import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const smokeCommands = [
  {
    args: [
      "run",
      "smoke:chrome-extension",
      "--",
      "--out",
      "output/smoke/chrome-extension-smoke.md",
    ],
    label: "Chrome extension",
    out: "output/smoke/chrome-extension-smoke.md",
  },
  {
    args: [
      "run",
      "smoke:mcp",
      "--",
      "--out",
      "output/smoke/mcp-bridge-smoke.md",
    ],
    label: "MCP bridge",
    out: "output/smoke/mcp-bridge-smoke.md",
  },
  {
    args: [
      "run",
      "smoke:mcp-client",
      "--",
      "--out",
      "output/smoke/mcp-client-smoke.md",
    ],
    label: "MCP client",
    out: "output/smoke/mcp-client-smoke.md",
  },
  {
    args: [
      "run",
      "smoke:learning-feedback",
      "--",
      "--out",
      "output/smoke/learning-feedback-smoke.md",
    ],
    label: "Learning feedback",
    out: "output/smoke/learning-feedback-smoke.md",
  },
];

function readGitValue(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unavailable";
  }
}

function buildGitProvenance() {
  const status = readGitValue(["status", "--short"]);

  return {
    branch: readGitValue(["branch", "--show-current"]) || "detached",
    changedFiles:
      status === "unavailable" || !status ? 0 : status.split("\n").length,
    commit: readGitValue(["rev-parse", "--short", "HEAD"]),
    status,
  };
}

function formatWorkingTreeStatus(status) {
  if (status === "unavailable") {
    return "unavailable";
  }

  return status ? "dirty" : "clean";
}

for (const smoke of smokeCommands) {
  const result = spawnSync("npm", smoke.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`${smoke.label} smoke failed: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${smoke.label} smoke failed with exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}

const gitProvenance = buildGitProvenance();

writeFileSync(
  "output/smoke/integrations-smoke-summary.md",
  `${[
    "# Integrations Smoke Summary",
    "",
    "- command: npm run smoke:integrations",
    "- gate: local packets pass before external AI delivery",
    "- external services: not contacted",
    `- branch: ${gitProvenance.branch}`,
    `- commit: ${gitProvenance.commit}`,
    `- workingTree: ${formatWorkingTreeStatus(gitProvenance.status)}`,
    `- changedFiles: ${gitProvenance.changedFiles}`,
    "",
    "## Packets",
    ...smokeCommands.map((smoke) => `- ${smoke.label}: ${smoke.out}`),
    "",
    "## Pass condition",
    "- Chrome extension file contract passed.",
    "- MCP bridge self-test contract passed.",
    "- MCP client stdio JSON-RPC smoke passed.",
    "- Learning feedback queue contract passed.",
    "- Review-required delivery still happens after local packet review.",
    "- confirmSave stays false until the external AI result is reviewed.",
  ].join("\n")}\n`,
);

console.log("Integrations smoke evidence packets written to output/smoke.");

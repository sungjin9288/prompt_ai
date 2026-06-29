import { spawnSync } from "node:child_process";

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
  },
];

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

console.log("Integrations smoke evidence packets written to output/smoke.");

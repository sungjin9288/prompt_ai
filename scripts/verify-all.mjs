import { spawnSync } from "node:child_process";
import {
  formatVerificationCommand,
  verificationChecks,
} from "./lib/verification-checks.mjs";

for (const check of verificationChecks) {
  const commandText = formatVerificationCommand(check);

  console.log(`\n==> ${check.label} (${check.scriptName})`);
  console.log(`$ ${commandText}`);

  const result = spawnSync(check.command, check.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`${check.label} failed: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${check.label} failed with exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}

console.log("\nAll verification checks passed.");

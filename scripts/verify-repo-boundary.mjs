import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";

const expectedRoot = realpathSync(process.cwd());
const actualRoot = realpathSync(
  execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim(),
);

assert.equal(
  actualRoot,
  expectedRoot,
  `Expected git root ${expectedRoot}, but found ${actualRoot}.`,
);

console.log(`Repository boundary verification passed for ${actualRoot}.`);

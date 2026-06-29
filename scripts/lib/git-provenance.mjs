import { execFileSync } from "node:child_process";

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

export function formatWorkingTreeStatus(status) {
  if (status === "unavailable") {
    return "unavailable";
  }

  return status ? "dirty" : "clean";
}

export function buildGitProvenance() {
  const status = readGitValue(["status", "--short"]);

  return {
    branch: readGitValue(["branch", "--show-current"]) || "detached",
    changedFiles:
      status === "unavailable" || !status ? 0 : status.split("\n").length,
    commit: readGitValue(["rev-parse", "--short", "HEAD"]),
    status,
  };
}

export function buildGitProvenanceLines(gitProvenance) {
  return [
    `- branch: ${gitProvenance.branch}`,
    `- commit: ${gitProvenance.commit}`,
    `- workingTree: ${formatWorkingTreeStatus(gitProvenance.status)}`,
    `- changedFiles: ${gitProvenance.changedFiles}`,
  ];
}

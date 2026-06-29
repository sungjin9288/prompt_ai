import { execFileSync } from "node:child_process";

export const gitProvenanceEnvKey = "PROMPT_AI_STUDIO_GIT_PROVENANCE";

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

function parseGitProvenance(value) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    if (
      typeof parsed.branch === "string" &&
      typeof parsed.changedFiles === "number" &&
      typeof parsed.commit === "string" &&
      typeof parsed.status === "string"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function formatWorkingTreeStatus(status) {
  if (status === "unavailable") {
    return "unavailable";
  }

  return status ? "dirty" : "clean";
}

export function buildGitProvenance() {
  const envProvenance = parseGitProvenance(process.env[gitProvenanceEnvKey]);

  if (envProvenance) {
    return envProvenance;
  }

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

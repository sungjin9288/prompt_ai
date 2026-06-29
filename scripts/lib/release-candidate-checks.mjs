export const releaseCandidateChecks = [
  {
    args: ["run", "verify:repo-boundary"],
    command: "npm",
    label: "Repository boundary",
    scriptName: "verify:repo-boundary",
  },
  {
    args: ["run", "verify:evidence-hygiene"],
    command: "npm",
    label: "Evidence hygiene",
    scriptName: "verify:evidence-hygiene",
  },
  {
    args: ["run", "verify:smoke-evidence"],
    command: "npm",
    label: "Local smoke evidence",
    scriptName: "verify:smoke-evidence",
  },
  {
    args: ["run", "verify:secrets"],
    command: "npm",
    label: "Secret safety",
    scriptName: "verify:secrets",
  },
];

export const releaseRootTempPaths = [".prompt-ai-studio", ".playwright-cli"];

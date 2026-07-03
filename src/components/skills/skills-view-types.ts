export type SkillManualCopy = {
  id:
    | "template"
    | "run"
    | "source-link"
    | "run-link"
    | "latest-run-link"
    | "run-history-link"
    | "improvement-plan"
    | "operations-report";
  targetId?: string;
  title: string;
  body: string;
  reason?: string;
};

export interface StudioSummaryItem {
  label: string;
  value: string;
  detail: string;
}

export interface StudioMetricItem {
  label: string;
  value: string;
}

export interface StudioNumberedStep {
  step: string;
  label: string;
  value: string;
  detail: string;
}

export interface StudioLearningWorkflowStep {
  step: string;
  label: string;
  title: string;
  detail: string;
}

export interface StudioNextGenerationSummary {
  status: string;
  title: string;
  detail: string;
  evidence: string;
  savePlan: string;
  source: string;
}

export type StudioManualCopy = {
  id:
    | "prompt"
    | "quality-report"
    | "target-ai-package"
    | "target-ai-improvement-brief"
    | "learning-report"
    | "missing-context"
    | "quality-comparison"
    | "input-analysis"
    | "source-link"
    | "saved-library-link"
    | "saved-skill-link"
    | "saved-studio-source-link"
    | "saved-studio-persistence-link"
    | "saved-studio-operational-group-link";
  title: string;
  body: string;
};

export type ActiveFilterId =
  | "language"
  | "output"
  | "model"
  | "engine"
  | "learning"
  | "improvement"
  | "source-reason"
  | "studio-persistence"
  | "studio-source"
  | "studio-variant"
  | "query"
  | "sort";

export interface ActiveFilterItem {
  id: ActiveFilterId;
  label: string;
  removeLabel: string;
}

export type LibraryManualCopy = {
  id:
    | "prompt"
    | "target-ai-package"
    | "target-ai-improvement-brief"
    | "filter-link"
    | "detail-link"
    | "improvement-brief"
    | "missing-context"
    | "learning-report"
    | "comparison-brief"
    | "source-health-filter-link"
    | "source-health-filter-report"
    | "source-health-candidate-link"
    | "source-health-candidate-note"
    | "selected-operational-summary-report"
    | "selected-operational-group-link"
    | "selected-operational-source-link"
    | "selected-operational-persistence-link"
    | "selected-studio-source-link"
    | "selected-studio-source-original-link"
    | "selected-studio-persistence-link"
    | "list-studio-source-link"
    | "list-studio-source-original-link"
    | "list-studio-persistence-link"
    | "list-studio-operational-group-link"
    | "studio-operational-group-link"
    | "studio-operational-group-report"
    | "studio-persistence-link"
    | "studio-persistence-report"
    | "studio-persistence-candidate-note"
    | "studio-source-link"
    | "studio-source-report"
    | "studio-source-candidate-note"
    | "studio-variant-link"
    | "no-source-meta-note";
  targetId?: string;
  title: string;
  body: string;
};

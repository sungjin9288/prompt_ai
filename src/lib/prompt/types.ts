export type TargetModel = "general" | "gpt" | "claude" | "codex" | "gemini";

export type PromptLanguageStrategy = "english" | "hybrid";

export type PromptOutputLanguage = "korean" | "english" | "same_as_input";

export interface PromptLanguageDecisionMeta {
  strategy: PromptLanguageStrategy;
  label: string;
  reason: string;
  confidence: "moderate" | "strong";
  signals: string[];
}

export interface TargetModelDecisionMeta {
  targetModels: TargetModel[];
  reason: string;
  confidence: "moderate" | "strong";
  signals: string[];
}

export interface UserProfile {
  id: string;
  role: string;
  industries: string[];
  goals: string[];
  preferredTone: string;
  preferredOutputs: string[];
  avoidPhrases: string[];
  repeatedTasks: string[];
}

export interface CompanyProfile {
  id: string;
  companyName: string;
  description: string;
  products: string[];
  customers: string[];
  brandTone: string;
  internalTerms: string[];
  bannedPhrases: string[];
  documentFormats: string[];
}

export interface DomainProfile {
  id: string;
  name: string;
  description: string;
  promptRules: string[];
  outputFormats: string[];
  qualityChecklist: string[];
  riskNotes: string[];
}

export interface PromptRequestInput {
  rawInput: string;
  goal: string;
  domain: string;
  targetModels: TargetModel[];
  targetModelDecision?: TargetModelDecisionMeta;
  languageStrategy?: PromptLanguageStrategy;
  languageDecision?: PromptLanguageDecisionMeta;
  outputLanguage?: PromptOutputLanguage;
}

export interface PromptScoreBreakdown {
  clarity: number;
  context: number;
  outputFormat: number;
  constraints: number;
  expertise: number;
  modelFit: number;
  reusability: number;
}

export interface PromptVersion {
  id: string;
  targetModel: TargetModel;
  modelLabel: string;
  content: string;
  qualityScore: number;
  scoreBreakdown: PromptScoreBreakdown;
  assumptions: string[];
  missingContext: string[];
  createdAt: string;
}

export interface Feedback {
  id: string;
  promptVersionId: string;
  rating: number;
  comment: string;
  feedbackType:
    | "tone"
    | "context"
    | "format"
    | "accuracy"
    | "company_rule"
    | "other";
  createdAt: string;
}

export interface PromptImprovementFeedbackSource {
  id?: string;
  promptVersionId?: string;
  rating: number;
  feedbackType: Feedback["feedbackType"];
  comment: string;
  createdAt: string;
}

export type MemoryScope = "user" | "company" | "domain" | "skill";

export interface LearningMemory {
  id: string;
  scope: MemoryScope;
  sourceType: "feedback" | "profile" | "company" | "manual";
  sourceId: string;
  title: string;
  content: string;
  tags: string[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromptSkill {
  id: string;
  name: string;
  description: string;
  domain: string;
  targetModel: TargetModel;
  languageStrategy?: PromptLanguageStrategy;
  languageDecision?: PromptLanguageDecisionMeta;
  outputLanguage?: PromptOutputLanguage;
  sourcePromptId?: string;
  sourceVersionId?: string;
  inputGuide: string;
  promptTemplate: string;
  outputFormat: string;
  qualityChecklist: string[];
  tags: string[];
  usageCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptImprovementSource {
  type: "library-improvement";
  sourcePromptId: string;
  sourcePromptTitle: string;
  sourceVersionId?: string;
  sourceVersionModel?: TargetModel;
  sourceFeedback?: PromptImprovementFeedbackSource;
  createdAt: string;
}

export const promptStudioDraftSources = [
  "dashboard-personalization-action",
  "dashboard-personalization",
  "dashboard-next-action-queue",
  "dashboard-learning-action",
  "dashboard-learning-ops",
  "dashboard-source-health-action",
  "dashboard-source-health-candidate",
  "dashboard-feedback-improvement-ops",
  "dashboard-skill-ops",
  "dashboard-studio-source-ops",
  "profile-context-application",
  "company-context-application",
  "skills-operational-summary",
  "skills-improvement-plan",
  "library-improvement",
  "library-operational-summary",
  "library-source-health-filter",
  "library-source-health-candidate",
  "library-studio-operational-group",
  "library-studio-persistence-filter",
  "library-studio-persistence-candidate",
  "library-missing-source-metadata-queue",
  "library-missing-source-metadata-candidate",
  "library-studio-source-filter",
  "library-studio-source-candidate",
  "library-no-source-meta",
  "library-learning-context",
  "learning-readiness",
  "learning-filter",
  "learning-feedback-improvement",
  "learning-memory",
  "integrations-operations-checklist",
  "mcp-feedback-improvement",
  "mcp-feedback-report",
  "data-document-rag",
] as const;

export type PromptStudioDraftSource =
  (typeof promptStudioDraftSources)[number];

export const promptStudioDraftSourceVariants = [
  "dashboard-next-action-queue-verification",
  "feedback-improvement",
  "handoff-improvement",
  "learning-low-confidence-validation",
] as const;

export type PromptStudioDraftSourceVariant =
  (typeof promptStudioDraftSourceVariants)[number];

export interface PromptStudioSourceMeta {
  type: "studio-draft";
  source: PromptStudioDraftSource;
  sourceVariant?: PromptStudioDraftSourceVariant;
  sourceTitle?: string;
  sourceHref: string;
  sourceFeedback?: PromptImprovementFeedbackSource;
  inputPreview: string;
  inputLineCount: number;
  inputCharCount: number;
  createdAt: string;
  savedAt: string;
}

export interface PromptLearningContextMeta {
  enabledScopes: Record<MemoryScope, boolean>;
  appliedMemoryCount: number;
  recentFeedbackCount: number;
  appliedMemoryIds: string[];
  appliedMemoryTitles: string[];
  appliedMemoryScopes: MemoryScope[];
}

export interface PromptAsset {
  id: string;
  title: string;
  source: "local" | "openai";
  modelUsed?: string;
  languageStrategy?: PromptLanguageStrategy;
  languageDecision?: PromptLanguageDecisionMeta;
  outputLanguage?: PromptOutputLanguage;
  sourceSkillId?: string;
  sourceSkillName?: string;
  improvementSource?: PromptImprovementSource;
  studioSource?: PromptStudioSourceMeta;
  learningContext?: PromptLearningContextMeta;
  tags?: string[];
  pinned?: boolean;
  rawInput: string;
  goal: string;
  domain: string;
  targetModels: TargetModel[];
  targetModelDecision?: TargetModelDecisionMeta;
  versions: PromptVersion[];
  feedback: Feedback[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptDeletedAsset {
  prompt: PromptAsset;
  deletedAt: string;
}

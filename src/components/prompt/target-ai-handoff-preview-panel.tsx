import { primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import type {
  TargetAiHandoffReadinessItem,
  TargetAiHandoffReadinessStatus,
} from "@/lib/prompt";

export type HandoffPreviewMode = "package" | "run-prompt";

const readinessStatusLabels: Record<TargetAiHandoffReadinessStatus, string> = {
  blocked: "보강 필요",
  ready: "전달 가능",
  review: "검토 필요",
};

const readinessStatusClassNames: Record<TargetAiHandoffReadinessStatus, string> =
  {
    blocked: "border-danger/40 bg-danger/10 text-danger",
    ready: "border-success/40 bg-success/10 text-success",
    review: "border-accent/40 bg-accent/10 text-accent",
  };

export function TargetAiHandoffPreviewPanel({
  handoffPackageText,
  improvementBriefButtonLabel,
  modelLabel,
  onCopyImprovementBrief,
  onCopyPackage,
  onCopyRunPrompt,
  onOpenImprovementInStudio,
  onPreviewModeChange,
  openImprovementButtonLabel,
  packageButtonLabel,
  previewMode,
  previewModeName,
  qualityScore,
  readinessItems,
  runPromptText,
  runPromptButtonLabel,
}: {
  handoffPackageText: string;
  improvementBriefButtonLabel: string;
  modelLabel: string;
  onCopyImprovementBrief: () => void;
  onCopyPackage: () => void;
  onCopyRunPrompt: () => void;
  onOpenImprovementInStudio: () => void;
  onPreviewModeChange: (mode: HandoffPreviewMode) => void;
  openImprovementButtonLabel: string;
  packageButtonLabel: string;
  previewMode: HandoffPreviewMode;
  previewModeName: string;
  qualityScore: number;
  readinessItems: TargetAiHandoffReadinessItem[];
  runPromptText: string;
  runPromptButtonLabel: string;
}) {
  const visibleText =
    previewMode === "run-prompt" ? runPromptText : handoffPackageText;
  const readinessCounts = readinessItems.reduce(
    (counts, item) => ({
      ...counts,
      [item.status]: counts[item.status] + 1,
    }),
    { blocked: 0, ready: 0, review: 0 },
  );
  const handoffPreviewSummaryItems = [
    { label: "품질", value: `${qualityScore.toFixed(1)}/5` },
    {
      label: "전달 상태",
      value: `가능 ${readinessCounts.ready} · 검토 ${readinessCounts.review} · 보강 ${readinessCounts.blocked}`,
    },
    {
      label: "현재 보기",
      value: previewMode === "run-prompt" ? "실행 프롬프트" : "전체 패키지",
    },
    {
      label: "복사 대상",
      value: previewMode === "run-prompt" ? "본문만" : "리포트 포함",
    },
  ];

  return (
    <div className="mt-4 rounded-md border border-line bg-surface">
      <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-muted">AI 전달 패키지 미리보기</p>
          <p className="mt-1 text-sm font-semibold text-soft">
            {modelLabel} · {qualityScore.toFixed(1)}/5
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            className={secondaryButtonClass}
            type="button"
            onClick={onCopyRunPrompt}
          >
            {runPromptButtonLabel}
          </button>
          <button
            className={secondaryButtonClass}
            type="button"
            onClick={onCopyPackage}
          >
            {packageButtonLabel}
          </button>
        </div>
      </div>
      <div
        className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3 lg:grid-cols-4"
        data-testid="target-ai-handoff-preview-summary"
      >
        {handoffPreviewSummaryItems.map((item) => (
          <div
            className="min-w-0 rounded-md border border-line bg-panel px-3 py-2"
            key={item.label}
          >
            <p className="text-[11px] text-muted">{item.label}</p>
            <p className="mt-1 break-words text-xs font-semibold text-soft">
              {item.value}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-full rounded-md border border-line bg-panel p-1 sm:w-auto">
          <label
            className={`min-h-9 flex-1 cursor-pointer rounded px-3 py-1.5 text-center text-xs font-semibold transition sm:flex-none ${
              previewMode === "package"
                ? "bg-panel-strong text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            <input
              checked={previewMode === "package"}
              className="sr-only"
              name={previewModeName}
              onChange={() => onPreviewModeChange("package")}
              type="radio"
              value="package"
            />
            전체 패키지
          </label>
          <label
            className={`min-h-9 flex-1 cursor-pointer rounded px-3 py-1.5 text-center text-xs font-semibold transition sm:flex-none ${
              previewMode === "run-prompt"
                ? "bg-panel-strong text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            <input
              checked={previewMode === "run-prompt"}
              className="sr-only"
              name={previewModeName}
              onChange={() => onPreviewModeChange("run-prompt")}
              type="radio"
              value="run-prompt"
            />
            실행 프롬프트
          </label>
        </div>
        <p className="text-xs leading-5 text-muted">
          {previewMode === "run-prompt"
            ? "외부 AI에 바로 붙여넣을 본문만 표시합니다."
            : "품질 리포트와 보강 질문까지 포함한 전달 패키지입니다."}
        </p>
      </div>
      <div className="border-b border-line px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-soft">전달 전 체크</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              낮은 점수, 누락 맥락, 가정 항목을 전송 전에 빠르게 확인합니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              className={`${primaryButtonClass} w-full sm:w-auto`}
              type="button"
              onClick={onOpenImprovementInStudio}
            >
              {openImprovementButtonLabel}
            </button>
            <button
              className={`${secondaryButtonClass} w-full sm:w-auto`}
              type="button"
              onClick={onCopyImprovementBrief}
            >
              {improvementBriefButtonLabel}
            </button>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {readinessItems.map((item) => (
            <div
              className="min-w-0 rounded-md border border-line bg-panel-strong px-3 py-3"
              key={item.label}
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold text-soft">
                  {item.label}
                </p>
                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-semibold ${
                    readinessStatusClassNames[item.status]
                  }`}
                >
                  {readinessStatusLabels[item.status]}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap px-4 py-4 font-mono text-[12px] leading-5 text-soft">
        {visibleText}
      </pre>
    </div>
  );
}

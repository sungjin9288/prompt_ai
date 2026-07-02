import { modelLabels } from "@/lib/prompt";
import { formatAbsoluteInternalHref } from "@/lib/navigation/href";
import {
  type PromptImprovementRecord,
  type PromptImprovementSummary,
  type PromptSourceHealthIssue,
} from "@/lib/analytics/prompt-improvement";
import {
  feedbackTypeLabels,
  formatDashboardDate,
  formatSignedScore,
  formatTimestamp,
} from "@/lib/dashboard/shared";
import {
  improvementLibraryHref,
  promptDetailLibraryHref,
  promptFeedbackLibraryHref,
  studioPersistenceLibraryHref,
  studioSourceLibraryHref,
} from "@/lib/dashboard/hrefs";
import {
  type FeedbackBasedImprovementRecord,
} from "@/lib/dashboard/learning-memory";
import {
  type StudioPersistenceSummaryItem,
  type StudioSourceSummaryItem,
} from "@/lib/dashboard/shared";

export function buildDashboardFeedbackImprovementOpsReportText({
  baseUrl,
  improvementSummary,
  records,
}: {
  baseUrl?: string;
  improvementSummary: PromptImprovementSummary;
  records: FeedbackBasedImprovementRecord[];
}) {
  const formatReportHref = (href: string) =>
    baseUrl ? formatAbsoluteInternalHref(href, baseUrl) : href;
  const averageDelta = records.length
    ? records.reduce((sum, record) => sum + record.delta, 0) / records.length
    : 0;
  const reviewCount = records.filter((record) => record.delta <= 0).length;
  const archivedFeedbackSourceCount = records.filter(
    (record) => record.sourceDeletedAt,
  ).length;
  const archivedSourceHref = improvementLibraryHref({
    improvement: "archived-source",
  });
  const unmeasuredHref = improvementLibraryHref({ improvement: "unmeasured" });
  const recentRecords = records.slice(0, 5);

  return [
    "# 피드백 반영 개선 리포트",
    "",
    "## Summary",
    `- 피드백 기반 개선본: ${records.length}개`,
    `- 평균 개선폭: ${records.length ? formatSignedScore(averageDelta) : "-"}`,
    `- 재검토 필요: ${reviewCount}개`,
    `- 전체 개선본 측정 가능: ${improvementSummary.measurableCount}/${improvementSummary.totalImprovementPrompts}개`,
    `- 전체 개선본 측정 불가: ${improvementSummary.unmeasuredCount}개`,
    `- 피드백 개선본 보관함 원본: ${archivedFeedbackSourceCount}개`,
    "",
    "## Source health links",
    `- 보관함 원본 개선본: ${formatReportHref(archivedSourceHref)}`,
    `- 측정 불가 개선본: ${formatReportHref(unmeasuredHref)}`,
    "",
    "## Recent feedback-based improvements",
    recentRecords.length
      ? recentRecords
          .map((record, index) =>
            [
              `### ${index + 1}. ${record.prompt.title}`,
              `- 개선본 상세: ${formatReportHref(
                promptDetailLibraryHref(record.prompt.id, record.targetModel),
              )}`,
              record.sourceDeletedAt
                ? `- 원본 피드백: 원본이 삭제 보관함에 있음. 개선본 상세에서 복원 후 확인: ${formatReportHref(
                    promptDetailLibraryHref(
                      record.prompt.id,
                      record.targetModel,
                    ),
                  )}`
                : `- 원본 피드백: ${formatReportHref(
                    promptFeedbackLibraryHref(
                      record.sourcePrompt.id,
                      record.sourceFeedback.id,
                      record.targetModel,
                    ),
                  )}`,
              `- 원본: ${record.sourcePrompt.title}${
                record.sourceDeletedAt ? " (삭제 보관함)" : ""
              }`,
              `- AI 도구: ${modelLabels[record.targetModel]}`,
              `- 생성일: ${formatDashboardDate(record.createdAt)}`,
              `- 점수 변화: ${record.sourceVersion.qualityScore.toFixed(
                1,
              )} → ${record.improvedVersion.qualityScore.toFixed(
                1,
              )} (${formatSignedScore(record.delta)})`,
              `- 반영 피드백: ${record.sourceFeedback.rating.toFixed(0)}/5 · ${
                feedbackTypeLabels[record.sourceFeedback.feedbackType]
              }`,
              `- 코멘트: ${record.sourceFeedback.comment}`,
            ].join("\n"),
          )
          .join("\n\n")
      : "- 아직 피드백 출처가 보존된 개선본이 없습니다.",
    "",
    "## Recommended next actions",
    "- 개선폭이 0 이하인 항목은 원본 피드백과 개선본을 비교해 보강 지시를 다시 작성합니다.",
    "- 반복되는 피드백 유형은 Studio 기본 출력 형식과 스킬 템플릿 체크리스트에 반영합니다.",
    "- 긍정적인 개선본은 같은 분야/AI 도구의 재사용 템플릿 후보로 검토합니다.",
  ].join("\n");
}

export function buildDashboardFeedbackImprovementPriorityReportText({
  baseUrl,
  record,
}: {
  baseUrl?: string;
  record: FeedbackBasedImprovementRecord;
}) {
  const formatReportHref = (href: string) =>
    baseUrl ? formatAbsoluteInternalHref(href, baseUrl) : href;
  const improvedHref = formatReportHref(
    promptDetailLibraryHref(record.prompt.id, record.targetModel),
  );
  const sourceFeedbackHref = record.sourceDeletedAt
    ? improvedHref
    : formatReportHref(
        promptFeedbackLibraryHref(
          record.sourcePrompt.id,
          record.sourceFeedback.id,
          record.targetModel,
        ),
      );

  return [
    "# 피드백 개선 우선 점검 리포트",
    "",
    "## Priority reason",
    `- ${feedbackImprovementPriorityReason(record)}`,
    "",
    "## Target improvement",
    `- 개선본: ${record.prompt.title}`,
    `- 개선본 상세: ${improvedHref}`,
    `- 원본: ${record.sourcePrompt.title}${
      record.sourceDeletedAt ? " (삭제 보관함)" : ""
    }`,
    `- 원본 피드백: ${sourceFeedbackHref}`,
    `- AI 도구: ${modelLabels[record.targetModel]}`,
    `- 생성일: ${formatDashboardDate(record.createdAt)}`,
    `- 점수 변화: ${record.sourceVersion.qualityScore.toFixed(
      1,
    )} → ${record.improvedVersion.qualityScore.toFixed(1)} (${formatSignedScore(
      record.delta,
    )})`,
    "",
    "## Applied feedback",
    `- 유형: ${feedbackTypeLabels[record.sourceFeedback.feedbackType]}`,
    `- 평점: ${record.sourceFeedback.rating.toFixed(0)}/5`,
    `- 코멘트: ${record.sourceFeedback.comment}`,
    "",
    "## Required action",
    record.sourceDeletedAt
      ? "- 먼저 원본 복원 또는 원본 확인을 완료한 뒤 피드백 반영 방향을 판단합니다."
      : record.delta <= 0
        ? "- 원본 피드백과 개선본을 비교하고, 개선 지시문에 누락된 출력 형식/제약/검증 기준을 보강합니다."
        : "- 반복 가능한 피드백 규칙을 Learning memory 또는 Skill 체크리스트 후보로 전환합니다.",
  ].join("\n");
}

export function buildDashboardFeedbackImprovementOpsStudioPrompt({
  baseUrl,
  improvementSummary,
  records,
}: {
  baseUrl?: string;
  improvementSummary: PromptImprovementSummary;
  records: FeedbackBasedImprovementRecord[];
}) {
  return [
    "Role:",
    "You are a senior prompt quality operations strategist.",
    "",
    "Objective:",
    "Use the feedback-based improvement report below to create an execution-ready plan for improving prompt quality loops.",
    "",
    "Instructions:",
    "- Prioritize improvements that convert repeated user feedback into reusable prompt rules.",
    "- Separate actions for Studio prompt structure, Library feedback review, Skill template updates, and quality measurement.",
    "- Identify which feedback types should become checklist items or reusable memory candidates.",
    "- Treat deleted-archive sources and unmeasured improvement records as source-health work before judging quality changes.",
    "- Use the Source health links in the report to separate restore/check actions from prompt rewrite actions.",
    "- If a source prompt is in the deleted archive, include a restore/check step before rewriting the improvement loop.",
    "- Do not invent user, company, customer, or performance facts that are not present in the report.",
    "- Return the plan in Korean, but write reusable AI prompt instructions in English when useful.",
    "",
    "Feedback-based improvement report:",
    buildDashboardFeedbackImprovementOpsReportText({
      baseUrl,
      improvementSummary,
      records,
    }),
  ].join("\n");
}

export function buildDashboardFeedbackImprovementPriorityStudioPrompt({
  baseUrl,
  record,
}: {
  baseUrl?: string;
  record: FeedbackBasedImprovementRecord;
}) {
  return [
    "Role:",
    "You are a senior prompt quality reviewer.",
    "",
    "Objective:",
    "Create a focused action plan for the single highest-priority feedback-based prompt improvement below.",
    "",
    "Instructions:",
    "- Separate source-health checks from prompt rewrite work.",
    "- If the source is archived or deleted, start with restore/check steps before quality judgment.",
    "- If the score delta is zero or negative, compare the applied feedback against the improved prompt and propose concrete rewrite instructions.",
    "- If the improvement is positive, extract reusable prompt rules for future Studio generations.",
    "- Do not invent user, company, customer, or performance facts that are not present in the report.",
    "- Return the plan in Korean, but write reusable AI prompt instructions in English when useful.",
    "",
    "Priority feedback improvement report:",
    buildDashboardFeedbackImprovementPriorityReportText({
      baseUrl,
      record,
    }),
  ].join("\n");
}

export function buildDashboardStudioSourceOpsReportText({
  baseUrl,
  persistenceSummary,
  sourceSummary,
}: {
  baseUrl?: string;
  persistenceSummary: StudioPersistenceSummaryItem[];
  sourceSummary: StudioSourceSummaryItem[];
}) {
  const missingSourceMetadataCount =
    persistenceSummary.find((item) => item.mode === "none")?.count ?? 0;
  const formatReportHref = (href: string) =>
    formatAbsoluteInternalHref(href, baseUrl) ?? href;

  return [
    "# Studio 저장 출처 운영 리포트",
    "",
    "## Summary",
    `- Studio 저장 출처: ${sourceSummary.length}개`,
    `- Studio 저장 출처 메타 저장본: ${sourceSummary.reduce(
      (sum, item) => sum + item.count,
      0,
    )}개`,
    `- 저장 출처 메타 없음: ${missingSourceMetadataCount}개 · ${formatReportHref(
      studioPersistenceLibraryHref("none"),
    )}`,
    "",
    "## 저장 방식",
    persistenceSummary
      .map(
        (item) =>
          `- ${item.label}: ${item.count}개 · ${item.description} · ${formatReportHref(
            studioPersistenceLibraryHref(item.mode),
          )}`,
      )
      .join("\n"),
    "",
    "## 저장 출처",
    sourceSummary.length
      ? sourceSummary
          .map(
            (item) =>
              [
                `### ${item.label}`,
                `- 저장본: ${item.count}개`,
                `- 설명: ${item.description}`,
                `- 다음 확인: ${item.nextAction}`,
                item.sourceVariantLabels.length
                  ? `- 세부 유형: ${item.sourceVariantLabels.join(", ")}`
                  : undefined,
                item.sourceVariantLinks.length
                  ? [
                      "- 세부 유형 필터:",
                      ...item.sourceVariantLinks.map(
                        (variant) =>
                          `  - ${variant.label} ${variant.count}개: ${formatReportHref(
                            variant.href,
                          )}`,
                      ),
                    ].join("\n")
                  : undefined,
                item.sourceTitles.length
                  ? `- 대표 출처 제목: ${item.sourceTitles.join(", ")}`
                  : undefined,
                item.sourceExamples.length
                  ? [
                      "- 대표 저장본:",
                      ...item.sourceExamples.flatMap((example) => [
                        `  - ${example.title}: ${formatReportHref(example.href)}`,
                        ...(example.originalHref
                          ? [
                              `    - 원본 경로: ${formatReportHref(
                                example.originalHref,
                              )}`,
                            ]
                          : []),
                      ]),
                    ].join("\n")
                  : undefined,
                item.count > item.sourceExamples.length
                  ? `- 대표 저장본 외: ${item.count - item.sourceExamples.length}개`
                  : undefined,
                `- Library 필터: ${formatReportHref(
                  studioSourceLibraryHref({ source: item.source }),
                )}`,
              ]
                .filter(Boolean)
                .join("\n"),
          )
          .join("\n\n")
      : "- 아직 Studio 저장 출처 메타가 있는 저장본이 없습니다.",
    "",
    "## 저장 출처 메타 없음 큐",
    missingSourceMetadataCount
      ? [
          `- 대상: ${missingSourceMetadataCount}개`,
          `- Library 필터: ${formatReportHref(
            studioPersistenceLibraryHref("none"),
          )}`,
          "- 직접 작성 또는 가져온 저장본은 Studio 출처 없음으로 유지합니다.",
          "- Dashboard, Library, Learning, Skills 조치에서 만든 결과라면 저장 출처가 기록되는 Studio 흐름으로 다시 저장합니다.",
        ].join("\n")
      : "- 현재 저장 출처 메타 없음 큐는 비어 있습니다.",
    "",
    "## 운영 기준",
    "- Library 저장 출처 없음 메모는 저장 출처 메타가 없는 항목을 운영 출처로 재정리했는지 확인합니다.",
    "- 개선 체인으로 관리해야 하는 저장본이 운영 출처로만 남아 있으면 Library 개선 브리프 흐름으로 다시 저장합니다.",
    "- Dashboard, Library, Learning, Skills 출처가 섞여 있는 경우 같은 저장 출처별로 목적과 재사용 기준을 분리합니다.",
  ].join("\n");
}

export function buildDashboardStudioSourceOpsStudioPrompt({
  baseUrl,
  persistenceSummary,
  sourceSummary,
}: {
  baseUrl?: string;
  persistenceSummary: StudioPersistenceSummaryItem[];
  sourceSummary: StudioSourceSummaryItem[];
}) {
  return [
    "Role:",
    "You are a senior prompt operations strategist auditing Studio source metadata.",
    "",
    "Objective:",
    "Use the Studio source operations report below to create a practical governance plan for prompt source tracking.",
    "",
    "Instructions:",
    "- Separate actions for improvement-chain prompts, operational-source prompts, and prompts without Studio source metadata.",
    "- Identify which source types should remain operational records and which should become improvement-chain records.",
    "- For Library missing saved-source metadata records, define when to keep the original prompt as legacy and when to regenerate it through a traceable Studio flow.",
    "- Treat the missing saved-source metadata queue as an explicit operating queue, not a general note.",
    "- Use the Library filter links in the report as the working queues.",
    "- Do not invent missing user, company, customer, or performance facts.",
    "- Return the plan in Korean, but write reusable AI prompt instructions in English when useful.",
    "",
    "Studio source operations report:",
    buildDashboardStudioSourceOpsReportText({
      baseUrl,
      persistenceSummary,
      sourceSummary,
    }),
  ].join("\n");
}

export function buildDashboardMissingSourceMetadataQueueStudioPrompt({
  baseUrl,
  persistenceSummary,
}: {
  baseUrl?: string;
  persistenceSummary: StudioPersistenceSummaryItem[];
}) {
  const missingSourceMetadataCount =
    persistenceSummary.find((item) => item.mode === "none")?.count ?? 0;
  const formatQueueHref = (href: string) =>
    formatAbsoluteInternalHref(href, baseUrl) ?? href;

  return [
    "Role:",
    "You are a senior prompt operations strategist auditing missing Studio saved-source metadata.",
    "",
    "Objective:",
    "Create an execution-ready operating plan for the Library missing saved-source metadata queue.",
    "",
    "Instructions:",
    "- Separate records that should stay as legacy/direct saves from records that should be regenerated through a traceable Studio flow.",
    "- Define the decision criteria for keeping, regenerating, or reclassifying each prompt record.",
    "- Use the Library queue link as the working source of truth.",
    "- Do not invent missing user, company, customer, or performance facts.",
    "- Return the plan in Korean, but write reusable AI prompt instructions in English when useful.",
    "",
    "Missing saved-source metadata queue:",
    `- 대상: ${missingSourceMetadataCount}개`,
    `- Library 큐: ${formatQueueHref(studioPersistenceLibraryHref("none"))}`,
    "- 유지 기준: 직접 작성 또는 가져온 저장본처럼 원본 흐름이 별도로 없는 경우",
    "- 재저장 기준: Dashboard, Library, Learning, Skills 조치에서 만든 결과인데 Studio 저장 출처 메타가 없는 경우",
    "- 재분류 기준: 개선 체인으로 관리해야 하는 저장본이 운영 출처 없이 단독 저장된 경우",
  ].join("\n");
}

export function buildDashboardSourceHealthActionReport({
  improvementSummary,
  baseUrl,
}: {
  improvementSummary: PromptImprovementSummary;
  baseUrl?: string;
}) {
  const formatSourceHealthHref = (href: string) =>
    formatAbsoluteInternalHref(href, baseUrl) ?? href;
  const archivedSourceHref = improvementLibraryHref({
    improvement: "archived-source",
  });
  const unmeasuredHref = improvementLibraryHref({ improvement: "unmeasured" });
  const totalSourceHealthCount =
    improvementSummary.archivedSourceCount + improvementSummary.unmeasuredCount;
  const archivedSourceIssues = improvementSummary.sourceHealthIssues
    .filter((issue) => issue.reason === "archived-source")
    .slice(0, 5);
  const unmeasuredIssues = improvementSummary.sourceHealthIssues
    .filter((issue) => issue.reason !== "archived-source")
    .slice(0, 5);
  const issueReasonBreakdown = summarizeSourceHealthIssueReasons(
    improvementSummary.sourceHealthIssues,
  );

  return [
    "# 개선 출처 상태 조치 계획",
    "",
    "## Summary",
    `- 전체 개선본: ${improvementSummary.totalImprovementPrompts}개`,
    `- 측정 가능: ${improvementSummary.measurableCount}개`,
    `- 보관함 원본: ${improvementSummary.archivedSourceCount}개`,
    `- 측정 불가: ${improvementSummary.unmeasuredCount}개`,
    `- 출처 확인 필요: ${totalSourceHealthCount}개`,
    "",
    "## Source health links",
    `- 보관함 원본 개선본: ${formatSourceHealthHref(archivedSourceHref)}`,
    `- 측정 불가 개선본: ${formatSourceHealthHref(unmeasuredHref)}`,
    "",
    "## Reason breakdown",
    issueReasonBreakdown
      .map((item) => {
        const reasonHref = improvementLibraryHref({
          improvement:
            item.reason === "archived-source" ? "archived-source" : "unmeasured",
          sourceReason: item.reason,
        });

        return `- ${item.label}: ${item.count}개 · ${formatSourceHealthHref(
          reasonHref,
        )}`;
      })
      .join("\n"),
    "",
    "## Representative candidates",
    "### 보관함 원본",
    archivedSourceIssues.length
      ? archivedSourceIssues
          .map((issue) => formatSourceHealthIssueLine(issue, baseUrl))
          .join("\n")
      : "- 현재 후보가 없습니다.",
    "",
    "### 측정 불가",
    unmeasuredIssues.length
      ? unmeasuredIssues
          .map((issue) => formatSourceHealthIssueLine(issue, baseUrl))
          .join("\n")
      : "- 현재 후보가 없습니다.",
    "",
    "## Actions",
    improvementSummary.archivedSourceCount
      ? "- 보관함 원본 개선본은 Library 필터에서 원본 복원이 필요한지 먼저 확인합니다."
      : "- 보관함 원본 개선본은 현재 없습니다.",
    improvementSummary.unmeasuredCount
      ? "- 측정 불가 개선본은 원본 프롬프트가 active 목록과 삭제 보관함 중 어디에도 없는지 확인하고, 백업 복원 또는 원본 재저장을 검토합니다."
      : "- 측정 불가 개선본은 현재 없습니다.",
    "- 출처 확인 후 Dashboard를 다시 열어 평균 개선폭과 재개선 후보가 정상 계산되는지 확인합니다.",
  ].join("\n");
}

export function buildDashboardSourceHealthActionStudioPrompt({
  improvementSummary,
  baseUrl,
}: {
  improvementSummary: PromptImprovementSummary;
  baseUrl?: string;
}) {
  return [
    "Role:",
    "You are a senior prompt operations manager cleaning up prompt improvement source health.",
    "",
    "Objective:",
    "Use the source health action report below to create a short execution plan for restoring source traceability before judging prompt improvement quality.",
    "",
    "Instructions:",
    "- Separate actions for deleted-archive sources, unmeasured improvements, backup/import checks, and post-fix validation.",
    "- Prioritize source restoration and source-link verification before rewriting any prompt.",
    "- Use representative candidates as examples, not as the full universe when the summary count is larger than the sample list.",
    "- Do not invent missing prompt titles, company facts, or performance results.",
    "- Return the plan in Korean, but keep reusable AI workflow instructions in English when useful.",
    "",
    "Source health action report:",
    buildDashboardSourceHealthActionReport({ improvementSummary, baseUrl }),
  ].join("\n");
}

export function sourceHealthIssueReasonLabel(reason: PromptSourceHealthIssue["reason"]) {
  switch (reason) {
    case "archived-source":
      return "원본이 삭제 보관함에 있음";
    case "missing-source":
      return "원본 프롬프트를 찾을 수 없음";
    case "missing-source-version":
      return "원본 버전을 찾을 수 없음";
    case "missing-improved-version":
      return "개선본 버전을 찾을 수 없음";
  }
}

export const sourceHealthIssueReasons: PromptSourceHealthIssue["reason"][] = [
  "archived-source",
  "missing-source",
  "missing-source-version",
  "missing-improved-version",
];

export function summarizeSourceHealthIssueReasons(issues: PromptSourceHealthIssue[]) {
  return sourceHealthIssueReasons.map((reason) => ({
    reason,
    label: sourceHealthIssueReasonLabel(reason),
    count: issues.filter((issue) => issue.reason === reason).length,
  }));
}

export function formatSourceHealthIssueLine(
  issue: PromptSourceHealthIssue,
  baseUrl?: string,
) {
  const rawDetailHref = promptDetailLibraryHref(
    issue.prompt.id,
    issue.targetModel,
  );
  const sourceTitle = issue.sourcePrompt
    ? ` · 원본: ${issue.sourcePrompt.title}${
        issue.sourceDeletedAt ? " (삭제 보관함)" : ""
      }`
    : "";
  const detailHref =
    formatAbsoluteInternalHref(rawDetailHref, baseUrl) ?? rawDetailHref;

  return `- ${issue.prompt.title}: ${sourceHealthIssueReasonLabel(
    issue.reason,
  )}${sourceTitle} · 상세: ${detailHref}`;
}

export function sourceHealthIssueKey(issue: PromptSourceHealthIssue) {
  return `${issue.prompt.id}-${issue.reason}-${issue.targetModel ?? "all"}`;
}

export function buildDashboardSourceHealthCandidateMemo(
  issue: PromptSourceHealthIssue,
  baseUrl?: string,
) {
  const rawDetailHref = promptDetailLibraryHref(
    issue.prompt.id,
    issue.targetModel,
  );
  const detailHref =
    formatAbsoluteInternalHref(rawDetailHref, baseUrl) ?? rawDetailHref;
  const nextAction =
    issue.reason === "archived-source"
      ? "삭제 보관함의 원본 복원 필요 여부를 확인한 뒤 개선 효과를 다시 점검합니다."
      : "원본 프롬프트가 active 목록과 삭제 보관함 중 어디에도 없는지 확인하고, 백업 복원 또는 원본 재저장을 검토합니다.";

  return [
    "# 개선 출처 상태 후보 메모",
    "",
    `- 후보: ${issue.prompt.title}`,
    `- 상태: ${sourceHealthIssueReasonLabel(issue.reason)}`,
    issue.sourcePrompt
      ? `- 원본: ${issue.sourcePrompt.title}${
          issue.sourceDeletedAt ? " (삭제 보관함)" : ""
        }`
      : "- 원본: 확인 필요",
    `- 상세 링크: ${detailHref}`,
    `- 다음 조치: ${nextAction}`,
  ].join("\n");
}

export function feedbackImprovementPriorityReason(
  record: FeedbackBasedImprovementRecord,
) {
  if (record.sourceDeletedAt) {
    return "원본이 삭제 보관함에 있어 복원 또는 원본 확인을 먼저 진행해야 합니다.";
  }

  if (record.delta < 0) {
    return "개선본 점수가 원본보다 낮아 피드백 반영 방향을 재검토해야 합니다.";
  }

  if (record.delta === 0) {
    return "점수 변화가 없어 피드백이 실제 프롬프트 품질에 반영됐는지 확인해야 합니다.";
  }

  return "최근 피드백 기반 개선본입니다. 같은 피드백 유형을 재사용 규칙으로 전환할 수 있는지 확인하세요.";
}

export function improvementStatusLabel(value: number) {
  if (value > 0) {
    return "개선";
  }

  if (value < 0) {
    return "재검토";
  }

  return "유지";
}

export function reimprovementReason(record: PromptImprovementRecord) {
  if (record.delta < 0) {
    return "원본보다 품질 점수가 낮습니다.";
  }

  if (record.delta === 0) {
    return "개선폭이 아직 확인되지 않습니다.";
  }

  return "개선본 품질이 기준선보다 낮습니다.";
}

export function truncatePromptContent(content: string) {
  return content.length > 1800
    ? `${content.slice(0, 1800)}\n[Prompt excerpt truncated for dashboard re-improvement.]`
    : content;
}

export function buildDashboardReimprovementBrief(record: PromptImprovementRecord) {
  return `Role:
You are a senior prompt engineer revising a prompt that was already improved once.

Objective:
Create the next improved version of the current prompt while preserving the original intent and fixing the remaining weakness.

Context:
- Original title: ${record.sourcePrompt.title}
- Current improved title: ${record.prompt.title}
- Domain: ${record.prompt.domain || record.sourcePrompt.domain}
- Goal: ${record.prompt.goal || record.sourcePrompt.goal}
- Target AI tool: ${modelLabels[record.targetModel]}
- Improvement stage: ${record.depth}차 개선본
- Source status: ${
    record.sourceDeletedAt
      ? `Deleted archive source (deleted at ${formatTimestamp(
          record.sourceDeletedAt,
        )}). Restore/check the source before finalizing deep comparison.`
      : "Active Library source."
  }
- Source score: ${record.sourceScore.toFixed(1)}/5
- Current improved score: ${record.improvedScore.toFixed(1)}/5
- Score delta: ${formatSignedScore(record.delta)}
- Dashboard reason: ${reimprovementReason(record)}

Instructions:
- Compare the source prompt and current improved prompt before rewriting.
- Keep the parts that are clearer or more reusable than the source.
- Fix unclear instructions, weak constraints, missing output format, and model-fit issues.
- Do not invent facts, customer names, company data, or performance numbers.
- Keep Korean context and internal terms intact where nuance matters.
- Return only the copy-ready revised prompt.

Source prompt:
${truncatePromptContent(record.sourceVersion.content)}

Current improved prompt:
${truncatePromptContent(record.improvedVersion.content)}`;
}

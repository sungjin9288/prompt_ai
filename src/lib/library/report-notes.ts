import {
  modelLabels,
  type PromptAsset,
  type PromptDeletedAsset,
  type PromptVersion,
  type TargetAiHandoffReadinessItem,
} from "@/lib/prompt";
import { formatAbsoluteInternalHref } from "@/lib/navigation/href";
import type { PromptSourceHealthIssueReason } from "@/lib/analytics/prompt-improvement";
import {
  getPromptStudioSourcePersistenceMeta,
  getPromptStudioSourceVariantLabel,
  getStudioSourceFilterLabel,
  sourceReasonFilterLabels,
  sourceReasonIssueDescriptions,
  studioPersistenceFilterDescriptions,
  studioPersistenceFilterLabels,
  summarizePromptStudioSourceVariantLabels,
  type StudioPersistenceFilter,
  type StudioSourceFilter,
} from "@/lib/library/labels";
import { getSourceVersion } from "@/lib/library/prompt-metrics";
import {
  buildLibraryDefaultFilterHref,
  getPromptStudioSourceHref,
} from "@/lib/library/hrefs";

export function buildSourceReasonFilterReport({
  baseUrl,
  deletedPrompts,
  prompts,
  reason,
  resultPrompts,
  filterHref,
}: {
  baseUrl: string;
  deletedPrompts: PromptDeletedAsset[];
  prompts: PromptAsset[];
  reason: PromptSourceHealthIssueReason;
  resultPrompts: PromptAsset[];
  filterHref: string;
}) {
  const formatReportHref = (href: string) =>
    formatAbsoluteInternalHref(href, baseUrl) ?? href;
  const issueRows = resultPrompts.slice(0, 20).map((prompt, index) => {
    const sourcePromptId = prompt.improvementSource?.sourcePromptId;
    const activeSource = prompts.find((item) => item.id === sourcePromptId);
    const deletedSource = deletedPrompts.find(
      (item) => item.prompt.id === sourcePromptId,
    );
    const sourcePrompt = activeSource ?? deletedSource?.prompt;
    const sourceVersion = getSourceVersion(prompt, sourcePrompt);
    const detailHref = buildLibraryDefaultFilterHref({
      improvement: reason === "archived-source" ? "archived-source" : "unmeasured",
      sourceReason: reason,
      promptId: prompt.id,
      version: prompt.versions[0]?.targetModel,
      detailMode: "current",
    });
    const sourceStatus = activeSource
      ? "활성 Library 원본"
      : deletedSource
        ? `삭제 보관함 원본 (${new Date(
            deletedSource.deletedAt,
          ).toLocaleString("ko-KR")})`
        : "원본 없음";

    return [
      `${index + 1}. ${prompt.title}`,
      `   - 프롬프트 ID: ${prompt.id}`,
      `   - 분야/목표: ${prompt.domain} / ${prompt.goal}`,
      `   - 사유: ${sourceReasonFilterLabels[reason]}`,
      `   - 원본 제목: ${prompt.improvementSource?.sourcePromptTitle ?? "없음"}`,
      `   - 원본 상태: ${sourceStatus}`,
      `   - 원본 버전: ${
        sourceVersion ? modelLabels[sourceVersion.targetModel] : "확인 필요"
      }`,
      `   - 개선본 버전: ${prompt.versions
        .map((version) => modelLabels[version.targetModel])
        .join(", ")}`,
      `   - 상세 링크: ${formatReportHref(detailHref)}`,
    ].join("\n");
  });

  const omittedCount = Math.max(0, resultPrompts.length - issueRows.length);

  return [
    "# Library 출처 사유 조치 리포트",
    "",
    `- 필터 사유: ${sourceReasonFilterLabels[reason]}`,
    `- 현재 결과: ${resultPrompts.length}개`,
    `- Library 필터 링크: ${formatReportHref(filterHref)}`,
    `- 생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    "",
    "## 조치 기준",
    `- ${sourceReasonIssueDescriptions[reason]}`,
    "- 품질 점수 비교보다 원본 복원, 버전 연결, 백업 확인을 먼저 처리합니다.",
    "- 원본 또는 버전을 복원한 뒤 Dashboard와 Library에서 개선 효과를 다시 확인합니다.",
    "",
    "## 확인 후보",
    issueRows.length ? issueRows.join("\n\n") : "- 현재 조건에 맞는 후보가 없습니다.",
    omittedCount ? `\n\n외 ${omittedCount}개 후보는 Library 필터 링크에서 확인합니다.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSourceReasonCandidateNote({
  baseUrl,
  detailHref,
  prompt,
  reason,
  sourceStatus,
  sourceVersion,
}: {
  baseUrl: string;
  detailHref: string;
  prompt: PromptAsset;
  reason: PromptSourceHealthIssueReason;
  sourceStatus: string;
  sourceVersion?: PromptVersion;
}) {
  const formatCandidateHref = (href: string) =>
    formatAbsoluteInternalHref(href, baseUrl) ?? href;

  return [
    "# Library 출처 후보 메모",
    "",
    `- 후보: ${prompt.title}`,
    `- 프롬프트 ID: ${prompt.id}`,
    `- 분야/목표: ${prompt.domain} / ${prompt.goal}`,
    `- 사유: ${sourceReasonFilterLabels[reason]}`,
    `- 원본 제목: ${prompt.improvementSource?.sourcePromptTitle ?? "없음"}`,
    `- 원본 상태: ${sourceStatus}`,
    `- 원본 버전: ${
      sourceVersion ? modelLabels[sourceVersion.targetModel] : "확인 필요"
    }`,
    `- 개선본 버전: ${prompt.versions
      .map((version) => modelLabels[version.targetModel])
      .join(", ")}`,
    `- 상세 링크: ${formatCandidateHref(detailHref)}`,
    "",
    "## 조치 기준",
    `- ${sourceReasonIssueDescriptions[reason]}`,
    "- 품질 점수 비교보다 원본 복원, 버전 연결, 백업 확인을 먼저 처리합니다.",
    "- 복원 후 Dashboard와 Library에서 개선 효과 계산이 정상인지 다시 확인합니다.",
  ].join("\n");
}

export function buildStudioPersistenceFilterReport({
  baseUrl,
  filter,
  filterHref,
  resultPrompts,
}: {
  baseUrl: string;
  filter: Exclude<StudioPersistenceFilter, "all">;
  filterHref: string;
  resultPrompts: PromptAsset[];
}) {
  const rows = resultPrompts.slice(0, 20).map((prompt, index) => {
    const sourceMeta = prompt.studioSource
      ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
      : undefined;
    const sourceLabel = sourceMeta?.label ?? "Studio 출처 없음";
    const sourceTitle =
      prompt.studioSource?.sourceTitle ?? "저장 출처 메타 없음";
    const sourceHref = getPromptStudioSourceHref(prompt.studioSource);
    const sourceVariantLabel = getPromptStudioSourceVariantLabel(
      prompt.studioSource,
    );
    const detailHref = buildLibraryDefaultFilterHref({
      studioPersistence: filter,
      promptId: prompt.id,
      version: prompt.versions[0]?.targetModel,
      detailMode: "current",
    });

    return [
      `${index + 1}. ${prompt.title}`,
      `   - 프롬프트 ID: ${prompt.id}`,
      `   - 분야/목표: ${prompt.domain} / ${prompt.goal}`,
      `   - 저장 방식: ${sourceLabel}`,
      `   - Studio 출처: ${sourceTitle}`,
      sourceVariantLabel
        ? `   - 세부 초안 유형: ${sourceVariantLabel}`
        : undefined,
      sourceHref ? `   - 출처 링크: ${baseUrl}${sourceHref}` : undefined,
      `   - 상세 링크: ${baseUrl}${detailHref}`,
    ]
      .filter(Boolean)
      .join("\n");
  });
  const omittedCount = Math.max(0, resultPrompts.length - rows.length);
  const sourceVariantSummary =
    summarizePromptStudioSourceVariantLabels(resultPrompts);

  return [
    filter === "none"
      ? "# Library 저장 출처 메타 없음 큐 리포트"
      : "# Library Studio 저장 방식 리포트",
    "",
    `- 저장 방식: ${studioPersistenceFilterLabels[filter]}`,
    `- 현재 결과: ${resultPrompts.length}개`,
    sourceVariantSummary.length
      ? `- 세부 초안 유형: ${sourceVariantSummary.join(", ")}`
      : undefined,
    `- Library 필터 링크: ${baseUrl}${filterHref}`,
    `- 생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    "",
    "## 해석 기준",
    `- ${studioPersistenceFilterDescriptions[filter]}`,
    "- 개선 체인은 품질 비교와 재개선 판단에 사용하고, 운영 출처는 출처/복원/점검 흐름으로 분리해 관리합니다.",
    "- Studio 출처 없음 항목은 저장 출처 메타를 다시 부여할지, 레거시 저장본으로 유지할지 결정합니다.",
    "",
    "## 확인 후보",
    rows.length ? rows.join("\n\n") : "- 현재 조건에 맞는 후보가 없습니다.",
    omittedCount ? `\n\n외 ${omittedCount}개 후보는 Library 필터 링크에서 확인합니다.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildStudioPersistenceCandidateNote({
  baseUrl,
  detailHref,
  filter,
  prompt,
  sourceDescription,
  sourceLabel,
  sourceTitle,
}: {
  baseUrl: string;
  detailHref: string;
  filter: Exclude<StudioPersistenceFilter, "all">;
  prompt: PromptAsset;
  sourceDescription: string;
  sourceLabel: string;
  sourceTitle: string;
}) {
  const sourceHref = getPromptStudioSourceHref(prompt.studioSource);
  const sourceVariantLabel = getPromptStudioSourceVariantLabel(
    prompt.studioSource,
  );

  return [
    filter === "none"
      ? "# Library 저장 출처 메타 없음 후보 메모"
      : "# Library Studio 저장 방식 후보 메모",
    "",
    `- 후보: ${prompt.title}`,
    `- 프롬프트 ID: ${prompt.id}`,
    `- 분야/목표: ${prompt.domain} / ${prompt.goal}`,
    `- 필터 저장 방식: ${studioPersistenceFilterLabels[filter]}`,
    `- 현재 저장 방식: ${sourceLabel}`,
    `- Studio 출처: ${sourceTitle}`,
    sourceVariantLabel ? `- 세부 초안 유형: ${sourceVariantLabel}` : undefined,
    sourceHref ? `- 출처 링크: ${baseUrl}${sourceHref}` : undefined,
    `- 상세 링크: ${baseUrl}${detailHref}`,
    "",
    "## 해석 기준",
    `- ${sourceDescription}`,
    "- 개선 체인은 품질 비교와 재개선 판단에 사용하고, 운영 출처는 출처/복원/점검 흐름으로 분리해 관리합니다.",
    "- Studio 출처 없음 항목은 저장 출처 메타를 다시 부여할지, 레거시 저장본으로 유지할지 결정합니다.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildStudioOperationalGroupReport({
  baseUrl,
  filterHref,
  persistenceFilter,
  resultPrompts,
  sourceFilter,
}: {
  baseUrl: string;
  filterHref: string;
  persistenceFilter: Exclude<StudioPersistenceFilter, "all">;
  resultPrompts: PromptAsset[];
  sourceFilter: Exclude<StudioSourceFilter, "all">;
}) {
  const rows = resultPrompts.slice(0, 20).map((prompt, index) => {
    const sourceMeta = prompt.studioSource
      ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
      : undefined;
    const sourceTitle = prompt.studioSource?.sourceTitle ?? "출처 제목 없음";
    const sourceHref = getPromptStudioSourceHref(prompt.studioSource);
    const sourceVariantLabel = getPromptStudioSourceVariantLabel(
      prompt.studioSource,
    );
    const detailHref = buildLibraryDefaultFilterHref({
      studioPersistence: persistenceFilter,
      studioSource: sourceFilter,
      promptId: prompt.id,
      version: prompt.versions[0]?.targetModel,
      detailMode: "current",
    });

    return [
      `${index + 1}. ${prompt.title}`,
      `   - 프롬프트 ID: ${prompt.id}`,
      `   - 분야/목표: ${prompt.domain} / ${prompt.goal}`,
      `   - 저장 방식: ${sourceMeta?.label ?? "Studio 출처 없음"}`,
      `   - Studio 저장 출처: ${getStudioSourceFilterLabel(sourceFilter)}`,
      sourceVariantLabel
        ? `   - 세부 초안 유형: ${sourceVariantLabel}`
        : undefined,
      `   - Studio 출처 제목: ${sourceTitle}`,
      sourceHref ? `   - 출처 링크: ${baseUrl}${sourceHref}` : undefined,
      `   - 상세 링크: ${baseUrl}${detailHref}`,
    ]
      .filter(Boolean)
      .join("\n");
  });
  const omittedCount = Math.max(0, resultPrompts.length - rows.length);
  const sourceVariantSummary =
    summarizePromptStudioSourceVariantLabels(resultPrompts);

  return [
    "# Library Studio 운영 묶음 리포트",
    "",
    `- 저장 방식: ${studioPersistenceFilterLabels[persistenceFilter]}`,
    `- 저장 출처: ${getStudioSourceFilterLabel(sourceFilter)}`,
    `- 현재 결과: ${resultPrompts.length}개`,
    sourceVariantSummary.length
      ? `- 세부 초안 유형: ${sourceVariantSummary.join(", ")}`
      : undefined,
    `- Library 필터 링크: ${baseUrl}${filterHref}`,
    `- 생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    "",
    "## 점검 기준",
    `- ${studioPersistenceFilterDescriptions[persistenceFilter]}`,
    "- 같은 저장 출처와 같은 저장 방식이 함께 적용된 결과만 운영 묶음으로 검토합니다.",
    "- 후보별 출처 제목, 출처 링크, 상세 링크를 확인해 이 묶음을 유지할지 재분류할지 결정합니다.",
    "",
    "## 확인 후보",
    rows.length ? rows.join("\n\n") : "- 현재 조건에 맞는 후보가 없습니다.",
    omittedCount ? `\n\n외 ${omittedCount}개 후보는 Library 필터 링크에서 확인합니다.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildStudioSourceFilterReport({
  baseUrl,
  filter,
  filterHref,
  resultPrompts,
}: {
  baseUrl: string;
  filter: Exclude<StudioSourceFilter, "all">;
  filterHref: string;
  resultPrompts: PromptAsset[];
}) {
  const rows = resultPrompts.slice(0, 20).map((prompt, index) => {
    const sourceMeta = prompt.studioSource
      ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
      : undefined;
    const sourceHref = getPromptStudioSourceHref(prompt.studioSource);
    const sourceVariantLabel = getPromptStudioSourceVariantLabel(
      prompt.studioSource,
    );
    const detailHref = buildLibraryDefaultFilterHref({
      studioSource: filter,
      promptId: prompt.id,
      version: prompt.versions[0]?.targetModel,
      detailMode: "current",
    });

    return [
      `${index + 1}. ${prompt.title}`,
      `   - 프롬프트 ID: ${prompt.id}`,
      `   - 분야/목표: ${prompt.domain} / ${prompt.goal}`,
      `   - Studio 저장 출처: ${getStudioSourceFilterLabel(filter)}`,
      sourceVariantLabel
        ? `   - 세부 초안 유형: ${sourceVariantLabel}`
        : undefined,
      `   - 저장 방식: ${sourceMeta?.label ?? "Studio 출처 없음"}`,
      `   - Studio 출처 제목: ${
        prompt.studioSource?.sourceTitle ?? "출처 제목 없음"
      }`,
      sourceHref ? `   - 출처 링크: ${baseUrl}${sourceHref}` : undefined,
      `   - 상세 링크: ${baseUrl}${detailHref}`,
    ]
      .filter(Boolean)
      .join("\n");
  });
  const omittedCount = Math.max(0, resultPrompts.length - rows.length);
  const sourceVariantSummary =
    summarizePromptStudioSourceVariantLabels(resultPrompts);

  return [
    "# Library Studio 저장 출처 리포트",
    "",
    `- 저장 출처: ${getStudioSourceFilterLabel(filter)}`,
    `- 현재 결과: ${resultPrompts.length}개`,
    sourceVariantSummary.length
      ? `- 세부 초안 유형: ${sourceVariantSummary.join(", ")}`
      : undefined,
    `- Library 필터 링크: ${baseUrl}${filterHref}`,
    `- 생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    "",
    "## 점검 기준",
    "- 같은 저장 출처에서 저장된 프롬프트가 실제 운영 목적과 맞는지 확인합니다.",
    "- 개선 체인으로 관리해야 할 항목이 운영 출처로만 저장됐는지 분리합니다.",
    "- 출처 링크가 끊겼거나 제목이 모호한 항목은 후보 메모로 세부 복원 기준을 정리합니다.",
    "",
    "## 확인 후보",
    rows.length ? rows.join("\n\n") : "- 현재 조건에 맞는 후보가 없습니다.",
    omittedCount ? `\n\n외 ${omittedCount}개 후보는 Library 필터 링크에서 확인합니다.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildStudioSourceCandidateNote({
  baseUrl,
  detailHref,
  filter,
  prompt,
  sourceLabel,
  sourceTitle,
}: {
  baseUrl: string;
  detailHref: string;
  filter: Exclude<StudioSourceFilter, "all">;
  prompt: PromptAsset;
  sourceLabel: string;
  sourceTitle: string;
}) {
  const sourceHref = getPromptStudioSourceHref(prompt.studioSource);
  const sourceMeta = prompt.studioSource
    ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
    : undefined;
  const sourceVariantLabel = getPromptStudioSourceVariantLabel(
    prompt.studioSource,
  );

  return [
    "# Library Studio 저장 출처 후보 메모",
    "",
    `- 후보: ${prompt.title}`,
    `- 프롬프트 ID: ${prompt.id}`,
    `- 분야/목표: ${prompt.domain} / ${prompt.goal}`,
    `- 필터 저장 출처: ${getStudioSourceFilterLabel(filter)}`,
    `- 현재 저장 출처: ${sourceLabel}`,
    sourceVariantLabel ? `- 세부 초안 유형: ${sourceVariantLabel}` : undefined,
    `- 저장 방식: ${sourceMeta?.label ?? "Studio 출처 없음"}`,
    `- Studio 출처 제목: ${sourceTitle}`,
    sourceHref ? `- 출처 링크: ${baseUrl}${sourceHref}` : undefined,
    `- 상세 링크: ${baseUrl}${detailHref}`,
    "",
    "## 점검 기준",
    "- 이 저장본이 해당 기능 흐름에서 만들어진 것이 맞는지 확인합니다.",
    "- 개선 체인으로 연결해야 하는 항목이면 Library 개선 브리프 흐름으로 다시 저장합니다.",
    "- 운영 출처로 유지할 항목은 sourceTitle/sourceHref가 재방문 가능한지 확인합니다.",
  ]
    .filter(Boolean)
    .join("\n");
}

export type SelectedOperationalSummary = {
  actionKind: "comparison" | "handoff-improve" | "package" | "source-detail";
  actionLabel: string;
  chainDescription: string;
  chainLabel: string;
  groupActionHref?: string;
  groupActionLabel?: string;
  handoffStatusDescription: string;
  handoffStatusLabel: string;
  nextAction: string;
  nextActionDescription: string;
  persistenceActionHref?: string;
  persistenceActionLabel?: string;
  persistenceLabel: string;
  sourceActionHref?: string;
  sourceActionLabel?: string;
  sourceLabel: string;
  sourceOriginalActionLabel?: string;
  sourceOriginalHref?: string;
  sourceTitle?: string;
  sourceVariantLabel?: string;
};

export function buildSelectedOperationalSummaryReport({
  baseUrl,
  detailHref,
  prompt,
  readinessItems,
  summary,
  version,
}: {
  baseUrl: string;
  detailHref: string;
  prompt: PromptAsset;
  readinessItems: TargetAiHandoffReadinessItem[];
  summary: SelectedOperationalSummary;
  version: PromptVersion;
}) {
  const actionLinks = [
    summary.groupActionHref && summary.groupActionLabel
      ? `- ${summary.groupActionLabel}: ${baseUrl}${summary.groupActionHref}`
      : undefined,
    summary.sourceActionHref && summary.sourceActionLabel
      ? `- ${summary.sourceActionLabel}: ${baseUrl}${summary.sourceActionHref}`
      : undefined,
    summary.sourceOriginalHref && summary.sourceOriginalActionLabel
      ? `- ${summary.sourceOriginalActionLabel}: ${baseUrl}${summary.sourceOriginalHref}`
      : undefined,
    summary.persistenceActionHref && summary.persistenceActionLabel
      ? `- ${summary.persistenceActionLabel}: ${baseUrl}${summary.persistenceActionHref}`
      : undefined,
  ].filter(Boolean);
  const readinessRows = readinessItems.map(
    (item) => `- [${item.status}] ${item.label}: ${item.detail}`,
  );

  return [
    `# Library 운영 요약 · ${prompt.title}`,
    "",
    `- 프롬프트 ID: ${prompt.id}`,
    `- 버전: ${modelLabels[version.targetModel]}`,
    `- 분야/목표: ${prompt.domain} / ${prompt.goal}`,
    `- 상세 링크: ${baseUrl}${detailHref}`,
    `- 생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    "",
    "## 운영 상태",
    `- 다음 액션: ${summary.nextAction}`,
    `- CTA: ${summary.actionLabel}`,
    `- AI 전달 상태: ${summary.handoffStatusLabel}`,
    `- 저장 방식: ${summary.persistenceLabel}`,
    `- 출처: ${summary.sourceLabel}`,
    summary.sourceVariantLabel
      ? `- 세부 초안 유형: ${summary.sourceVariantLabel}`
      : undefined,
    summary.sourceTitle ? `- 출처 제목: ${summary.sourceTitle}` : undefined,
    summary.sourceOriginalHref
      ? `- 원본 경로: ${baseUrl}${summary.sourceOriginalHref}`
      : undefined,
    `- 체인: ${summary.chainLabel}`,
    "",
    "## 판단 근거",
    `- ${summary.nextActionDescription}`,
    `- ${summary.handoffStatusDescription}`,
    `- ${summary.chainDescription}`,
    "",
    "## 조건 링크",
    actionLinks.length ? actionLinks.join("\n") : "- 연결된 조건 링크 없음",
    "",
    "## AI 전달 readiness",
    readinessRows.length ? readinessRows.join("\n") : "- readiness 항목 없음",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildNoSourceMetaNote({
  baseUrl,
  detailHref,
  prompt,
  sourceDescription,
  sourceLabel,
  version,
}: {
  baseUrl: string;
  detailHref: string;
  prompt: PromptAsset;
  sourceDescription: string;
  sourceLabel: string;
  version?: PromptVersion;
}) {
  return [
    "# Library 저장 출처 메타 없음 점검 메모",
    "",
    `- 프롬프트: ${prompt.title}`,
    `- 프롬프트 ID: ${prompt.id}`,
    `- 분야/목표: ${prompt.domain} / ${prompt.goal}`,
    `- 저장 방식: ${sourceLabel}`,
    `- 저장 방식 설명: ${sourceDescription}`,
    `- 현재 버전: ${version ? modelLabels[version.targetModel] : "확인 필요"}`,
    `- 품질 점수: ${version ? version.qualityScore.toFixed(1) : "확인 필요"}`,
    `- 상세 링크: ${baseUrl}${detailHref}`,
    "",
    "## 점검 기준",
    "- 직접 작성하거나 가져온 저장본이면 Studio 출처 없음으로 유지합니다.",
    "- Dashboard, Learning, Library, Skills 조치에서 만든 결과라면 Studio 저장 출처가 있는 초안 흐름으로 다시 저장합니다.",
    "- 같은 저장 방식 필터에서 비슷한 항목을 함께 검토합니다.",
  ].join("\n");
}

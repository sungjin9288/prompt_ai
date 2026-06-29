import type { StudioDraft } from "@/lib/studio/draft";
import {
  isStudioDraftSourceVariantReady,
  type StudioDraftSourceVariant,
} from "@/lib/studio/draft-variants";
import {
  getPromptStudioSourceStudioLabel,
  type PromptStudioSourceStudioLabel,
} from "@/lib/studio/source-registry";

type StudioDraftDisplaySource = Pick<
  StudioDraft,
  "source" | "sourceFeedback" | "sourceTitle" | "sourceVariant"
>;

const studioDraftVariantDisplayLabels = {
  "dashboard-next-action-queue-verification": {
    label: "Dashboard 다음 실행 큐 완료 확인",
    nextAction:
      "완료된 개인화와 Learning 액션의 증거, Studio 재생성 확인, 저장 기준을 검증 계획으로 정리하세요.",
    sourceActionLabel: "Dashboard로 돌아가기",
  },
  "feedback-improvement": {
    label: "Library 피드백 개선 브리프",
    nextAction:
      "선택한 저장 프롬프트와 사용자 피드백을 반영해 다음 버전으로 재작성하세요.",
    sourceActionLabel: "Library 피드백 보기",
  },
  "handoff-improvement": {
    label: "AI 전달 보강 브리프",
    nextAction:
      "전달 전 체크 결과를 반영해 외부 AI에 바로 보낼 수 있는 다음 버전으로 재작성하세요.",
    sourceActionLabel: "Library 원본 보기",
  },
  "learning-low-confidence-validation": {
    label: "Learning 저신뢰도 피드백 검증",
    nextAction:
      "낮은 신뢰도 피드백 규칙의 근거, 충돌, scope를 검증한 뒤 저장 후보를 정리하세요.",
    sourceActionLabel: "Learning 저신뢰도 큐 보기",
  },
} satisfies Record<StudioDraftSourceVariant, PromptStudioSourceStudioLabel>;

export function getStudioDraftDisplaySourceLabel(
  draft: StudioDraftDisplaySource,
): PromptStudioSourceStudioLabel {
  if (
    draft.sourceVariant &&
    isStudioDraftSourceVariantReady({
      source: draft.source,
      sourceFeedbackAvailable: Boolean(draft.sourceFeedback),
      sourceVariant: draft.sourceVariant,
    })
  ) {
    return studioDraftVariantDisplayLabels[draft.sourceVariant];
  }

  return getPromptStudioSourceStudioLabel(draft.source);
}

export function buildStudioDraftLoadedNotice(
  draft: StudioDraftDisplaySource,
) {
  const sourceLabel = getStudioDraftDisplaySourceLabel(draft).label;
  const titleLabel =
    draft.sourceTitle && draft.sourceTitle !== sourceLabel
      ? ` · ${draft.sourceTitle}`
      : "";

  return `${sourceLabel}${titleLabel} 초안을 불러왔습니다.`;
}

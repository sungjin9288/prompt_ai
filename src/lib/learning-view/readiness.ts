import type { LearningMemory, MemoryScope } from "@/lib/prompt";
import { getLatestMemoryDate, trackedScopes } from "./labels";

export function getLearningReadiness(memories: LearningMemory[]) {
  const scopeCounts = trackedScopes.reduce(
    (result, scope) => ({
      ...result,
      [scope]: memories.filter((memory) => memory.scope === scope).length,
    }),
    {} as Record<MemoryScope, number>,
  );
  const coveredScopes = trackedScopes.filter((scope) => scopeCounts[scope] > 0);
  const missingScopes = trackedScopes.filter((scope) => scopeCounts[scope] === 0);
  const averageConfidence =
    memories.length === 0
      ? 0
      : memories.reduce((sum, memory) => sum + memory.confidence, 0) /
        memories.length;
  const lowConfidenceCount = memories.filter(
    (memory) => memory.confidence < 0.5,
  ).length;
  const highConfidenceCount = memories.filter(
    (memory) => memory.confidence >= 0.75,
  ).length;
  const score = Math.round(
    Math.min(
      100,
      memories.length * 8 +
        coveredScopes.length * 14 +
        averageConfidence * 28 -
        lowConfidenceCount * 4,
    ),
  );

  let label = "학습 시작 필요";
  let description =
    "아직 생성에 반영할 학습 메모리가 충분하지 않습니다.";
  let tone = "border-danger/40 text-danger";

  if (score >= 75 && coveredScopes.length >= 3) {
    label = "운영 준비 양호";
    description =
      "대부분의 핵심 scope에 생성 기준이 쌓여 있어 Studio 반영 품질을 확인할 수 있습니다.";
    tone = "border-success/50 text-success";
  } else if (score >= 45 || coveredScopes.length >= 2) {
    label = "학습 확장 중";
    description =
      "일부 scope는 준비됐지만 반복 사용을 위해 추가 피드백과 기준 보강이 필요합니다.";
    tone = "border-attention/50 text-attention";
  } else if (memories.length > 0) {
    label = "보강 필요";
    description =
      "학습 메모리는 있지만 scope 커버리지나 신뢰도가 아직 낮습니다.";
    tone = "border-attention/50 text-attention";
  }

  const actions = [
    memories.length === 0
      ? "Library에서 실제 생성 결과에 피드백을 남겨 첫 학습 메모리를 만듭니다."
      : "",
    missingScopes.includes("company")
      ? "회사 기준 화면에서 브랜드 톤, 제품, 고객군을 저장합니다."
      : "",
    missingScopes.includes("user")
      ? "사용자 선호가 드러나는 피드백을 tone 또는 other 유형으로 남깁니다."
      : "",
    missingScopes.includes("domain")
      ? "분야별 정확성/맥락 피드백을 남겨 domain 기준을 늘립니다."
      : "",
    missingScopes.includes("skill")
      ? "반복 업무의 출력 형식 피드백을 남겨 skill 패턴을 만듭니다."
      : "",
    lowConfidenceCount > 0
      ? "낮은 신뢰도 메모리는 같은 기준의 추가 피드백으로 보강합니다."
      : "",
  ].filter(Boolean);

  return {
    actions: actions.length
      ? actions.slice(0, 4)
      : ["Studio에서 새 프롬프트를 생성하고 결과 품질을 비교합니다."],
    averageConfidence,
    coveredScopes,
    highConfidenceCount,
    label,
    latestMemoryDate: getLatestMemoryDate(memories),
    lowConfidenceCount,
    missingScopes,
    score,
    scopeCounts,
    tone,
    description,
  };
}

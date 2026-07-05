export const planLabels = {
  free: "Free",
  pro: "Pro",
} as const;

export const proPlanStatusLabel = "준비 중";

export const proFeatureLabels = {
  "openai-enhancement": "OpenAI 기반 고급 개선·Refine",
  "cloud-sync": "기기 간 클라우드 동기화",
} as const;

export const freeFeatureLabels = [
  "로컬 생성 엔진 무제한 사용",
  "라이브러리, 버전 관리, 학습 루프 전체 기능",
  "Chrome 확장 in-page 개선",
  "모든 데이터 브라우저 로컬 보관",
] as const;

export const proFeatureListLabels = [
  proFeatureLabels["openai-enhancement"],
  proFeatureLabels["cloud-sync"],
  "우선 지원",
] as const;

export const proChipLabel = `${planLabels.pro} ${proPlanStatusLabel}`;

export const proChipDescription =
  "OpenAI 기반 고급 개선은 준비 중입니다. 지금은 로컬 생성 엔진으로 계속 이용할 수 있어요.";

export const pricingHref = "/pricing";

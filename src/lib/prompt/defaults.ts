import type {
  CompanyProfile,
  PromptLanguageStrategy,
  PromptOutputLanguage,
  TargetModel,
  UserProfile,
} from "./types";

export const modelLabels: Record<TargetModel, string> = {
  general: "범용",
  gpt: "GPT",
  claude: "Claude",
  codex: "Codex",
  gemini: "Gemini",
};

export const targetModels: TargetModel[] = [
  "general",
  "gpt",
  "claude",
  "codex",
  "gemini",
];

export const languageStrategies: PromptLanguageStrategy[] = ["hybrid", "english"];

export const languageStrategyLabels: Record<PromptLanguageStrategy, string> = {
  hybrid: "한영 하이브리드",
  english: "전체 영어 지시문",
};

export const outputLanguages: PromptOutputLanguage[] = [
  "korean",
  "english",
  "same_as_input",
];

export const outputLanguageLabels: Record<PromptOutputLanguage, string> = {
  korean: "한국어",
  english: "영어",
  same_as_input: "입력 언어와 동일",
};

export const defaultUserProfile: UserProfile = {
  id: "default-user",
  role: "창업자 / 기획자 / AI 제품 개발자",
  industries: ["AI SaaS", "프롬프트 엔지니어링", "업무 자동화"],
  goals: [
    "아이디어를 실행 가능한 기획과 개발 태스크로 전환",
    "개인화된 AI 업무 시스템 구축",
    "회사별 프롬프트 운영 구조 설계",
  ],
  preferredTone: "직접적이고 실무 중심이며 과장 없이 명확한 톤",
  preferredOutputs: ["PRD", "체크리스트", "개발 태스크", "표", "실행 계획"],
  avoidPhrases: ["근거 없는 수치", "과장된 마케팅 표현", "모호한 조언"],
  repeatedTasks: [
    "MVP 기획",
    "Codex 개발 프롬프트 작성",
    "시장/경쟁 제품 리서치",
  ],
};

export const defaultCompanyProfile: CompanyProfile = {
  id: "default-company",
  companyName: "",
  description: "",
  products: [],
  customers: [],
  brandTone: "전문적이고 신뢰감 있게, 단 검증되지 않은 표현은 피한다",
  internalTerms: [],
  bannedPhrases: [],
  documentFormats: ["배경", "문제", "해결안", "실행 계획", "리스크", "검증 기준"],
};

export const defaultDomains = [
  "기획",
  "개발",
  "마케팅",
  "IR/투자",
  "콘텐츠",
  "리서치",
  "세일즈",
  "운영",
  "법률/규정",
  "교육",
];

export const defaultGoals = [
  "전문 프롬프트로 변환",
  "프롬프트 개선",
  "기획 문서 작성",
  "개발 태스크 생성",
  "보고서 구조화",
  "콘텐츠 초안 작성",
  "리서치 질문 설계",
  "비교/평가 기준 생성",
];

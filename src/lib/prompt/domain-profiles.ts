import type { DomainProfile } from "./types";

const sharedRiskNotes = [
  "검증되지 않은 사실이나 수치는 임의로 만들지 않는다.",
  "부족한 정보는 질문하거나 가정으로 명시한다.",
];

export const domainProfiles: Record<string, DomainProfile> = {
  기획: {
    id: "planning",
    name: "기획",
    description: "아이디어를 사용자 문제, 기능, 우선순위, 실행 계획으로 구조화",
    promptRules: [
      "목표 사용자와 해결할 문제를 먼저 분리한다.",
      "MVP 범위와 나중에 미룰 범위를 명확히 나눈다.",
      "성공 기준과 검증 방법을 포함한다.",
    ],
    outputFormats: ["PRD", "사용자 흐름", "우선순위 표", "개발 로드맵"],
    qualityChecklist: [
      "문제 정의가 구체적인가",
      "첫 버전 범위가 실행 가능한가",
      "검증 기준이 있는가",
    ],
    riskNotes: sharedRiskNotes,
  },
  개발: {
    id: "development",
    name: "개발",
    description: "코드베이스 분석, 구현 범위, 테스트, 검증 절차로 변환",
    promptRules: [
      "먼저 기존 코드 구조와 패턴을 읽도록 지시한다.",
      "수정 범위와 제외 범위를 구분한다.",
      "구현 후 테스트, 린트, 빌드 검증을 요구한다.",
    ],
    outputFormats: ["파일별 변경 계획", "구현 태스크", "테스트 체크리스트"],
    qualityChecklist: [
      "기존 패턴 재사용을 요구하는가",
      "변경 파일과 검증 조건이 분명한가",
      "불필요한 리팩터링을 막는가",
    ],
    riskNotes: sharedRiskNotes,
  },
  마케팅: {
    id: "marketing",
    name: "마케팅",
    description: "타깃, 메시지, 채널, CTA, KPI 중심의 마케팅 작업 구조화",
    promptRules: [
      "타깃 고객과 구매 맥락을 먼저 정의한다.",
      "채널별 메시지와 CTA를 분리한다.",
      "과장 표현과 검증되지 않은 성과 주장을 피한다.",
    ],
    outputFormats: ["캠페인 브리프", "카피 변형", "콘텐츠 캘린더", "KPI 표"],
    qualityChecklist: [
      "타깃과 메시지가 연결되는가",
      "CTA가 명확한가",
      "브랜드 톤을 지키는가",
    ],
    riskNotes: sharedRiskNotes,
  },
  "IR/투자": {
    id: "ir",
    name: "IR/투자",
    description: "투자자 관점에서 문제, 시장, 솔루션, 수익 모델을 정리",
    promptRules: [
      "문제와 시장 기회를 분리한다.",
      "근거 없는 TAM/SAM/SOM 수치를 만들지 않는다.",
      "투자자가 물어볼 리스크와 답변 전략을 포함한다.",
    ],
    outputFormats: ["엘리베이터 피치", "IR 목차", "예상 Q&A", "리스크 표"],
    qualityChecklist: [
      "투자자 관점의 질문을 포함하는가",
      "수익 모델과 실행 전략이 있는가",
      "과장을 피하는가",
    ],
    riskNotes: sharedRiskNotes,
  },
  콘텐츠: {
    id: "content",
    name: "콘텐츠",
    description: "독자, 목적, 구조, 톤, SEO 기준을 반영한 글쓰기",
    promptRules: [
      "독자 수준과 읽는 목적을 명시한다.",
      "글의 구조와 금지 표현을 지정한다.",
      "SEO가 필요한 경우 키워드와 검색 의도를 분리한다.",
    ],
    outputFormats: ["아웃라인", "초안", "리라이팅", "제목 후보", "SEO 체크리스트"],
    qualityChecklist: [
      "독자에게 맞는 언어인가",
      "문단 구조가 자연스러운가",
      "핵심 메시지가 반복 없이 명확한가",
    ],
    riskNotes: sharedRiskNotes,
  },
  리서치: {
    id: "research",
    name: "리서치",
    description: "질문 분해, 조사 범위, 비교 기준, 근거 정리를 설계",
    promptRules: [
      "먼저 하위 질문으로 쪼갠다.",
      "출처가 필요한 주장과 추론을 구분한다.",
      "비교 기준을 표로 정리한다.",
    ],
    outputFormats: ["리서치 계획", "비교표", "근거 목록", "가정/불확실성"],
    qualityChecklist: [
      "질문이 충분히 분해되었는가",
      "출처와 추론이 구분되는가",
      "결론 기준이 명확한가",
    ],
    riskNotes: sharedRiskNotes,
  },
};

export function getDomainProfile(domain: string): DomainProfile {
  return (
    domainProfiles[domain] ?? {
      id: "general-domain",
      name: domain || "범용",
      description: "일반 업무 요청을 목적, 맥락, 출력 형식 중심으로 구조화",
      promptRules: [
        "작업 목적을 명확히 한다.",
        "필요한 맥락과 제약 조건을 포함한다.",
        "출력 형식을 구체적으로 지정한다.",
      ],
      outputFormats: ["요약", "체크리스트", "실행 계획", "표"],
      qualityChecklist: [
        "무엇을 해야 하는지 명확한가",
        "결과물 형식이 있는가",
        "불확실성 처리 기준이 있는가",
      ],
      riskNotes: sharedRiskNotes,
    }
  );
}

import {
  promptStudioDraftSources,
  type PromptStudioDraftSource,
} from "@/lib/prompt";

interface PromptStudioSourceRegistryItem {
  dashboardLabel: string;
  dashboardDescription: string;
  dashboardNextAction: string;
  libraryFilterLabel: string;
  librarySourceLabel: string;
  sourceActionLabel: string;
  studioLabel: string;
  studioNextAction: string;
}

export interface PromptStudioSourceDashboardSummary {
  label: string;
  description: string;
  nextAction: string;
}

export interface PromptStudioSourceLibraryLabel {
  label: string;
  actionLabel: string;
}

export interface PromptStudioSourceStudioLabel {
  label: string;
  nextAction: string;
  sourceActionLabel: string;
}

const promptStudioSourceRegistry = {
  "dashboard-personalization-action": {
    dashboardLabel: "Dashboard 개인화 조치",
    dashboardDescription: "개인화 보강 액션에서 저장됨",
    dashboardNextAction: "프로필/회사 기준 보강 결과 확인",
    libraryFilterLabel: "Dashboard 개인화 조치",
    librarySourceLabel: "Dashboard 개인화 보강 조치",
    sourceActionLabel: "Dashboard로 돌아가기",
    studioLabel: "Dashboard 개인화 보강 조치",
    studioNextAction:
      "프로필, 회사 기준, Learning 메모리 중 선택 조치를 실행 계획으로 바꾸세요.",
  },
  "dashboard-personalization": {
    dashboardLabel: "Dashboard 개인화 리포트",
    dashboardDescription: "개인/회사 기준 리포트에서 저장됨",
    dashboardNextAction: "개인화 기준이 반영된 저장본 확인",
    libraryFilterLabel: "Dashboard 개인화 리포트",
    librarySourceLabel: "Dashboard 개인화 기준 리포트",
    sourceActionLabel: "Dashboard로 돌아가기",
    studioLabel: "Dashboard 개인화 기준 리포트",
    studioNextAction: "개인/회사 기준과 학습 scope를 점검하고 다음 보강 순서를 정하세요.",
  },
  "dashboard-next-action-queue": {
    dashboardLabel: "Dashboard 다음 실행 큐",
    dashboardDescription: "개인화와 Learning 통합 우선순위 큐에서 저장됨",
    dashboardNextAction: "큐 실행 결과를 Studio 생성 품질 변화로 확인",
    libraryFilterLabel: "Dashboard 다음 실행 큐",
    librarySourceLabel: "Dashboard 다음 실행 큐",
    sourceActionLabel: "Dashboard로 돌아가기",
    studioLabel: "Dashboard 다음 실행 큐",
    studioNextAction:
      "개인화와 Learning 액션을 한 번에 정리하고 실행 순서, 담당 화면, 검증 기준을 만드세요.",
  },
  "dashboard-learning-action": {
    dashboardLabel: "Dashboard Learning 조치",
    dashboardDescription: "학습 컨텍스트 보강 조치에서 저장됨",
    dashboardNextAction: "학습 scope 보강 결과를 Library에서 확인",
    libraryFilterLabel: "Dashboard Learning 조치",
    librarySourceLabel: "Dashboard Learning 권장 조치",
    sourceActionLabel: "Dashboard로 돌아가기",
    studioLabel: "Dashboard Learning 권장 조치",
    studioNextAction:
      "낮은 신뢰도, 빈 scope, 미기록 학습 메타를 정리하는 실행 계획을 만드세요.",
  },
  "dashboard-learning-ops": {
    dashboardLabel: "Dashboard Learning 운영",
    dashboardDescription: "학습 운영 리포트에서 저장됨",
    dashboardNextAction: "메모리 운영 기준으로 재사용할 저장본 확인",
    libraryFilterLabel: "Dashboard Learning 운영",
    librarySourceLabel: "Dashboard Learning 운영 리포트",
    sourceActionLabel: "Dashboard로 돌아가기",
    studioLabel: "Dashboard Learning 운영 리포트",
    studioNextAction: "학습 메모리 운영 상태를 점검하고 정리/보강 체크리스트를 만드세요.",
  },
  "dashboard-source-health-action": {
    dashboardLabel: "Dashboard 출처 조치",
    dashboardDescription: "개선 출처 상태 조치에서 저장됨",
    dashboardNextAction: "복원/연결 조치가 필요한 저장본 확인",
    libraryFilterLabel: "Dashboard 출처 조치",
    librarySourceLabel: "Dashboard 개선 출처 상태 조치",
    sourceActionLabel: "Dashboard로 돌아가기",
    studioLabel: "Dashboard 개선 출처 상태 조치",
    studioNextAction:
      "보관함 원본과 측정 불가 개선본의 복원/원본 연결 확인 순서를 정리하세요.",
  },
  "dashboard-source-health-candidate": {
    dashboardLabel: "Dashboard 출처 후보",
    dashboardDescription: "출처 상태 후보 메모에서 저장됨",
    dashboardNextAction: "선택 후보의 원본 연결 상태 확인",
    libraryFilterLabel: "Dashboard 출처 후보",
    librarySourceLabel: "Dashboard 개선 출처 후보",
    sourceActionLabel: "Library 후보 보기",
    studioLabel: "Dashboard 개선 출처 후보",
    studioNextAction: "선택한 후보의 복원/원본 연결 확인 절차만 짧게 정리하세요.",
  },
  "dashboard-feedback-improvement-ops": {
    dashboardLabel: "Dashboard 피드백 개선",
    dashboardDescription: "피드백 기반 개선 운영 리포트에서 저장됨",
    dashboardNextAction: "반복 피드백 규칙으로 남길 항목을 확인",
    libraryFilterLabel: "Dashboard 피드백 개선",
    librarySourceLabel: "Dashboard 피드백 반영 개선 리포트",
    sourceActionLabel: "Dashboard로 돌아가기",
    studioLabel: "Dashboard 피드백 반영 개선 리포트",
    studioNextAction:
      "피드백 기반 개선본을 점검하고 반복 피드백을 재사용 가능한 품질 규칙으로 정리하세요.",
  },
  "dashboard-skill-ops": {
    dashboardLabel: "Dashboard 스킬 운영",
    dashboardDescription: "스킬 운영 리포트에서 저장됨",
    dashboardNextAction: "스킬 템플릿으로 전환할 후보 확인",
    libraryFilterLabel: "Dashboard 스킬 운영",
    librarySourceLabel: "Dashboard 스킬 운영 리포트",
    sourceActionLabel: "Dashboard로 돌아가기",
    studioLabel: "Dashboard 스킬 운영 리포트",
    studioNextAction: "스킬 실행 성과를 점검하고 개선 우선순위와 템플릿 보강 계획을 만드세요.",
  },
  "dashboard-studio-source-ops": {
    dashboardLabel: "Dashboard 저장 출처 운영",
    dashboardDescription: "Studio 저장 출처 운영 리포트에서 저장됨",
    dashboardNextAction: "출처별 저장 흐름과 재정리 기준 확인",
    libraryFilterLabel: "Dashboard 저장 출처 운영",
    librarySourceLabel: "Dashboard Studio 저장 출처 운영",
    sourceActionLabel: "Dashboard로 돌아가기",
    studioLabel: "Dashboard Studio 저장 출처 운영",
    studioNextAction:
      "Studio 저장 출처별 저장본을 점검하고 출처 없음 재정리, 개선 체인 전환, 운영 출처 유지 기준을 정리하세요.",
  },
  "profile-context-application": {
    dashboardLabel: "Profile 기준 적용",
    dashboardDescription: "개인 프로필 적용 프리뷰에서 저장됨",
    dashboardNextAction: "개인화 기준이 생성 프롬프트에 반영됐는지 확인",
    libraryFilterLabel: "Profile 기준 적용",
    librarySourceLabel: "Profile 개인화 기준 적용 프리뷰",
    sourceActionLabel: "Profile로 돌아가기",
    studioLabel: "Profile 개인화 기준 적용 프리뷰",
    studioNextAction:
      "사용자 역할, 산업, 목표, 톤, 출력 형식을 실제 GPT/Claude/Codex/Gemini 지시문에 반영하는 기준을 정리하세요.",
  },
  "company-context-application": {
    dashboardLabel: "Company 기준 적용",
    dashboardDescription: "회사 기준 적용 프리뷰에서 저장됨",
    dashboardNextAction: "회사 기준이 생성 프롬프트에 반영됐는지 확인",
    libraryFilterLabel: "Company 기준 적용",
    librarySourceLabel: "Company 회사 기준 적용 프리뷰",
    sourceActionLabel: "Company로 돌아가기",
    studioLabel: "Company 회사 기준 적용 프리뷰",
    studioNextAction:
      "회사 설명, 제품, 고객, 브랜드 톤, 내부 용어를 실제 GPT/Claude/Codex/Gemini 지시문에 반영하는 기준을 정리하세요.",
  },
  "skills-operational-summary": {
    dashboardLabel: "Skills 운영 요약",
    dashboardDescription: "Skills 운영 요약 리포트에서 저장됨",
    dashboardNextAction: "스킬 실행 성과와 개선 큐 확인",
    libraryFilterLabel: "Skills 운영 요약",
    librarySourceLabel: "Skills 운영 요약 리포트",
    sourceActionLabel: "Skills로 돌아가기",
    studioLabel: "Skills 운영 요약 리포트",
    studioNextAction:
      "Skills 실행 성과, 최근 실행, 반복 사용 상위 스킬, 개선 큐를 기준으로 템플릿 보강 계획을 만드세요.",
  },
  "skills-improvement-plan": {
    dashboardLabel: "Skills 개선 계획",
    dashboardDescription: "Skills 피드백 기반 개선 계획에서 저장됨",
    dashboardNextAction: "스킬 템플릿 개선 계획이 저장 결과에 반영됐는지 확인",
    libraryFilterLabel: "Skills 개선 계획",
    librarySourceLabel: "Skills 스킬 개선 계획",
    sourceActionLabel: "Skills 스킬 보기",
    studioLabel: "Skills 스킬 개선 계획",
    studioNextAction:
      "선택한 스킬의 피드백 지표, 추천 항목, 반영 예정 변경을 기준으로 템플릿 보강 계획을 만드세요.",
  },
  "library-improvement": {
    dashboardLabel: "Library 개선 브리프",
    dashboardDescription: "Library 원본 프롬프트 개선 체인으로 저장됨",
    dashboardNextAction: "원본 대비 품질 비교와 재개선 후보 확인",
    libraryFilterLabel: "Library 개선 브리프",
    librarySourceLabel: "Library 개선 브리프",
    sourceActionLabel: "Library 원본 보기",
    studioLabel: "Library 개선 브리프",
    studioNextAction: "선택한 저장 프롬프트를 더 높은 품질의 다음 버전으로 재작성하세요.",
  },
  "library-operational-summary": {
    dashboardLabel: "Library 운영 요약",
    dashboardDescription: "선택 프롬프트 운영 요약 리포트에서 저장됨",
    dashboardNextAction: "선택 프롬프트의 다음 운영 액션 확인",
    libraryFilterLabel: "Library 운영 요약",
    librarySourceLabel: "Library 선택 운영 요약",
    sourceActionLabel: "Library 운영 요약 보기",
    studioLabel: "Library 선택 운영 요약",
    studioNextAction:
      "선택 프롬프트의 저장 방식, 출처, 개선 체인, AI 전달 readiness를 기준으로 다음 운영 조치를 정리하세요.",
  },
  "library-source-health-filter": {
    dashboardLabel: "Library 출처 조치",
    dashboardDescription: "Library 출처 사유 조치 리포트에서 저장됨",
    dashboardNextAction: "출처 사유별 조치 결과 확인",
    libraryFilterLabel: "Library 출처 조치",
    librarySourceLabel: "Library 출처 사유 조치",
    sourceActionLabel: "Library 필터 보기",
    studioLabel: "Library 출처 사유 조치",
    studioNextAction:
      "현재 Library 필터 결과를 기준으로 원본 복원, 백업 확인, 버전 연결 순서를 정리하세요.",
  },
  "library-source-health-candidate": {
    dashboardLabel: "Library 출처 후보",
    dashboardDescription: "Library 출처 후보 메모에서 저장됨",
    dashboardNextAction: "원본 복원 또는 버전 연결 후보 확인",
    libraryFilterLabel: "Library 출처 후보",
    librarySourceLabel: "Library 출처 사유 후보",
    sourceActionLabel: "Library 후보 보기",
    studioLabel: "Library 출처 사유 후보",
    studioNextAction: "선택한 후보의 원본 복원, 백업 확인, 버전 연결 절차만 짧게 정리하세요.",
  },
  "library-studio-operational-group": {
    dashboardLabel: "Library 운영 묶음",
    dashboardDescription: "Studio 저장 출처와 저장 방식 결합 리포트에서 저장됨",
    dashboardNextAction: "같은 출처/저장 방식 묶음의 운영 기준 확인",
    libraryFilterLabel: "Library 운영 묶음",
    librarySourceLabel: "Library Studio 운영 묶음 리포트",
    sourceActionLabel: "Library 운영 묶음 보기",
    studioLabel: "Library Studio 운영 묶음 리포트",
    studioNextAction:
      "같은 Studio 저장 출처와 저장 방식으로 묶인 후보를 점검하고 유지, 재분류, 재개선 기준을 정리하세요.",
  },
  "library-studio-persistence-filter": {
    dashboardLabel: "Library 저장 방식 리포트",
    dashboardDescription: "저장 방식 리포트에서 저장됨",
    dashboardNextAction: "저장 방식별 운영 결과 확인",
    libraryFilterLabel: "Library 저장 방식 리포트",
    librarySourceLabel: "Library Studio 저장 방식 리포트",
    sourceActionLabel: "Library 필터 보기",
    studioLabel: "Library Studio 저장 방식 리포트",
    studioNextAction:
      "선택한 저장 방식의 후보를 점검하고 개선 체인, 운영 출처, 출처 없음 저장본의 관리 기준을 정리하세요.",
  },
  "library-studio-persistence-candidate": {
    dashboardLabel: "Library 저장 방식 후보",
    dashboardDescription: "저장 방식 후보 메모에서 저장됨",
    dashboardNextAction: "개선 체인/운영 출처 분류가 맞는지 확인",
    libraryFilterLabel: "Library 저장 방식 후보",
    librarySourceLabel: "Library Studio 저장 방식 후보",
    sourceActionLabel: "Library 후보 보기",
    studioLabel: "Library Studio 저장 방식 후보",
    studioNextAction: "선택한 저장본의 저장 출처 메타 상태를 점검하고 다음 관리 조치를 짧게 정리하세요.",
  },
  "library-missing-source-metadata-queue": {
    dashboardLabel: "Library 저장 출처 메타 없음 큐",
    dashboardDescription: "저장 출처 메타 없음 큐 리포트에서 저장됨",
    dashboardNextAction:
      "저장 출처 메타 없음 저장본의 유지 또는 추적 가능한 Studio 흐름 재저장 기준 확인",
    libraryFilterLabel: "Library 저장 출처 메타 없음 큐",
    librarySourceLabel: "Library 저장 출처 메타 없음 큐",
    sourceActionLabel: "Library 큐 보기",
    studioLabel: "Library 저장 출처 메타 없음 큐",
    studioNextAction:
      "저장 출처 메타가 없는 저장본을 유지, 재저장, 재분류 기준으로 나눠 운영 계획을 정리하세요.",
  },
  "library-missing-source-metadata-candidate": {
    dashboardLabel: "Library 저장 출처 메타 없음 후보",
    dashboardDescription: "저장 출처 메타 없음 후보 메모에서 저장됨",
    dashboardNextAction:
      "저장 출처 메타 없음 후보의 유지 또는 재저장 기준 확인",
    libraryFilterLabel: "Library 저장 출처 메타 없음 후보",
    librarySourceLabel: "Library 저장 출처 메타 없음 후보",
    sourceActionLabel: "Library 후보 보기",
    studioLabel: "Library 저장 출처 메타 없음 후보",
    studioNextAction:
      "선택한 저장본에 저장 출처 메타를 다시 부여할지, 레거시 저장본으로 유지할지 결정 기준을 정리하세요.",
  },
  "library-studio-source-filter": {
    dashboardLabel: "Library 저장 출처 리포트",
    dashboardDescription: "저장 출처 리포트에서 저장됨",
    dashboardNextAction: "같은 저장 출처 결과 묶음 확인",
    libraryFilterLabel: "Library 저장 출처 리포트",
    librarySourceLabel: "Library Studio 저장 출처 리포트",
    sourceActionLabel: "Library 필터 보기",
    studioLabel: "Library Studio 저장 출처 리포트",
    studioNextAction: "선택한 저장 출처의 저장본을 점검하고 기능 흐름별 관리 기준을 정리하세요.",
  },
  "library-studio-source-candidate": {
    dashboardLabel: "Library 저장 출처 후보",
    dashboardDescription: "저장 출처 후보 메모에서 저장됨",
    dashboardNextAction: "기능 흐름별 저장 결과 확인",
    libraryFilterLabel: "Library 저장 출처 후보",
    librarySourceLabel: "Library Studio 저장 출처 후보",
    sourceActionLabel: "Library 후보 보기",
    studioLabel: "Library Studio 저장 출처 후보",
    studioNextAction:
      "선택한 저장본이 해당 기능 흐름에서 만들어진 것이 맞는지 점검하고 다음 관리 조치를 정리하세요.",
  },
  "library-no-source-meta": {
    dashboardLabel: "Library 저장 출처 없음 메모",
    dashboardDescription: "저장 출처 메타 없음 점검 메모에서 저장됨",
    dashboardNextAction:
      "저장 출처 메타 없음 항목을 운영 출처로 재정리했는지 확인",
    libraryFilterLabel: "Library 저장 출처 없음 메모",
    librarySourceLabel: "Library 저장 출처 메타 없음 메모",
    sourceActionLabel: "원본 저장본 보기",
    studioLabel: "Library 저장 출처 메타 없음 메모",
    studioNextAction:
      "선택한 저장본을 출처 없음으로 유지할지, Studio 저장 출처가 있는 흐름으로 다시 저장할지 운영 기준을 정리하세요.",
  },
  "library-learning-context": {
    dashboardLabel: "Library 학습 컨텍스트",
    dashboardDescription: "Library 상세 학습 컨텍스트 리포트에서 저장됨",
    dashboardNextAction: "저장본의 학습 증거와 재개선 기준 확인",
    libraryFilterLabel: "Library 학습 컨텍스트",
    librarySourceLabel: "Library 학습 컨텍스트 리포트",
    sourceActionLabel: "Library 학습 증거 보기",
    studioLabel: "Library 학습 컨텍스트 리포트",
    studioNextAction:
      "저장본의 enabled scope, 적용 메모리, 최근 피드백을 기준으로 재개선 계획을 정리하세요.",
  },
  "learning-readiness": {
    dashboardLabel: "Learning 준비도",
    dashboardDescription: "Learning 준비도 리포트에서 저장됨",
    dashboardNextAction: "학습 scope와 낮은 신뢰도 보강 결과 확인",
    libraryFilterLabel: "Learning 준비도",
    librarySourceLabel: "Learning 준비도 리포트",
    sourceActionLabel: "Learning 준비도 보기",
    studioLabel: "Learning 준비도 리포트",
    studioNextAction:
      "학습 커버리지, 낮은 신뢰도 메모리, 최근 업데이트를 기준으로 다음 보강 계획을 만드세요.",
  },
  "learning-filter": {
    dashboardLabel: "Learning 필터",
    dashboardDescription: "Learning 조건 결과에서 저장됨",
    dashboardNextAction: "같은 학습 조건으로 저장된 결과 확인",
    libraryFilterLabel: "Learning 필터",
    librarySourceLabel: "Learning 필터 결과",
    sourceActionLabel: "Learning 조건 보기",
    studioLabel: "Learning 필터 결과",
    studioNextAction: "현재 조건의 학습 메모리 묶음을 반영해 새 프롬프트를 설계하세요.",
  },
  "learning-feedback-improvement": {
    dashboardLabel: "Learning 피드백 개선 큐",
    dashboardDescription: "Learning 피드백 개선 메모리 큐에서 저장됨",
    dashboardNextAction: "반복 피드백 규칙이 저장 결과에 반영됐는지 확인",
    libraryFilterLabel: "Learning 피드백 개선 큐",
    librarySourceLabel: "Learning 피드백 개선 메모리 큐",
    sourceActionLabel: "Learning 피드백 큐 보기",
    studioLabel: "Learning 피드백 개선 메모리 큐",
    studioNextAction:
      "Dashboard에서 저장한 반복 피드백 규칙을 반영해 프롬프트 품질 보강안을 설계하세요.",
  },
  "learning-memory": {
    dashboardLabel: "Learning 메모리",
    dashboardDescription: "개별 메모리 기준에서 저장됨",
    dashboardNextAction: "메모리 기준이 실제 반영됐는지 확인",
    libraryFilterLabel: "Learning 메모리",
    librarySourceLabel: "Learning 메모리 기준",
    sourceActionLabel: "Learning 메모리 찾기",
    studioLabel: "Learning 메모리 기준",
    studioNextAction: "선택한 학습 기준을 반드시 반영해 새 프롬프트를 설계하세요.",
  },
  "integrations-operations-checklist": {
    dashboardLabel: "Integrations 운영 체크리스트",
    dashboardDescription: "Integrations 환경별 실행 가이드에서 저장됨",
    dashboardNextAction: "외부 AI 연결 운영 기준이 저장 결과에 반영됐는지 확인",
    libraryFilterLabel: "Integrations 운영 체크리스트",
    librarySourceLabel: "Integrations 외부 AI 운영 체크리스트",
    sourceActionLabel: "Integrations 보기",
    studioLabel: "Integrations 외부 AI 운영 체크리스트",
    studioNextAction:
      "Chrome, 외부 Gen AI, Codex, MCP 연결 운영 기준을 점검하고 다음 개선 액션을 정리하세요.",
  },
  "mcp-feedback-improvement": {
    dashboardLabel: "MCP feedback 개선",
    dashboardDescription: "Integrations MCP feedback inbox에서 저장됨",
    dashboardNextAction:
      "confirmSave true evidence trace와 개선 초안 비교 결과가 다음 handoff에 반영됐는지 확인",
    libraryFilterLabel: "MCP feedback 개선",
    librarySourceLabel: "MCP feedback 개선 초안",
    sourceActionLabel: "Feedback inbox로 돌아가기",
    studioLabel: "MCP feedback 개선 초안",
    studioNextAction:
      "confirmSave true evidence trace를 확인한 뒤 다음 handoff package를 더 명확하게 재작성하세요.",
  },
  "mcp-feedback-report": {
    dashboardLabel: "MCP feedback 리포트",
    dashboardDescription: "Integrations MCP feedback report에서 저장됨",
    dashboardNextAction:
      "단건 evidence-ready 초안, trace-ready 리포트, confirmSave evidence trace가 저장본에 반영됐는지 확인",
    libraryFilterLabel: "MCP feedback 리포트",
    librarySourceLabel: "MCP feedback 운영 리포트",
    sourceActionLabel: "Feedback inbox로 돌아가기",
    studioLabel: "MCP feedback 운영 리포트",
    studioNextAction:
      "단건 evidence-ready 초안과 trace-ready 리포트의 confirmSave evidence trace를 비교한 뒤 반복 개선 규칙과 다음 운영 액션을 정리하세요.",
  },
  "data-document-rag": {
    dashboardLabel: "Data 문서/RAG 초안",
    dashboardDescription: "Data 문서/RAG chunk preview에서 저장됨",
    dashboardNextAction: "문서 맥락이 프롬프트에 반영됐는지 확인",
    libraryFilterLabel: "Data 문서/RAG 초안",
    librarySourceLabel: "Data 문서/RAG chunk 초안",
    sourceActionLabel: "Data 문서/RAG 보기",
    studioLabel: "Data 문서/RAG chunk 초안",
    studioNextAction:
      "문서 chunk의 근거와 인용 범위를 반영해 외부 AI에 전달할 프롬프트를 작성하세요.",
  },
} satisfies Record<PromptStudioDraftSource, PromptStudioSourceRegistryItem>;

export type PromptStudioSourceRegistryKey =
  keyof typeof promptStudioSourceRegistry;

export const promptStudioDraftSourceOptions = promptStudioDraftSources;

function getPromptStudioSourceRegistryItem(
  source: PromptStudioDraftSource,
): PromptStudioSourceRegistryItem {
  return promptStudioSourceRegistry[source];
}

export function getPromptStudioSourceDashboardSummary(
  source: PromptStudioDraftSource,
): PromptStudioSourceDashboardSummary {
  const meta = getPromptStudioSourceRegistryItem(source);

  return {
    label: meta.dashboardLabel,
    description: meta.dashboardDescription,
    nextAction: meta.dashboardNextAction,
  };
}

export function getPromptStudioSourceLibraryFilterLabel(
  source: PromptStudioDraftSource,
): string {
  return getPromptStudioSourceRegistryItem(source).libraryFilterLabel;
}

export function getPromptStudioSourceLibraryLabel(
  source: PromptStudioDraftSource,
): PromptStudioSourceLibraryLabel {
  const meta = getPromptStudioSourceRegistryItem(source);

  return {
    label: meta.librarySourceLabel,
    actionLabel: meta.sourceActionLabel,
  };
}

export function getPromptStudioSourceStudioLabel(
  source: PromptStudioDraftSource,
): PromptStudioSourceStudioLabel {
  const meta = getPromptStudioSourceRegistryItem(source);

  return {
    label: meta.studioLabel,
    nextAction: meta.studioNextAction,
    sourceActionLabel: meta.sourceActionLabel,
  };
}

export function isPromptStudioDraftSource(
  value: unknown,
): value is PromptStudioDraftSource {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(promptStudioSourceRegistry, value)
  );
}

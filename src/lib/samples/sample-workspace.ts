import { createPromptPackage } from "@/lib/prompt/generate";
import type {
  LearningMemory,
  PromptAsset,
  PromptRequestInput,
  PromptSkill,
} from "@/lib/prompt/types";

/**
 * Stable id prefix for every sample fixture (prompts, skills, memories) so the
 * onboarding loader can detect already-seeded data and stay idempotent, and so
 * users can recognize/delete sample content later.
 */
export const SAMPLE_ID_PREFIX = "sample-";

interface SamplePromptSeed {
  id: string;
  request: PromptRequestInput;
}

// ~6 curated, realistic Korean-context tasks spanning distinct domains so the
// seeded Library/dashboard/learning views show meaningful variety.
const samplePromptSeeds: SamplePromptSeed[] = [
  {
    id: "sample-prompt-ad-copy",
    request: {
      rawInput:
        "신규 출시하는 친환경 텀블러 광고 문구를 만들어줘. 20~30대 직장인을 대상으로 하고, 인스타그램 피드 광고에 쓸 짧은 카피와 상세페이지용 긴 카피를 둘 다 원해.",
      goal: "광고 문구 작성",
      domain: "마케팅",
      targetModels: ["gpt"],
    },
  },
  {
    id: "sample-prompt-email-summary",
    request: {
      rawInput:
        "지난 한 주간 쌓인 고객 문의 이메일 30통을 요약해서 팀 공유용 주간 리포트로 정리해줘. 반복되는 문의 유형과 긴급 건을 구분해줘.",
      goal: "이메일 요약",
      domain: "운영",
      targetModels: ["claude"],
    },
  },
  {
    id: "sample-prompt-translation",
    request: {
      rawInput:
        "아래 한국어 제품 소개 문단을 자연스러운 영어로 번역해줘. 해외 파트너사에 보낼 공식 이메일에 들어갈 문장이라 격식 있는 톤을 유지해야 해.",
      goal: "한국어에서 영어로 번역",
      domain: "콘텐츠",
      targetModels: ["gpt"],
      outputLanguage: "english",
    },
  },
  {
    id: "sample-prompt-code-review",
    request: {
      rawInput:
        "이번 스프린트에서 작성한 결제 모듈 PR을 리뷰해줘. 보안 취약점, 예외 처리 누락, 테스트 커버리지 관점에서 확인하고 개선 우선순위를 매겨줘.",
      goal: "코드 리뷰",
      domain: "개발",
      targetModels: ["codex"],
    },
  },
  {
    id: "sample-prompt-meeting-notes",
    request: {
      rawInput:
        "오늘 진행한 제품 기획 회의 녹취록을 정리해서 회의록으로 만들어줘. 결정 사항, 담당자, 다음 액션 아이템을 표로 정리하고 싶어.",
      goal: "회의록 정리",
      domain: "기획",
      targetModels: ["claude"],
    },
  },
  {
    id: "sample-prompt-product-description",
    request: {
      rawInput:
        "무선 이어폰 신제품의 상세 스펙과 차별점을 바탕으로 쇼핑몰에 올릴 제품 설명을 작성해줘. 노이즈 캔슬링 성능과 배터리 지속 시간을 강조하고 싶어.",
      goal: "제품 설명 작성",
      domain: "콘텐츠",
      targetModels: ["gemini"],
    },
  },
];

function buildSamplePrompts(): PromptAsset[] {
  return samplePromptSeeds.map((seed) => {
    const generated = createPromptPackage(seed.request);
    const stableVersions = generated.versions.map((version, index) => ({
      ...version,
      id: `${seed.id}-version-${index}`,
    }));

    return {
      ...generated,
      id: seed.id,
      versions: stableVersions,
    };
  });
}

function buildSampleSkills(prompts: PromptAsset[]): PromptSkill[] {
  const now = "2026-01-01T00:00:00.000Z";
  const adCopyPrompt = prompts.find((prompt) => prompt.id === "sample-prompt-ad-copy");
  const codeReviewPrompt = prompts.find(
    (prompt) => prompt.id === "sample-prompt-code-review",
  );

  return [
    {
      id: "sample-skill-ad-copy",
      name: "마케팅 광고 문구 스킬",
      description: "신제품 광고 문구를 짧은 카피와 상세페이지 카피로 반복 생성하는 템플릿",
      domain: "마케팅",
      targetModel: "gpt",
      languageStrategy: "hybrid",
      outputLanguage: "korean",
      sourcePromptId: adCopyPrompt?.id,
      sourceVersionId: adCopyPrompt?.versions[0]?.id,
      inputGuide: "이번 제품의 특징, 타깃 고객, 사용할 채널(피드/상세페이지 등)을 입력한다.",
      promptTemplate:
        "역할: 당신은 시니어 마케팅 카피라이터입니다. 제공된 제품 정보를 바탕으로 짧은 SNS 카피와 상세페이지용 긴 카피를 각각 작성하세요.\n\n반복 실행 입력:\n[여기에 이번 제품의 실제 특징과 타깃 고객을 넣는다]",
      outputFormat: "짧은 카피, 상세페이지 카피, 톤 설명",
      qualityChecklist: [
        "타깃 고객의 언어로 작성됐는가",
        "채널별 길이 제약을 지켰는가",
        "과장 표현 없이 신뢰감 있는가",
      ],
      tags: ["마케팅", "gpt", "skill"],
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "sample-skill-code-review",
      name: "코드 리뷰 스킬",
      description: "PR 변경 사항을 보안, 예외 처리, 테스트 커버리지 관점에서 반복 리뷰하는 템플릿",
      domain: "개발",
      targetModel: "codex",
      languageStrategy: "hybrid",
      outputLanguage: "korean",
      sourcePromptId: codeReviewPrompt?.id,
      sourceVersionId: codeReviewPrompt?.versions[0]?.id,
      inputGuide: "리뷰할 PR의 변경 파일 목록, diff, 관련 배경을 입력한다.",
      promptTemplate:
        "역할: 당신은 시니어 백엔드 엔지니어입니다. 제공된 diff를 보안 취약점, 예외 처리 누락, 테스트 커버리지 관점에서 리뷰하고 우선순위를 매기세요.\n\n반복 실행 입력:\n[여기에 이번 PR의 실제 diff와 배경을 넣는다]",
      outputFormat: "이슈 목록(심각도순), 개선 제안, 테스트 체크리스트",
      qualityChecklist: [
        "보안 취약점을 우선 확인했는가",
        "예외 처리 누락을 짚었는가",
        "테스트 커버리지 개선안을 제시했는가",
      ],
      tags: ["개발", "codex", "skill"],
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function buildSampleMemories(): LearningMemory[] {
  const now = "2026-01-01T00:00:00.000Z";

  return [
    {
      id: "sample-memory-user-tone",
      scope: "user",
      sourceType: "manual",
      sourceId: "sample-memory-user-tone",
      title: "직접적이고 실무 중심인 톤 선호",
      content:
        "사용자는 과장 없이 직접적이고 실무 중심적인 톤을 선호합니다. 결과물에는 바로 실행 가능한 단계와 체크리스트를 포함하세요.",
      tags: ["톤", "실무"],
      confidence: 0.8,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "sample-memory-company-brand",
      scope: "company",
      sourceType: "company",
      sourceId: "sample-memory-company-brand",
      title: "브랜드 톤은 전문적이고 신뢰감 있게",
      content:
        "회사 자료를 반영할 때는 전문적이고 신뢰감 있는 브랜드 톤을 유지하고, 검증되지 않은 수치나 과장된 마케팅 표현은 피하세요.",
      tags: ["브랜드", "톤"],
      confidence: 0.75,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "sample-memory-domain-dev-verification",
      scope: "domain",
      sourceType: "feedback",
      sourceId: "sample-memory-domain-dev-verification",
      title: "개발 작업은 검증 절차를 항상 포함",
      content:
        "개발 분야 프롬프트는 구현 후 테스트, 린트, 빌드 검증 절차를 항상 요구하고, 변경 범위와 제외 범위를 명확히 구분하세요.",
      tags: ["개발", "검증"],
      confidence: 0.85,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export interface SampleWorkspace {
  prompts: PromptAsset[];
  skills: PromptSkill[];
  memories: LearningMemory[];
}

const samplePrompts = buildSamplePrompts();

export const sampleWorkspace: SampleWorkspace = {
  prompts: samplePrompts,
  skills: buildSampleSkills(samplePrompts),
  memories: buildSampleMemories(),
};

/**
 * Appends only the sample items whose id is not already present in the
 * existing list. Pure and immutable: never mutates `existing`, and returns a
 * new array reference only when something was actually appended (re-invoking
 * with data already seeded is a safe no-op).
 */
export function mergeSampleWorkspace<T extends { id: string }>(
  existing: T[],
  samples: T[],
): T[] {
  const existingIds = new Set(existing.map((item) => item.id));
  const toAppend = samples.filter((sample) => !existingIds.has(sample.id));

  if (toAppend.length === 0) {
    return existing;
  }

  return [...existing, ...toAppend];
}

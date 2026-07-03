import { describe, expect, it } from "vitest";

import {
  createMemoryFromFeedback,
  feedbackTypeToScope,
  formatMemoriesForPrompt,
  mergeMemoryList,
  splitMemoryContentDisplay,
  stripMemoryReferenceLinks,
  upsertCompanyProfileMemory,
  upsertUserProfileMemory,
} from "@/lib/learning/memory";
import type {
  CompanyProfile,
  Feedback,
  LearningMemory,
  PromptAsset,
  PromptVersion,
  UserProfile,
} from "@/lib/prompt/types";

function makeVersion(overrides: Partial<PromptVersion> = {}): PromptVersion {
  return {
    id: "version-1",
    targetModel: "claude",
    modelLabel: "Claude",
    content: "본문",
    qualityScore: 4.0,
    scoreBreakdown: {
      clarity: 4,
      context: 4,
      outputFormat: 4,
      constraints: 4,
      expertise: 4,
      modelFit: 4,
      reusability: 4,
    },
    assumptions: [],
    missingContext: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makePrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  return {
    id: "prompt-1",
    title: "제목",
    source: "local",
    rawInput: "원문",
    goal: "목표",
    domain: "리서치",
    targetModels: ["claude"],
    versions: [makeVersion()],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: "feedback-1",
    promptVersionId: "version-1",
    rating: 5,
    comment: "표 형식으로 정리해줘서 좋았습니다",
    feedbackType: "format",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeMemory(overrides: Partial<LearningMemory> = {}): LearningMemory {
  return {
    id: "memory-1",
    scope: "domain",
    sourceType: "feedback",
    sourceId: "feedback-1",
    title: "메모리 제목",
    content: "요약은 항상 표 형식으로 제공한다",
    tags: ["리서치"],
    confidence: 0.8,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("splitMemoryContentDisplay", () => {
  it("separates plain body lines from recognized reference-link lines", () => {
    const content = "요약은 표 형식으로 제공한다\n근거 개선본: /library/prompt-1";
    const result = splitMemoryContentDisplay(content);

    expect(result.body).toBe("요약은 표 형식으로 제공한다");
    expect(result.links).toEqual([{ href: "/library/prompt-1", label: "근거 개선본" }]);
  });

  it("keeps a colon-containing line in the body when its label is not a recognized reference label", () => {
    const content = "비율: 30%";
    const result = splitMemoryContentDisplay(content);

    expect(result.body).toBe("비율: 30%");
    expect(result.links).toHaveLength(0);
  });

  it("keeps a reference-labeled line in the body verbatim when its href points to an external origin", () => {
    const content = "본문 내용\n원본 피드백: https://external-site.example/path";
    const result = splitMemoryContentDisplay(content);

    expect(result.body).toBe(content);
    expect(result.links).toHaveLength(0);
  });
});

describe("stripMemoryReferenceLinks", () => {
  it("returns only the body text with reference links removed", () => {
    const content = "핵심 규칙\n근거 개선본: /library/prompt-2";

    expect(stripMemoryReferenceLinks(content)).toBe("핵심 규칙");
  });
});

describe("feedbackTypeToScope", () => {
  it("maps company_rule feedback to the company scope", () => {
    expect(feedbackTypeToScope("company_rule")).toBe("company");
  });

  it("maps context and accuracy feedback to the domain scope", () => {
    expect(feedbackTypeToScope("context")).toBe("domain");
    expect(feedbackTypeToScope("accuracy")).toBe("domain");
  });

  it("maps format feedback to the skill scope", () => {
    expect(feedbackTypeToScope("format")).toBe("skill");
  });

  it("maps tone and other feedback to the user scope", () => {
    expect(feedbackTypeToScope("tone")).toBe("user");
    expect(feedbackTypeToScope("other")).toBe("user");
  });
});

describe("createMemoryFromFeedback", () => {
  it("derives scope from feedbackType and copies the feedback comment as content", () => {
    const prompt = makePrompt();
    const version = makeVersion();
    const feedback = makeFeedback({ feedbackType: "company_rule", comment: "내부 용어 통일" });

    const memory = createMemoryFromFeedback(prompt, version, feedback);

    expect(memory.scope).toBe("company");
    expect(memory.content).toBe("내부 용어 통일");
    expect(memory.sourceId).toBe(feedback.id);
    expect(memory.tags).toEqual([prompt.domain, version.targetModel, feedback.feedbackType]);
  });

  it("increases confidence for higher feedback ratings", () => {
    const prompt = makePrompt();
    const version = makeVersion();
    const highRating = createMemoryFromFeedback(prompt, version, makeFeedback({ rating: 5 }));
    const lowRating = createMemoryFromFeedback(prompt, version, makeFeedback({ rating: 2 }));

    expect(highRating.confidence).toBeGreaterThan(lowRating.confidence);
  });
});

describe("mergeMemoryList", () => {
  it("prepends a new memory when no matching scope+content entry exists", () => {
    const current = [makeMemory({ id: "existing" })];
    const next = makeMemory({ id: "new", content: "다른 내용" });

    const merged = mergeMemoryList(current, next);

    expect(merged).toHaveLength(2);
    expect(merged[0].id).toBe("new");
  });

  it("merges into an existing memory with the same scope and normalized content instead of duplicating", () => {
    const current = [
      makeMemory({ id: "existing", confidence: 0.5, tags: ["리서치"] }),
    ];
    const next = makeMemory({
      id: "incoming",
      content: "  요약은 항상 표 형식으로 제공한다  ",
      confidence: 0.9,
      tags: ["보고서"],
    });

    const merged = mergeMemoryList(current, next);

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("existing");
    expect(merged[0].confidence).toBe(0.9);
    expect(merged[0].tags.sort()).toEqual(["리서치", "보고서"].sort());
  });

  it("keeps the higher confidence value when merging duplicates", () => {
    const current = [makeMemory({ id: "existing", confidence: 0.9 })];
    const next = makeMemory({ id: "incoming", confidence: 0.3 });

    const merged = mergeMemoryList(current, next);

    expect(merged[0].confidence).toBe(0.9);
  });
});

describe("upsertUserProfileMemory", () => {
  const profile: UserProfile = {
    id: "user-1",
    role: "기획자",
    industries: ["AI SaaS"],
    goals: ["개인화 시스템 구축"],
    preferredTone: "직접적인 톤",
    preferredOutputs: ["체크리스트"],
    avoidPhrases: [],
    repeatedTasks: [],
  };

  it("inserts a new profile memory when none exists for the profile id", () => {
    const merged = upsertUserProfileMemory([], profile);

    expect(merged).toHaveLength(1);
    expect(merged[0].sourceType).toBe("profile");
    expect(merged[0].sourceId).toBe(profile.id);
    expect(merged[0].scope).toBe("user");
  });

  it("replaces the existing profile memory in place rather than duplicating it", () => {
    const initial = upsertUserProfileMemory([], profile);
    const updatedProfile = { ...profile, role: "프로덕트 매니저" };

    const merged = upsertUserProfileMemory(initial, updatedProfile);

    expect(merged).toHaveLength(1);
    expect(merged[0].content).toContain("프로덕트 매니저");
    expect(merged[0].createdAt).toBe(initial[0].createdAt);
  });
});

describe("upsertCompanyProfileMemory", () => {
  const company: CompanyProfile = {
    id: "company-1",
    companyName: "테스트 컴퍼니",
    description: "AI 프롬프트 운영 도구",
    products: ["Prompt AI Studio"],
    customers: ["내부 운영팀"],
    brandTone: "전문적",
    internalTerms: [],
    bannedPhrases: [],
    documentFormats: [],
  };

  it("inserts a new company memory scoped to company when none exists", () => {
    const merged = upsertCompanyProfileMemory([], company);

    expect(merged).toHaveLength(1);
    expect(merged[0].scope).toBe("company");
    expect(merged[0].sourceId).toBe(company.id);
    expect(merged[0].title).toContain(company.companyName);
  });
});

describe("formatMemoriesForPrompt", () => {
  it("orders memories by confidence descending and limits output to 8 entries", () => {
    const memories = Array.from({ length: 10 }, (_, index) =>
      makeMemory({ id: `memory-${index}`, confidence: index / 10, content: `내용 ${index}` }),
    );

    const formatted = formatMemoriesForPrompt(memories);

    expect(formatted).toHaveLength(8);
    expect(formatted[0]).toContain("내용 9");
  });

  it("strips reference links from the formatted memory line", () => {
    const memory = makeMemory({
      content: "핵심 규칙\n근거 개선본: /library/prompt-9",
    });

    const [formatted] = formatMemoriesForPrompt([memory]);

    expect(formatted).toContain("핵심 규칙");
    expect(formatted).not.toContain("/library/prompt-9");
  });

  it("omits a memory entirely from output when its stripped content is empty", () => {
    const emptyMemory = makeMemory({ content: "근거 개선본: /library/prompt-1" });

    const formatted = formatMemoriesForPrompt([emptyMemory]);

    expect(formatted).toHaveLength(0);
  });
});

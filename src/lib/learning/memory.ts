import type {
  CompanyProfile,
  Feedback,
  LearningMemory,
  MemoryScope,
  PromptAsset,
  PromptVersion,
  UserProfile,
} from "@/lib/prompt";
import { normalizeInternalHref } from "@/lib/navigation/href";

export type MemoryContentDisplay = {
  body: string;
  links: { href: string; label: string }[];
};

const memoryReferenceLabels = new Set(["근거 개선본", "원본 피드백"]);

function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

export function splitMemoryContentDisplay(
  content: string,
): MemoryContentDisplay {
  const bodyLines: string[] = [];
  const links: MemoryContentDisplay["links"] = [];

  content.split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      bodyLines.push(line);
      return;
    }

    const label = line.slice(0, separatorIndex).trim();
    const href = line.slice(separatorIndex + 1).trim();
    const normalizedHref = normalizeInternalHref(href);

    if (memoryReferenceLabels.has(label) && normalizedHref) {
      links.push({ href: normalizedHref, label });
      return;
    }

    bodyLines.push(line);
  });

  return {
    body: bodyLines.join("\n").trim(),
    links,
  };
}

export function stripMemoryReferenceLinks(content: string) {
  return splitMemoryContentDisplay(content).body;
}

export function feedbackTypeToScope(type: Feedback["feedbackType"]): MemoryScope {
  if (type === "company_rule") {
    return "company";
  }

  if (type === "context" || type === "accuracy") {
    return "domain";
  }

  if (type === "format") {
    return "skill";
  }

  return "user";
}

function confidenceFromRating(rating: number) {
  if (rating >= 5) {
    return 0.9;
  }

  if (rating >= 4) {
    return 0.75;
  }

  if (rating >= 3) {
    return 0.55;
  }

  return 0.35;
}

function scopeLabel(scope: MemoryScope) {
  const labels: Record<MemoryScope, string> = {
    user: "사용자 선호",
    company: "회사 기준",
    domain: "분야 기준",
    skill: "스킬 패턴",
  };

  return labels[scope];
}

export function createMemoryFromFeedback(
  prompt: PromptAsset,
  version: PromptVersion,
  feedback: Feedback,
): LearningMemory {
  const scope = feedbackTypeToScope(feedback.feedbackType);
  const now = new Date().toISOString();

  return {
    id: makeId("memory"),
    scope,
    sourceType: "feedback",
    sourceId: feedback.id,
    title: `${scopeLabel(scope)} · ${prompt.domain} · ${version.modelLabel}`,
    content: feedback.comment,
    tags: [prompt.domain, version.targetModel, feedback.feedbackType],
    confidence: confidenceFromRating(feedback.rating),
    createdAt: now,
    updatedAt: now,
  };
}

export function mergeMemoryList(
  current: LearningMemory[],
  nextMemory: LearningMemory,
) {
  const normalized = nextMemory.content.trim().toLowerCase();
  const existing = current.find(
    (memory) =>
      memory.scope === nextMemory.scope &&
      memory.content.trim().toLowerCase() === normalized,
  );

  if (!existing) {
    return [nextMemory, ...current];
  }

  return current.map((memory) =>
    memory.id === existing.id
      ? {
          ...memory,
          confidence: Math.max(memory.confidence, nextMemory.confidence),
          tags: Array.from(new Set([...memory.tags, ...nextMemory.tags])),
          updatedAt: nextMemory.updatedAt,
        }
      : memory,
  );
}

function formatCompanyList(label: string, values: string[]) {
  return values.length ? `- ${label}: ${values.join(", ")}` : `- ${label}: 미입력`;
}

function formatUserList(label: string, values: string[]) {
  return values.length ? `- ${label}: ${values.join(", ")}` : `- ${label}: 미입력`;
}

function getUserProfileConfidence(profile: UserProfile) {
  const required = [
    profile.role,
    profile.industries.join(","),
    profile.goals.join(","),
    profile.preferredTone,
    profile.preferredOutputs.join(","),
  ];
  const readyCount = required.filter((item) => item.trim().length > 0).length;

  return Math.min(0.9, 0.45 + readyCount * 0.09);
}

function buildUserProfileMemoryContent(profile: UserProfile) {
  return [
    `- 역할: ${profile.role || "미입력"}`,
    formatUserList("산업", profile.industries),
    formatUserList("주요 목표", profile.goals),
    `- 선호 톤: ${profile.preferredTone || "미입력"}`,
    formatUserList("선호 출력 형식", profile.preferredOutputs),
    formatUserList("피해야 할 표현", profile.avoidPhrases),
    formatUserList("반복 업무", profile.repeatedTasks),
  ].join("\n");
}

export function upsertUserProfileMemory(
  current: LearningMemory[],
  profile: UserProfile,
) {
  const now = new Date().toISOString();
  const existing = current.find(
    (memory) =>
      memory.sourceType === "profile" && memory.sourceId === profile.id,
  );
  const tags = Array.from(
    new Set([
      "user-profile",
      profile.role || "user",
      ...profile.industries,
      ...profile.goals,
      ...profile.preferredOutputs,
    ]),
  ).filter(Boolean);
  const nextMemory: LearningMemory = {
    id: existing?.id ?? `memory_profile_${profile.id}`,
    scope: "user",
    sourceType: "profile",
    sourceId: profile.id,
    title: `사용자 선호 · ${profile.role || "프로필"}`,
    content: buildUserProfileMemoryContent(profile),
    tags,
    confidence: getUserProfileConfidence(profile),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (!existing) {
    return [nextMemory, ...current];
  }

  return current.map((memory) =>
    memory.id === existing.id ? nextMemory : memory,
  );
}

function getCompanyProfileConfidence(company: CompanyProfile) {
  const required = [
    company.companyName,
    company.description,
    company.products.join(","),
    company.customers.join(","),
    company.brandTone,
  ];
  const readyCount = required.filter((item) => item.trim().length > 0).length;

  return Math.min(0.9, 0.45 + readyCount * 0.09);
}

function buildCompanyProfileMemoryContent(company: CompanyProfile) {
  return [
    `- 회사명: ${company.companyName || "미입력"}`,
    `- 회사 설명: ${company.description || "미입력"}`,
    formatCompanyList("제품/서비스", company.products),
    formatCompanyList("고객군", company.customers),
    `- 브랜드 톤: ${company.brandTone || "미입력"}`,
    formatCompanyList("내부 용어", company.internalTerms),
    formatCompanyList("금지 표현", company.bannedPhrases),
    formatCompanyList("선호 문서 구조", company.documentFormats),
  ].join("\n");
}

export function upsertCompanyProfileMemory(
  current: LearningMemory[],
  company: CompanyProfile,
) {
  const now = new Date().toISOString();
  const existing = current.find(
    (memory) =>
      memory.sourceType === "company" && memory.sourceId === company.id,
  );
  const tags = Array.from(
    new Set([
      "company-profile",
      company.companyName || "company",
      ...company.products,
      ...company.customers,
    ]),
  ).filter(Boolean);
  const nextMemory: LearningMemory = {
    id: existing?.id ?? `memory_company_${company.id}`,
    scope: "company",
    sourceType: "company",
    sourceId: company.id,
    title: `회사 기준 · ${company.companyName || "프로필"}`,
    content: buildCompanyProfileMemoryContent(company),
    tags,
    confidence: getCompanyProfileConfidence(company),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (!existing) {
    return [nextMemory, ...current];
  }

  return current.map((memory) =>
    memory.id === existing.id ? nextMemory : memory,
  );
}

export function formatMemoriesForPrompt(memories: LearningMemory[]) {
  return memories
    .slice()
    .sort((a, b) => {
      if (b.confidence === a.confidence) {
        return b.updatedAt.localeCompare(a.updatedAt);
      }

      return b.confidence - a.confidence;
    })
    .slice(0, 8)
    .map((memory) => {
      const content = stripMemoryReferenceLinks(memory.content);

      return content
        ? `memory/${memory.scope}/${memory.confidence.toFixed(2)}: ${content}`
        : "";
    })
    .filter(Boolean);
}

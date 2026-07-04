"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Field,
  PageHeader,
  Panel,
  PanelHeader,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import { normalizeInternalHref } from "@/lib/navigation/href";
import type { UserProfile } from "@/lib/prompt";
import { writeStudioDraft } from "@/lib/studio/draft";
import {
  useLearningMemoriesStore,
  useUserProfileStore,
} from "@/lib/data/workspace-store";
import { upsertUserProfileMemory } from "@/lib/learning/memory";
import { listToText, textToList } from "@/lib/storage/local-store";

interface ProfileReadinessItem {
  id: string;
  label: string;
  ready: boolean;
  description: string;
  questions: string[];
}

interface ProfileManualCopy {
  title: string;
  body: string;
  reason?: string;
}

function hasItems(values: string[]) {
  return values.some((value) => value.trim().length > 0);
}

function formatPromptList(values: string[], fallback: string) {
  const items = values.map((value) => value.trim()).filter(Boolean);

  return items.length ? items.map((value) => `- ${value}`).join("\n") : fallback;
}

function getSafeReturnPath(returnTo?: string) {
  const returnPath = normalizeInternalHref(returnTo);

  if (!returnPath) {
    return "/";
  }

  if (
    returnPath === "/" ||
    returnPath.startsWith("/library") ||
    returnPath.startsWith("/studio")
  ) {
    return returnPath;
  }

  return "/";
}

function getReturnLabel(returnPath: string) {
  if (returnPath.startsWith("/library")) {
    return "Library로 돌아가기";
  }

  if (returnPath.startsWith("/studio")) {
    return "Studio로 돌아가기";
  }

  return "Dashboard로 돌아가기";
}

function withProfileUpdatedSignal(returnPath: string) {
  const url = new URL(returnPath, "http://prompt-ai-studio.local");

  if (url.pathname.startsWith("/library") || url.pathname.startsWith("/studio")) {
    url.searchParams.set("profileUpdated", "1");
  }

  return normalizeInternalHref(`${url.pathname}${url.search}${url.hash}`) ?? "/";
}

function getProfileReadinessItems(profile: UserProfile) {
  return [
    {
      id: "profile-role",
      label: "역할",
      ready: profile.role.trim().length > 0,
      description: "AI가 사용자의 직무와 책임 범위를 이해하는 기본 기준입니다.",
      questions: [
        "현재 가장 많이 수행하는 역할은 무엇인가요?",
        "기획, 개발, 마케팅, 운영 중 어느 업무 비중이 가장 큰가요?",
      ],
    },
    {
      id: "profile-industries",
      label: "산업",
      ready: hasItems(profile.industries),
      description: "산업 맥락은 용어, 리스크, 산출물 수준을 조정하는 데 사용됩니다.",
      questions: [
        "주로 다루는 산업이나 고객 시장은 무엇인가요?",
        "AI가 답변에서 반드시 고려해야 하는 시장 맥락은 무엇인가요?",
      ],
    },
    {
      id: "profile-goals",
      label: "주요 목표",
      ready: hasItems(profile.goals),
      description: "반복적으로 원하는 결과를 프롬프트 목적에 우선 반영합니다.",
      questions: [
        "AI를 통해 가장 자주 해결하려는 업무 목표는 무엇인가요?",
        "좋은 답변이라고 판단하는 기준은 무엇인가요?",
      ],
    },
    {
      id: "profile-tone",
      label: "선호 톤",
      ready: profile.preferredTone.trim().length > 0,
      description: "응답의 말투, 밀도, 판단 방식을 개인 취향에 맞춥니다.",
      questions: [
        "답변은 얼마나 직접적이고 실무 중심이어야 하나요?",
        "피하고 싶은 말투나 답변 스타일은 무엇인가요?",
      ],
    },
    {
      id: "profile-outputs",
      label: "출력 형식",
      ready: hasItems(profile.preferredOutputs),
      description: "PRD, 표, 체크리스트처럼 반복 산출물 구조를 안정화합니다.",
      questions: [
        "가장 자주 필요한 결과물 형식은 무엇인가요?",
        "AI가 기본으로 맞춰야 하는 문서 구조나 표 형식이 있나요?",
      ],
    },
  ] satisfies ProfileReadinessItem[];
}

function getProfileAdvancedItems(profile: UserProfile) {
  return [
    {
      id: "profile-avoid-phrases",
      label: "피해야 할 표현",
      ready: hasItems(profile.avoidPhrases),
      description: "원하지 않는 표현, 과장, 모호한 조언을 줄입니다.",
    },
    {
      id: "profile-repeated-tasks",
      label: "반복 업무",
      ready: hasItems(profile.repeatedTasks),
      description: "반복 업무는 이후 스킬 후보와 자동화 흐름의 입력이 됩니다.",
    },
  ];
}

function buildProfileContextQuestions(profile: UserProfile) {
  const readinessItems = getProfileReadinessItems(profile);
  const missingItems = readinessItems.filter((item) => !item.ready);
  const targetItems = missingItems.length > 0 ? missingItems : readinessItems;
  const missingText = missingItems.length
    ? missingItems.map((item) => `- ${item.label}`).join("\n")
    : "- 기본 개인 맥락은 모두 입력됨";
  const questions = targetItems
    .map(
      (item, index) => `${index + 1}. ${item.label}
${item.questions.map((question) => `   - ${question}`).join("\n")}`,
    )
    .join("\n");

  return `# Prompt AI Studio User Profile Questions

## Current status
- Role: ${profile.role || "미입력"}
- Preferred tone: ${profile.preferredTone || "미입력"}

## Missing required context
${missingText}

## Questions to answer
${questions}

## Where to update
- Profile page: fill role, industries, goals, preferred tone, and output formats first.
- Advanced fields: add phrases to avoid and repeated tasks when the basic profile is ready.
- Studio: regenerate the prompt after saving the updated profile.`;
}

function buildProfileContextApplicationPrompt({
  completion,
  missingReadinessCount,
  profile,
}: {
  completion: number;
  missingReadinessCount: number;
  profile: UserProfile;
}) {
  return `# User Personalization Context Application

## Goal
Convert this user profile into a reusable instruction block for GPT, Claude, Codex, and Gemini prompts. The final prompt should be all English for development/Codex-heavy work, or Korean-English hybrid when Korean market nuance, brand wording, or user-facing Korean context must be preserved.

## Current readiness
- Required context completion: ${completion}%
- Missing required fields: ${missingReadinessCount}

## User profile
- Role: ${profile.role || "Not provided"}
- Preferred tone: ${profile.preferredTone || "Not provided"}

## Industries
${formatPromptList(profile.industries, "- Not provided")}

## Primary goals
${formatPromptList(profile.goals, "- Not provided")}

## Preferred output formats
${formatPromptList(profile.preferredOutputs, "- Not provided")}

## Avoid
${formatPromptList(profile.avoidPhrases, "- Not provided")}

## Repeated work patterns
${formatPromptList(profile.repeatedTasks, "- Not provided")}

## Required output
1. Write a concise personalization instruction block.
2. Explain when to use all-English prompting versus Korean-English hybrid prompting.
3. Create a short checklist to verify that future prompts reflect this user profile.
4. Keep the instruction practical enough to paste into GPT, Claude, Codex, or Gemini.`;
}

function ProfileManualCopyPanel({
  copy,
  onClose,
}: {
  copy: ProfileManualCopy;
  onClose: () => void;
}) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-soft">수동 복사 필요</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {copy.reason ?? `${copy.title} 복사가 차단됐습니다.`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-accent transition hover:text-soft"
        >
          닫기
        </button>
      </div>
      <textarea
        readOnly
        value={copy.body}
        className={`${textareaClass} mt-3 h-40 font-mono text-xs leading-5`}
        aria-label={`수동 복사용 ${copy.title}`}
      />
    </div>
  );
}

export function ProfileEditor({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [profile, setProfile] = useUserProfileStore();
  const [, setMemories] = useLearningMemoriesStore();
  const [saved, setSaved] = useState(false);
  const [questionsCopied, setQuestionsCopied] = useState(false);
  const [questionsCopyFailed, setQuestionsCopyFailed] = useState(false);
  const [applicationCopied, setApplicationCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState<ProfileManualCopy | null>(null);
  const readinessItems = useMemo(
    () => getProfileReadinessItems(profile),
    [profile],
  );
  const advancedItems = useMemo(() => getProfileAdvancedItems(profile), [profile]);
  const readyCount = readinessItems.filter((item) => item.ready).length;
  const completion = Math.round((readyCount / readinessItems.length) * 100);
  const nextMissingItem = readinessItems.find((item) => !item.ready);
  const missingReadinessCount = readinessItems.length - readyCount;
  const advancedReadyCount = advancedItems.filter((item) => item.ready).length;
  const returnPath = getSafeReturnPath(returnTo);
  const profileContextSummaryItems = [
    { label: "필수 완료", value: `${readyCount}/${readinessItems.length}` },
    { label: "부족 항목", value: `${missingReadinessCount}개` },
    { label: "확장 기준", value: `${advancedReadyCount}/${advancedItems.length}` },
    { label: "복귀 위치", value: getReturnLabel(returnPath) },
  ];
  const profileApplicationPrompt = buildProfileContextApplicationPrompt({
    completion,
    missingReadinessCount,
    profile,
  });
  const profileApplicationSignals = [
    {
      label: "프롬프트 언어",
      value: "영어 우선 · 한영 하이브리드 자동 판단",
    },
    {
      label: "적용 우선순위",
      value: nextMissingItem
        ? `${nextMissingItem.label} 보강 후 적용`
        : "역할, 목표, 톤, 출력 형식 즉시 적용",
    },
    {
      label: "대상 AI",
      value: "GPT · Claude · Codex · Gemini",
    },
    {
      label: "학습 메모리",
      value: saved ? "저장됨 · user scope 반영" : "저장 후 user scope 반영",
    },
  ];
  const profileApplicationWorkflowSteps = [
    {
      detail: nextMissingItem
        ? `${nextMissingItem.label}을 먼저 채우면 적용 기준이 더 정확해집니다.`
        : "역할, 산업, 목표, 톤, 출력 형식을 적용 기준으로 사용합니다.",
      label: "기준 확인",
      step: "01",
      title: nextMissingItem ? "보강 후 적용" : "즉시 적용 가능",
    },
    {
      detail:
        "개발/Codex 작업은 영어 중심, 한국어 맥락 보존이 필요하면 한영 하이브리드로 정리합니다.",
      label: "적용 문구",
      step: "02",
      title: "영어 또는 한영 하이브리드",
    },
    {
      detail:
        "복사하거나 Studio 초안으로 보내 GPT, Claude, Codex, Gemini 지시문에 붙입니다.",
      label: "Studio 전송",
      step: "03",
      title: "외부 AI handoff 준비",
    },
  ];

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setSaved(false);
    setQuestionsCopied(false);
    setQuestionsCopyFailed(false);
    setApplicationCopied(false);
    setManualCopy(null);
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function copyProfileContextQuestions() {
    const questionsText = buildProfileContextQuestions(profile);
    const copied = await copyTextToClipboard(questionsText);

    setQuestionsCopied(copied);
    setQuestionsCopyFailed(!copied);
    setManualCopy(
      copied
        ? null
        : {
            title: "개인 맥락 질문",
            body: questionsText,
          },
    );
  }

  function saveProfileContext() {
    setSaved(true);
    setManualCopy(null);
    setMemories((current) => upsertUserProfileMemory(current, profile));
  }

  async function copyProfileApplicationPrompt() {
    const copied = await copyTextToClipboard(profileApplicationPrompt);

    setApplicationCopied(copied);
    setManualCopy(
      copied
        ? null
        : {
            title: "개인화 기준 적용 프롬프트",
            body: profileApplicationPrompt,
          },
    );
  }

  function openProfileApplicationInStudio() {
    const wroteDraft = writeStudioDraft({
      source: "profile-context-application",
      rawInput: profileApplicationPrompt,
      goal: "개인화 기준 적용 프롬프트 설계",
      domain: profile.industries[0] || "Personalized AI operations",
      targetModels: ["gpt", "claude", "codex", "gemini"],
      outputLanguage: "korean",
      sourceTitle: "Profile 개인화 기준 적용 프리뷰",
      sourceHref: "/profile",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setApplicationCopied(false);
      setManualCopy({
        title: "개인화 기준 적용 프롬프트",
        body: profileApplicationPrompt,
        reason:
          "Studio 초안을 저장하지 못했습니다. 아래 적용 프롬프트를 직접 선택해 복사하세요.",
      });
      return;
    }

    router.push("/studio?draft=profile-context-application");
  }

  function saveAndReturn() {
    saveProfileContext();
    router.push(withProfileUpdatedSignal(returnPath));
  }

  return (
    <>
      <PageHeader
        title="개인 프로필"
        description="직무, 산업, 선호 톤, 출력 형식이 프롬프트 생성의 기본 맥락으로 사용됩니다."
        action={
          <a className={secondaryButtonClass} href={returnPath}>
            {getReturnLabel(returnPath)}
          </a>
        }
      />

      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Panel>
            <PanelHeader
              title="개인 맥락 완성도"
              description="Studio가 사용자의 업무 방식과 선호 산출물을 반영하기 위한 기준입니다."
            />
            <div className="space-y-5 p-5">
              <div
                className="grid grid-cols-2 gap-3 md:grid-cols-4"
                data-testid="profile-context-summary-metrics"
              >
                {profileContextSummaryItems.map((item) => (
                  <div
                    className="min-w-0 rounded-md border border-line bg-surface p-3"
                    key={item.label}
                  >
                    <p className="text-xs text-muted">{item.label}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-accent">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-soft">
                    기본 맥락 {readyCount}/{readinessItems.length}
                  </span>
                  <span className="font-mono text-foreground">
                    {completion}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              <div
                className="grid grid-cols-2 gap-3 md:grid-cols-2"
                data-testid="profile-readiness-metrics"
              >
                {readinessItems.map((item) => (
                  <a
                    className="min-w-0 rounded-md border border-line bg-surface p-3 transition hover:border-accent sm:p-4"
                    href={`#${item.id}`}
                    key={item.id}
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-xs font-semibold text-foreground sm:text-sm">
                          {item.label}
                        </p>
                        <p className="mt-1 break-words text-xs leading-5 text-muted">
                          {item.description}
                        </p>
                      </div>
                      <span
                        className={`w-fit shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                          item.ready
                            ? "bg-accent/15 text-accent"
                            : "bg-surface-strong text-muted"
                        }`}
                      >
                        {item.ready ? "완료" : "필요"}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="다음 보강 액션"
              description="부족한 개인 맥락을 질문으로 정리해 바로 채웁니다."
            />
            <div className="space-y-4 p-5">
              <div className="rounded-md border border-line bg-surface p-4">
                <p className="text-sm font-semibold text-foreground">
                  {nextMissingItem
                    ? `${nextMissingItem.label}부터 보강`
                    : "기본 개인 맥락 준비 완료"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {nextMissingItem
                    ? nextMissingItem.description
                    : "이제 피해야 할 표현과 반복 업무를 채우면 학습 메모리 품질이 더 안정적입니다."}
                </p>
              </div>

              <div className="grid gap-2">
                <a
                  className={`${primaryButtonClass} w-full`}
                  href={`#${nextMissingItem?.id || "profile-avoid-phrases"}`}
                >
                  {nextMissingItem ? "다음 항목 입력" : "확장 기준 입력"}
                </a>
                <button
                  className={`${secondaryButtonClass} w-full`}
                  type="button"
                  onClick={copyProfileContextQuestions}
                >
                  {questionsCopied
                    ? "보강 질문 복사됨"
                    : questionsCopyFailed
                      ? "보강 질문 복사 실패"
                      : "개인 맥락 질문 복사"}
                </button>
                {manualCopy ? (
                  <ProfileManualCopyPanel
                    copy={manualCopy}
                    onClose={() => setManualCopy(null)}
                  />
                ) : null}
              </div>

              <div
                className="rounded-md border border-line bg-surface p-4"
                data-testid="profile-context-application-preview"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      AI 적용 프리뷰
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      입력한 개인 기준이 외부 AI 지시문에 어떻게 들어갈지
                      먼저 확인합니다.
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-accent/15 px-2 py-1 text-xs font-semibold text-accent">
                    user context
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {profileApplicationSignals.map((item) => (
                    <div
                      className="min-w-0 rounded-md border border-line bg-panel p-3"
                      key={item.label}
                    >
                      <p className="text-xs text-muted">{item.label}</p>
                      <p className="mt-1 break-words text-xs font-semibold text-soft">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-4 grid gap-3"
                  data-testid="profile-context-application-workflow"
                >
                  {profileApplicationWorkflowSteps.map((item) => (
                    <div
                      className="rounded-md border border-line bg-panel p-3"
                      key={item.step}
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] font-semibold text-accent">
                          {item.step}
                        </span>
                        <p className="text-xs font-semibold text-muted">
                          {item.label}
                        </p>
                      </div>
                      <p className="mt-2 break-words text-xs font-semibold text-soft">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-muted">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-md border border-line bg-panel p-3">
                  <p className="text-xs font-semibold text-muted">
                    프롬프트 기준 미리보기
                  </p>
                  <p className="mt-2 text-sm leading-6 text-soft">
                    Use the user role, industry context, preferred tone, and
                    expected output format as active constraints. Choose
                    all-English prompting for development/Codex work and
                    Korean-English hybrid prompting when Korean context must be
                    preserved.
                  </p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    className={secondaryButtonClass}
                    type="button"
                    onClick={copyProfileApplicationPrompt}
                  >
                    {applicationCopied ? "적용 프롬프트 복사됨" : "적용 프롬프트 복사"}
                  </button>
                  <button
                    className={primaryButtonClass}
                    type="button"
                    onClick={openProfileApplicationInStudio}
                  >
                    적용 프리뷰 Studio로
                  </button>
                </div>
              </div>

              <div className="space-y-2 border-t border-line pt-4">
                {advancedItems.map((item) => (
                  <a
                    className="flex min-w-0 items-start justify-between gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-surface"
                    href={`#${item.id}`}
                    key={item.id}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-soft">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        {item.description}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-muted">
                      {item.ready ? "완료" : "선택"}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel>
        <PanelHeader
          title="사용자 학습 기준"
          description="초기 MVP는 이 프로필과 피드백을 조합해 개인화합니다."
        />
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <Field label="역할">
            <input
              id="profile-role"
              className={inputClass}
              value={profile.role}
              onChange={(event) => update("role", event.target.value)}
            />
          </Field>

          <Field label="선호 톤">
            <input
              id="profile-tone"
              className={inputClass}
              value={profile.preferredTone}
              onChange={(event) => update("preferredTone", event.target.value)}
            />
          </Field>

          <Field label="산업" hint="줄바꿈 또는 쉼표로 구분">
            <textarea
              id="profile-industries"
              className={textareaClass}
              rows={5}
              value={listToText(profile.industries)}
              onChange={(event) => update("industries", textToList(event.target.value))}
            />
          </Field>

          <Field label="주요 목표" hint="프롬프트가 우선 반영해야 할 업무 목표">
            <textarea
              id="profile-goals"
              className={textareaClass}
              rows={5}
              value={listToText(profile.goals)}
              onChange={(event) => update("goals", textToList(event.target.value))}
            />
          </Field>

          <Field label="선호 출력 형식" hint="예: PRD, 표, 체크리스트, JSON, 개발 태스크">
            <textarea
              id="profile-outputs"
              className={textareaClass}
              rows={5}
              value={listToText(profile.preferredOutputs)}
              onChange={(event) =>
                update("preferredOutputs", textToList(event.target.value))
              }
            />
          </Field>

          <Field label="피해야 할 표현">
            <textarea
              id="profile-avoid-phrases"
              className={textareaClass}
              rows={5}
              value={listToText(profile.avoidPhrases)}
              onChange={(event) =>
                update("avoidPhrases", textToList(event.target.value))
              }
            />
          </Field>

          <Field label="반복 업무" hint="나중에 스킬 후보로 전환할 업무">
            <textarea
              id="profile-repeated-tasks"
              className={textareaClass}
              rows={5}
              value={listToText(profile.repeatedTasks)}
              onChange={(event) =>
                update("repeatedTasks", textToList(event.target.value))
              }
            />
          </Field>

          <div className="flex items-end">
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <button
                className={primaryButtonClass}
                type="button"
                onClick={saveProfileContext}
              >
                {saved ? "저장됨 · 학습 반영" : "프로필 저장"}
              </button>
              <button
                className={secondaryButtonClass}
                type="button"
                onClick={saveAndReturn}
              >
                저장 후 {getReturnLabel(returnPath)}
              </button>
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}

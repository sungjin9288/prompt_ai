"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { announce } from "@/lib/browser/announcer";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import { openExternalUrl } from "@/lib/browser/open-external-url";
import { useCopyAction } from "@/lib/browser/use-copy-action";
import {
  capImproveDraft,
  getImproveOriginTargetModel,
  improveDraftMaxLength,
  type ImproveOrigin,
  type ImproveSource,
} from "@/lib/improve/params";
import { usePromptAssetsStore } from "@/lib/data/workspace-store";
import {
  createPromptPackage,
  defaultCompanyProfile,
  defaultDomains,
  defaultGoals,
  defaultUserProfile,
  type PromptAsset,
} from "@/lib/prompt";
import { getExternalAiTarget } from "@/lib/prompt/external-ai";
import { buildSavedPromptLibraryHref } from "@/lib/studio-view/hrefs";
import { writeStudioDraft } from "@/lib/studio/draft";
import {
  PageHeader,
  Panel,
  PanelHeader,
  ScoreBar,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";

const improveDefaultGoal = defaultGoals[0] ?? "전문 프롬프트로 변환";
const improveDefaultDomain = defaultDomains[0] ?? "기획";

const improveOriginLabels: Record<ImproveOrigin, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  unknown: "알 수 없는 출처",
};

function makeUniquePromptId(existingIds: Set<string>, candidate: string) {
  if (!existingIds.has(candidate)) {
    return candidate;
  }

  let attempt = 0;

  while (existingIds.has(`${candidate}-${attempt}`)) {
    attempt += 1;
  }

  return `${candidate}-${attempt}`;
}

export function ImproveView({
  initialDraft,
  source,
  origin,
}: {
  initialDraft: string;
  source: ImproveSource;
  origin: ImproveOrigin;
}) {
  const router = useRouter();
  const [prompts, setPrompts] = usePromptAssetsStore();
  const [draft, setDraft] = useState(initialDraft);
  const [generated, setGenerated] = useState<PromptAsset | null>(null);
  const [savedPromptId, setSavedPromptId] = useState<string | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [studioHandoffManualCopy, setStudioHandoffManualCopy] = useState<
    string | null
  >(null);
  const copyAction = useCopyAction();

  const activeVersion = generated?.versions[0];
  const savedPromptHref = savedPromptId
    ? buildSavedPromptLibraryHref(
        { ...(generated as PromptAsset), id: savedPromptId },
        activeVersion?.targetModel,
      )
    : null;

  function handleDraftChange(value: string) {
    setDraft(capImproveDraft(value));
  }

  function improveDraft() {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      return;
    }

    setIsImproving(true);

    try {
      const targetModel = getImproveOriginTargetModel(origin);
      const result = createPromptPackage(
        {
          rawInput: trimmedDraft,
          goal: improveDefaultGoal,
          domain: improveDefaultDomain,
          targetModels: origin === "unknown" ? [] : [targetModel],
        },
        defaultUserProfile,
        defaultCompanyProfile,
        [],
      );

      setGenerated(result);
      setSavedPromptId(null);
      setStudioHandoffManualCopy(null);
      copyAction.reset();
      announce("개선된 프롬프트가 준비됐습니다.");
    } finally {
      setIsImproving(false);
    }
  }

  async function copyImprovedPrompt() {
    if (!activeVersion) {
      return;
    }

    await copyAction.copy("improved-prompt", activeVersion.content);
  }

  async function copyAndOpenExternalAi() {
    if (!activeVersion) {
      return;
    }

    const target = getExternalAiTarget(activeVersion.targetModel);
    const copied = await copyTextToClipboard(activeVersion.content);

    if (copied) {
      openExternalUrl(target.url);
    }
  }

  function saveToLibrary() {
    if (!generated) {
      return;
    }

    const existingIds = new Set(prompts.map((prompt) => prompt.id));
    const uniqueId = makeUniquePromptId(existingIds, generated.id);
    const promptToSave: PromptAsset = { ...generated, id: uniqueId };

    setPrompts((current) => [promptToSave, ...current]);
    setSavedPromptId(uniqueId);
    announce("라이브러리에 저장했습니다.");
  }

  function continueInStudio() {
    if (!generated) {
      return;
    }

    const wroteDraft = writeStudioDraft({
      source: "integrations-improve-page",
      rawInput: generated.rawInput,
      goal: generated.goal,
      domain: generated.domain,
      targetModels: generated.targetModels,
      outputLanguage: generated.outputLanguage ?? "same_as_input",
      sourceHref: "/improve",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioHandoffManualCopy(generated.rawInput);
      return;
    }

    router.push("/studio?draft=integrations-improve-page");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="프롬프트 개선"
        description="초안 하나를 빠르게 개선하고, 복사하거나 외부 AI에서 열거나 라이브러리에 저장하세요."
      />
      {source === "extension" ? (
        <p className="rounded-md border border-line bg-panel-strong px-4 py-3 text-sm text-soft">
          확장 프로그램에서 전달된 초안입니다. 출처: {improveOriginLabels[origin]}
        </p>
      ) : null}

      <Panel>
        <PanelHeader
          title="초안"
          description={`개선할 프롬프트 초안을 입력하세요. 최대 ${improveDraftMaxLength.toLocaleString(
            "ko-KR",
          )}자까지 반영됩니다.`}
        />
        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-soft">
              프롬프트 초안
            </span>
            <textarea
              className={`${textareaClass} min-h-40`}
              placeholder="개선하고 싶은 프롬프트를 입력하세요."
              value={draft}
              maxLength={improveDraftMaxLength}
              onChange={(event) => handleDraftChange(event.target.value)}
              aria-label="프롬프트 초안"
            />
          </label>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={improveDraft}
            disabled={!draft.trim() || isImproving}
            data-testid="improve-run"
          >
            {isImproving ? "개선 중…" : "개선하기"}
          </button>
        </div>
      </Panel>

      {generated && activeVersion ? (
        <Panel>
          <PanelHeader
            title="개선 결과"
            description={`${activeVersion.modelLabel} 기준으로 개선된 프롬프트입니다.`}
          />
          <div className="space-y-4 p-5" aria-live="polite">
            <ScoreBar label="품질 점수" value={activeVersion.qualityScore} />
            <textarea
              className={`${textareaClass} min-h-48`}
              value={activeVersion.content}
              readOnly
              aria-label="개선된 프롬프트"
              data-testid="improve-result"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyImprovedPrompt}
              >
                {copyAction.isCopied("improved-prompt")
                  ? "복사됨"
                  : "프롬프트 복사"}
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={copyAndOpenExternalAi}
              >
                {`복사 후 ${getExternalAiTarget(activeVersion.targetModel).label}에서 열기`}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={saveToLibrary}
                data-testid="improve-save-to-library"
              >
                라이브러리에 저장
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={continueInStudio}
              >
                Studio에서 계속
              </button>
            </div>
            {savedPromptHref ? (
              <a
                href={savedPromptHref}
                className="inline-block text-sm font-medium text-accent underline underline-offset-2"
                data-testid="improve-library-link"
              >
                라이브러리에서 저장된 프롬프트 보기
              </a>
            ) : null}
            {studioHandoffManualCopy ? (
              <div className="space-y-2">
                <p className="text-xs text-muted">
                  Studio로 자동 전달하지 못했습니다. 아래 원문을 직접 복사해
                  Studio에 붙여넣으세요.
                </p>
                <textarea
                  className={`${textareaClass} min-h-24`}
                  value={studioHandoffManualCopy}
                  readOnly
                  aria-label="Studio 전달용 원문"
                />
              </div>
            ) : null}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

import type { WorkspaceBackup } from "@/lib/storage/workspace-backup";

export interface SupabaseImportRow {
  localId?: string;
  pendingId: string;
  payload: Record<string, unknown>;
}

export interface SupabaseImportBatch {
  order: number;
  table: string;
  dependency: string;
  rows: SupabaseImportRow[];
}

export interface SupabaseImportWarning {
  category: "setup" | "relationship";
  severity: "required" | "review";
  message: string;
}

export interface SupabaseImportDryRun {
  schemaVersion: WorkspaceBackup["schemaVersion"];
  totalRows: number;
  batches: SupabaseImportBatch[];
  warnings: string[];
  warningItems: SupabaseImportWarning[];
}

type BackupPrompt = WorkspaceBackup["data"]["prompts"][number];
type BackupImprovementSource = NonNullable<BackupPrompt["improvementSource"]>;
type BackupImprovementFeedbackSource = NonNullable<
  BackupImprovementSource["sourceFeedback"]
>;

export const SUPABASE_WORKSPACE_ID_PLACEHOLDER = "<workspace_id>";
export const SUPABASE_OWNER_USER_ID_PLACEHOLDER = "<owner_user_id>";
const SUPABASE_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createPendingId(prefix: string, index = 1) {
  return `pending-${prefix}-${index}`;
}

function toNullable(value: string | undefined) {
  return value && value.trim() ? value : null;
}

function createWarning({
  category,
  message,
  severity,
}: SupabaseImportWarning): SupabaseImportWarning {
  return { category, message, severity };
}

export function formatWarningLabel(warning: SupabaseImportWarning) {
  const categoryLabel =
    warning.category === "setup" ? "설정 필요" : "관계 참조 확인";
  const severityLabel = warning.severity === "required" ? "필수" : "검토";

  return `[${categoryLabel}/${severityLabel}] ${warning.message}`;
}

function remapImprovementFeedbackSource(
  sourceFeedback: BackupImprovementFeedbackSource | undefined,
  {
    feedbackIdMap,
    versionIdMap,
  }: {
    feedbackIdMap: Map<string, string>;
    versionIdMap: Map<string, string>;
  },
) {
  if (!sourceFeedback) {
    return undefined;
  }

  return {
    ...sourceFeedback,
    id: sourceFeedback.id
      ? feedbackIdMap.get(sourceFeedback.id) || sourceFeedback.id
      : undefined,
    promptVersionId: sourceFeedback.promptVersionId
      ? versionIdMap.get(sourceFeedback.promptVersionId) ||
        sourceFeedback.promptVersionId
      : undefined,
  };
}

function remapImprovementSource(
  improvementSource: BackupPrompt["improvementSource"],
  {
    feedbackIdMap,
    promptIdMap,
    versionIdMap,
  }: {
    feedbackIdMap: Map<string, string>;
    promptIdMap: Map<string, string>;
    versionIdMap: Map<string, string>;
  },
) {
  if (!improvementSource) {
    return {};
  }

  const remappedFeedback = remapImprovementFeedbackSource(
    improvementSource.sourceFeedback,
    { feedbackIdMap, versionIdMap },
  );

  return {
    ...improvementSource,
    sourcePromptId:
      promptIdMap.get(improvementSource.sourcePromptId) ||
      improvementSource.sourcePromptId,
    sourceVersionId: improvementSource.sourceVersionId
      ? versionIdMap.get(improvementSource.sourceVersionId) ||
        improvementSource.sourceVersionId
      : undefined,
    sourceFeedback: remappedFeedback,
  };
}

function remapLearningMemorySourceId({
  companyProfileId,
  feedbackIdMap,
  memory,
  sourceCompanyProfileId,
  sourceUserProfileId,
  userProfileId,
}: {
  companyProfileId: string;
  feedbackIdMap: Map<string, string>;
  memory: WorkspaceBackup["data"]["memories"][number];
  sourceCompanyProfileId: string;
  sourceUserProfileId: string;
  userProfileId: string;
}) {
  if (memory.sourceType === "feedback") {
    return feedbackIdMap.get(memory.sourceId) || memory.sourceId;
  }

  if (memory.sourceType === "profile" && memory.sourceId === sourceUserProfileId) {
    return userProfileId;
  }

  if (
    memory.sourceType === "company" &&
    memory.sourceId === sourceCompanyProfileId
  ) {
    return companyProfileId;
  }

  return memory.sourceId;
}

export function isSupabaseWorkspaceUuid(value: string) {
  return SUPABASE_UUID_PATTERN.test(value.trim());
}

export function createSupabaseImportDryRun(
  backup: WorkspaceBackup,
): SupabaseImportDryRun {
  const workspaceId = createPendingId("workspace");
  const ownerUserId = createPendingId("auth-user");
  const userProfileId = createPendingId("user-profile");
  const companyProfileId = createPendingId("company-profile");
  const workspaceMemberId = createPendingId("workspace-member");
  const promptIdMap = new Map<string, string>();
  const versionIdMap = new Map<string, string>();
  const feedbackIdMap = new Map<string, string>();
  const skillIdMap = new Map<string, string>();
  const feedbackIds = new Set<string>();
  const feedbackVersionIdById = new Map<string, string>();
  const deletedPromptIds = new Set<string>();
  const deletedVersionIds = new Set<string>();
  const deletedFeedbackIds = new Set<string>();
  const deletedFeedbackVersionIdById = new Map<string, string>();
  const warningItems: SupabaseImportWarning[] = [
    createWarning({
      category: "setup",
      severity: "required",
      message:
        "owner_user_id와 user_id는 Supabase auth 사용자 확정 후 실제 UUID로 교체해야 합니다.",
    }),
    createWarning({
      category: "setup",
      severity: "required",
      message:
        "pending-* ID는 dry-run 식별자입니다. 실제 import에서는 DB UUID 또는 사전 생성 UUID로 대체해야 합니다.",
    }),
  ];

  backup.data.prompts.forEach((prompt, promptIndex) => {
    const pendingPromptId = createPendingId("prompt", promptIndex + 1);

    promptIdMap.set(prompt.id, pendingPromptId);
    prompt.versions.forEach((version, versionIndex) => {
      versionIdMap.set(
        version.id,
        createPendingId(`prompt-${promptIndex + 1}-version`, versionIndex + 1),
      );
    });
    prompt.feedback.forEach((feedback, feedbackIndex) => {
      feedbackIds.add(feedback.id);
      feedbackVersionIdById.set(feedback.id, feedback.promptVersionId);
      feedbackIdMap.set(
        feedback.id,
        createPendingId(`prompt-${promptIndex + 1}-feedback`, feedbackIndex + 1),
      );
    });
  });

  backup.data.skills.forEach((skill, skillIndex) => {
    skillIdMap.set(skill.id, createPendingId("skill", skillIndex + 1));
  });

  backup.data.deletedPrompts.forEach((deletedPrompt) => {
    deletedPromptIds.add(deletedPrompt.prompt.id);
    deletedPrompt.prompt.versions.forEach((version) => {
      deletedVersionIds.add(version.id);
    });
    deletedPrompt.prompt.feedback.forEach((feedback) => {
      deletedFeedbackIds.add(feedback.id);
      deletedFeedbackVersionIdById.set(feedback.id, feedback.promptVersionId);
    });
  });

  backup.data.prompts.forEach((prompt) => {
    const sourceFeedback = prompt.improvementSource?.sourceFeedback;

    if (prompt.sourceSkillId && !skillIdMap.has(prompt.sourceSkillId)) {
      warningItems.push(
        createWarning({
          category: "relationship",
          severity: "review",
          message: `${prompt.title} 프롬프트의 sourceSkillId ${prompt.sourceSkillId}를 백업 스킬 목록에서 찾지 못했습니다.`,
        }),
      );
    }

    if (
      prompt.improvementSource?.sourcePromptId &&
      !promptIdMap.has(prompt.improvementSource.sourcePromptId) &&
      !deletedPromptIds.has(prompt.improvementSource.sourcePromptId)
    ) {
      warningItems.push(
        createWarning({
          category: "relationship",
          severity: "review",
          message: `${prompt.title} 프롬프트의 개선 원본 ${prompt.improvementSource.sourcePromptId}를 백업 프롬프트 목록에서 찾지 못했습니다.`,
        }),
      );
    }

    if (
      prompt.improvementSource?.sourceVersionId &&
      !versionIdMap.has(prompt.improvementSource.sourceVersionId) &&
      !deletedVersionIds.has(prompt.improvementSource.sourceVersionId)
    ) {
      warningItems.push(
        createWarning({
          category: "relationship",
          severity: "review",
          message: `${prompt.title} 프롬프트의 개선 원본 버전 ${prompt.improvementSource.sourceVersionId}를 백업 버전 목록에서 찾지 못했습니다.`,
        }),
      );
    }

    if (sourceFeedback && (!sourceFeedback.id || !sourceFeedback.promptVersionId)) {
      const missingFields = [
        sourceFeedback.id ? null : "id",
        sourceFeedback.promptVersionId ? null : "promptVersionId",
      ].filter(Boolean);

      warningItems.push(
        createWarning({
          category: "relationship",
          severity: "review",
          message: `${prompt.title} 프롬프트의 sourceFeedback에 ${missingFields.join(", ")} 값이 없어 피드백 개선 추적을 완전히 검증할 수 없습니다.`,
        }),
      );
    }

    if (
      sourceFeedback?.id &&
      !feedbackIds.has(sourceFeedback.id) &&
      !deletedFeedbackIds.has(sourceFeedback.id)
    ) {
      warningItems.push(
        createWarning({
          category: "relationship",
          severity: "review",
          message: `${prompt.title} 프롬프트의 개선 원본 피드백 ${sourceFeedback.id}를 백업 피드백 목록에서 찾지 못했습니다.`,
        }),
      );
    }

    if (
      sourceFeedback?.promptVersionId &&
      !versionIdMap.has(sourceFeedback.promptVersionId) &&
      !deletedVersionIds.has(sourceFeedback.promptVersionId)
    ) {
      warningItems.push(
        createWarning({
          category: "relationship",
          severity: "review",
          message: `${prompt.title} 프롬프트의 개선 원본 피드백 버전 ${sourceFeedback.promptVersionId}를 백업 버전 목록에서 찾지 못했습니다.`,
        }),
      );
    }

    if (sourceFeedback?.id && sourceFeedback.promptVersionId) {
      const activeFeedbackVersionId = feedbackVersionIdById.get(
        sourceFeedback.id,
      );
      const deletedFeedbackVersionId = deletedFeedbackVersionIdById.get(
        sourceFeedback.id,
      );
      const expectedFeedbackVersionId =
        activeFeedbackVersionId || deletedFeedbackVersionId;

      if (
        expectedFeedbackVersionId &&
        expectedFeedbackVersionId !== sourceFeedback.promptVersionId
      ) {
        warningItems.push(
          createWarning({
            category: "relationship",
            severity: "review",
            message: `${prompt.title} 프롬프트의 개선 원본 피드백 ${sourceFeedback.id}가 버전 ${expectedFeedbackVersionId}에 연결되어 있지만 sourceFeedback.promptVersionId는 ${sourceFeedback.promptVersionId}입니다.`,
          }),
        );
      }
    }
  });

  backup.data.skills.forEach((skill) => {
    if (skill.sourcePromptId && !promptIdMap.has(skill.sourcePromptId)) {
      warningItems.push(
        createWarning({
          category: "relationship",
          severity: "review",
          message: `${skill.name} 스킬의 sourcePromptId ${skill.sourcePromptId}를 백업 프롬프트 목록에서 찾지 못했습니다.`,
        }),
      );
    }

    if (skill.sourceVersionId && !versionIdMap.has(skill.sourceVersionId)) {
      warningItems.push(
        createWarning({
          category: "relationship",
          severity: "review",
          message: `${skill.name} 스킬의 sourceVersionId ${skill.sourceVersionId}를 백업 버전 목록에서 찾지 못했습니다.`,
        }),
      );
    }
  });

  backup.data.memories.forEach((memory) => {
    if (memory.sourceType === "feedback" && !feedbackIds.has(memory.sourceId)) {
      warningItems.push(
        createWarning({
          category: "relationship",
          severity: "review",
          message: `${memory.title} 학습 메모리의 feedback sourceId ${memory.sourceId}를 백업 피드백 목록에서 찾지 못했습니다.`,
        }),
      );
    }

    if (
      memory.sourceType === "profile" &&
      memory.sourceId !== backup.data.userProfile.id
    ) {
      warningItems.push(
        createWarning({
          category: "relationship",
          severity: "review",
          message: `${memory.title} 학습 메모리의 profile sourceId ${memory.sourceId}가 백업 사용자 프로필 ID와 다릅니다.`,
        }),
      );
    }

    if (
      memory.sourceType === "company" &&
      memory.sourceId !== backup.data.companyProfile.id
    ) {
      warningItems.push(
        createWarning({
          category: "relationship",
          severity: "review",
          message: `${memory.title} 학습 메모리의 company sourceId ${memory.sourceId}가 백업 회사 프로필 ID와 다릅니다.`,
        }),
      );
    }
  });

  const batches: SupabaseImportBatch[] = [
    {
      order: 1,
      table: "workspaces",
      dependency: "없음",
      rows: [
        {
          pendingId: workspaceId,
          payload: {
            id: workspaceId,
            owner_user_id: ownerUserId,
            name:
              backup.data.companyProfile.companyName ||
              backup.data.userProfile.role ||
              "Prompt AI Studio Workspace",
            type: backup.data.companyProfile.companyName ? "company" : "personal",
            created_at: backup.exportedAt,
            updated_at: backup.exportedAt,
          },
        },
      ],
    },
    {
      order: 2,
      table: "workspace_members",
      dependency: "workspaces.id, auth.users.id",
      rows: [
        {
          pendingId: workspaceMemberId,
          payload: {
            id: workspaceMemberId,
            workspace_id: workspaceId,
            user_id: ownerUserId,
            role: "owner",
            created_at: backup.exportedAt,
          },
        },
      ],
    },
    {
      order: 3,
      table: "user_profiles",
      dependency: "workspaces.id, auth.users.id",
      rows: [
        {
          localId: backup.data.userProfile.id,
          pendingId: userProfileId,
          payload: {
            id: userProfileId,
            user_id: ownerUserId,
            workspace_id: workspaceId,
            role: backup.data.userProfile.role,
            industries: backup.data.userProfile.industries,
            goals: backup.data.userProfile.goals,
            preferred_tone: backup.data.userProfile.preferredTone,
            preferred_outputs: backup.data.userProfile.preferredOutputs,
            avoid_phrases: backup.data.userProfile.avoidPhrases,
            repeated_tasks: backup.data.userProfile.repeatedTasks,
            created_at: backup.exportedAt,
            updated_at: backup.exportedAt,
          },
        },
      ],
    },
    {
      order: 4,
      table: "company_profiles",
      dependency: "workspaces.id",
      rows: [
        {
          localId: backup.data.companyProfile.id,
          pendingId: companyProfileId,
          payload: {
            id: companyProfileId,
            workspace_id: workspaceId,
            company_name: backup.data.companyProfile.companyName,
            description: backup.data.companyProfile.description,
            products: backup.data.companyProfile.products,
            customers: backup.data.companyProfile.customers,
            brand_tone: backup.data.companyProfile.brandTone,
            internal_terms: backup.data.companyProfile.internalTerms,
            banned_phrases: backup.data.companyProfile.bannedPhrases,
            document_formats: backup.data.companyProfile.documentFormats,
            created_at: backup.exportedAt,
            updated_at: backup.exportedAt,
          },
        },
      ],
    },
    {
      order: 5,
      table: "prompt_assets",
      dependency: "workspaces.id, auth.users.id",
      rows: backup.data.prompts.map((prompt, promptIndex) => ({
        localId: prompt.id,
        pendingId: promptIdMap.get(prompt.id) || createPendingId("prompt", promptIndex + 1),
        payload: {
          id: promptIdMap.get(prompt.id) || createPendingId("prompt", promptIndex + 1),
          workspace_id: workspaceId,
          created_by_user_id: ownerUserId,
          title: prompt.title,
          source: prompt.source,
          model_used: toNullable(prompt.modelUsed),
          language_strategy: prompt.languageStrategy || "hybrid",
          language_decision: prompt.languageDecision || {},
          output_language: prompt.outputLanguage || "korean",
          source_skill_id: prompt.sourceSkillId
            ? skillIdMap.get(prompt.sourceSkillId) || prompt.sourceSkillId
            : null,
          source_skill_name: toNullable(prompt.sourceSkillName),
          improvement_source: remapImprovementSource(prompt.improvementSource, {
            feedbackIdMap,
            promptIdMap,
            versionIdMap,
          }),
          learning_context: prompt.learningContext || {},
          raw_input: prompt.rawInput,
          goal: prompt.goal,
          domain: prompt.domain,
          target_models: prompt.targetModels,
          target_model_decision: prompt.targetModelDecision || {},
          created_at: prompt.createdAt,
          updated_at: prompt.updatedAt,
        },
      })),
    },
    {
      order: 6,
      table: "prompt_versions",
      dependency: "prompt_assets.id",
      rows: backup.data.prompts.flatMap((prompt) =>
        prompt.versions.map((version) => ({
          localId: version.id,
          pendingId: versionIdMap.get(version.id) || version.id,
          payload: {
            id: versionIdMap.get(version.id) || version.id,
            prompt_asset_id: promptIdMap.get(prompt.id) || prompt.id,
            target_model: version.targetModel,
            model_label: version.modelLabel,
            content: version.content,
            quality_score: version.qualityScore,
            score_breakdown: version.scoreBreakdown,
            assumptions: version.assumptions,
            missing_context: version.missingContext,
            created_at: version.createdAt,
          },
        })),
      ),
    },
    {
      order: 7,
      table: "feedback",
      dependency: "prompt_assets.id, prompt_versions.id, auth.users.id",
      rows: backup.data.prompts.flatMap((prompt, promptIndex) =>
        prompt.feedback.map((feedback, feedbackIndex) => {
          const promptVersionId = versionIdMap.get(feedback.promptVersionId);

          if (!promptVersionId) {
            warningItems.push(
              createWarning({
                category: "relationship",
                severity: "review",
                message: `${prompt.title} 피드백 ${feedback.id}의 promptVersionId를 백업 버전 목록에서 찾지 못했습니다.`,
              }),
            );
          }

          return {
            localId: feedback.id,
            pendingId:
              feedbackIdMap.get(feedback.id) ||
              createPendingId(`prompt-${promptIndex + 1}-feedback`, feedbackIndex + 1),
            payload: {
              id:
                feedbackIdMap.get(feedback.id) ||
                createPendingId(
                  `prompt-${promptIndex + 1}-feedback`,
                  feedbackIndex + 1,
                ),
              prompt_asset_id: promptIdMap.get(prompt.id) || prompt.id,
              prompt_version_id: promptVersionId || feedback.promptVersionId,
              user_id: ownerUserId,
              rating: feedback.rating,
              comment: feedback.comment,
              feedback_type: feedback.feedbackType,
              created_at: feedback.createdAt,
            },
          };
        }),
      ),
    },
    {
      order: 8,
      table: "deleted_prompt_assets",
      dependency: "workspaces.id",
      rows: backup.data.deletedPrompts.map((deletedPrompt, deletedIndex) => ({
        localId: deletedPrompt.prompt.id,
        pendingId: createPendingId("deleted-prompt", deletedIndex + 1),
        payload: {
          id: createPendingId("deleted-prompt", deletedIndex + 1),
          workspace_id: workspaceId,
          original_prompt_asset_id: deletedPrompt.prompt.id,
          title: deletedPrompt.prompt.title,
          deleted_at: deletedPrompt.deletedAt,
          prompt_snapshot: deletedPrompt.prompt,
          restored_prompt_asset_id: null,
          created_at: deletedPrompt.deletedAt,
        },
      })),
    },
    {
      order: 9,
      table: "learning_memories",
      dependency: "workspaces.id",
      rows: backup.data.memories.map((memory, memoryIndex) => ({
        localId: memory.id,
        pendingId: createPendingId("memory", memoryIndex + 1),
        payload: {
          id: createPendingId("memory", memoryIndex + 1),
          workspace_id: workspaceId,
          scope: memory.scope,
          source_type: memory.sourceType,
          source_id: remapLearningMemorySourceId({
            companyProfileId,
            feedbackIdMap,
            memory,
            sourceCompanyProfileId: backup.data.companyProfile.id,
            sourceUserProfileId: backup.data.userProfile.id,
            userProfileId,
          }),
          title: memory.title,
          content: memory.content,
          tags: memory.tags,
          confidence: memory.confidence,
          created_at: memory.createdAt,
          updated_at: memory.updatedAt,
        },
      })),
    },
    {
      order: 10,
      table: "prompt_skills",
      dependency: "workspaces.id, auth.users.id",
      rows: backup.data.skills.map((skill, skillIndex) => ({
        localId: skill.id,
        pendingId: skillIdMap.get(skill.id) || createPendingId("skill", skillIndex + 1),
        payload: {
          id: skillIdMap.get(skill.id) || createPendingId("skill", skillIndex + 1),
          workspace_id: workspaceId,
          created_by_user_id: ownerUserId,
          name: skill.name,
          description: skill.description,
          domain: skill.domain,
          target_model: skill.targetModel,
          language_strategy: skill.languageStrategy || "hybrid",
          language_decision: skill.languageDecision || {},
          output_language: skill.outputLanguage || "korean",
          source_prompt_id: skill.sourcePromptId
            ? promptIdMap.get(skill.sourcePromptId) || skill.sourcePromptId
            : null,
          source_version_id: skill.sourceVersionId
            ? versionIdMap.get(skill.sourceVersionId) || skill.sourceVersionId
            : null,
          input_guide: skill.inputGuide,
          prompt_template: skill.promptTemplate,
          output_format: skill.outputFormat,
          quality_checklist: skill.qualityChecklist,
          tags: skill.tags,
          usage_count: skill.usageCount,
          last_run_at: toNullable(skill.lastRunAt),
          created_at: skill.createdAt,
          updated_at: skill.updatedAt,
        },
      })),
    },
  ];

  return {
    schemaVersion: backup.schemaVersion,
    totalRows: batches.reduce((sum, batch) => sum + batch.rows.length, 0),
    batches,
    warnings: warningItems.map(formatWarningLabel),
    warningItems,
  };
}

export function buildSupabaseImportDryRunText(dryRun: SupabaseImportDryRun) {
  const lines = [
    "# Prompt AI Studio Supabase Importer Dry-run",
    "",
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- totalRows: ${dryRun.totalRows}`,
    `- batches: ${dryRun.batches.length}`,
    `- warnings: ${dryRun.warnings.length}`,
    "",
    "## Insert batches",
    ...dryRun.batches.map(
      (batch) =>
        `- ${batch.order}. ${batch.table}: ${batch.rows.length} rows / dependency: ${batch.dependency}`,
    ),
    "",
    "## Warnings",
    ...(dryRun.warningItems.length > 0
      ? dryRun.warningItems.map((warning) => `- ${formatWarningLabel(warning)}`)
      : ["- 없음"]),
    "",
    "## Payload preview",
    "```json",
    JSON.stringify(dryRun.batches, null, 2),
    "```",
  ];

  return lines.join("\n");
}

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

const SUPABASE_WORKSPACE_ID_PLACEHOLDER = "<workspace_id>";
const SUPABASE_OWNER_USER_ID_PLACEHOLDER = "<owner_user_id>";
const SUPABASE_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const supabaseMigrationHandoffSectionTitles = [
  "Importer dry-run",
  "Pending ID replacement guide",
  "Row count verification SQL",
  "Relationship verification SQL",
  "Pending ID audit SQL",
  "RLS owner access audit SQL",
  "RLS policy draft SQL",
  "RLS smoke test checklist",
  "Verification report",
] as const;

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

function formatWarningLabel(warning: SupabaseImportWarning) {
  const categoryLabel =
    warning.category === "setup" ? "설정 필요" : "관계 참조 확인";
  const severityLabel = warning.severity === "required" ? "필수" : "검토";

  return `[${categoryLabel}/${severityLabel}] ${warning.message}`;
}

function countSqlChecks(sql: string) {
  const checkOrders = [...sql.matchAll(/\b(\d+) as check_order,/g)].map(
    (match) => Number(match[1]),
  );

  if (checkOrders.length === 0) {
    return 0;
  }

  const uniqueOrders = new Set(checkOrders);
  const highestOrder = Math.max(...checkOrders);
  const isSequential =
    uniqueOrders.size === checkOrders.length &&
    checkOrders.length === highestOrder &&
    checkOrders.every((order) => order >= 1 && order <= highestOrder);

  if (!isSequential) {
    throw new Error(
      `Supabase SQL check_order values must be contiguous from 1. Found: ${checkOrders.join(
        ", ",
      )}`,
    );
  }

  return checkOrders.length;
}

function countRlsPolicyTables(sql: string) {
  const tableNames = [
    ...sql.matchAll(/alter table public\.([a-z_]+) enable row level security;/g),
  ].map((match) => match[1]);

  return new Set(tableNames).size;
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

function getDryRunBatchRows(dryRun: SupabaseImportDryRun, table: string) {
  return dryRun.batches.find((batch) => batch.table === table)?.rows || [];
}

function formatPendingReplacementRows(rows: SupabaseImportRow[]) {
  const mappedRows = rows.filter((row) => row.localId);

  if (mappedRows.length === 0) {
    return ["- No local IDs in this batch"];
  }

  return mappedRows.map((row) => `- ${row.localId} -> ${row.pendingId}`);
}

export function buildSupabaseImportReferenceReplacementGuideText(
  dryRun: SupabaseImportDryRun,
) {
  const replacementTables = [
    "user_profiles",
    "company_profiles",
    "prompt_assets",
    "prompt_versions",
    "feedback",
    "learning_memories",
    "prompt_skills",
  ];
  const tableSections = replacementTables.flatMap((table) => [
    `### ${table}`,
    ...formatPendingReplacementRows(getDryRunBatchRows(dryRun, table)),
    "",
  ]);
  const deletedArchiveRows = getDryRunBatchRows(dryRun, "deleted_prompt_assets");

  return [
    "## Pending ID replacement guide",
    "",
    "Use this guide when implementing the real Supabase importer. Dry-run IDs show reference positions only; production inserts must use Supabase UUIDs or pre-generated UUIDs.",
    "",
    "### Required rewrites",
    "- Replace every `pending-*` primary key and foreign key with a real UUID before insert.",
    "- Rewrite `prompt_assets.improvement_source.sourcePromptId` and `sourceVersionId` for active source prompts/versions.",
    "- Rewrite `prompt_assets.improvement_source.sourceFeedback.id` and `sourceFeedback.promptVersionId` for active source feedback.",
    "- Rewrite `learning_memories.source_id` when `source_type` is `feedback`, `profile`, or `company`.",
    "- Keep `deleted_prompt_assets.original_prompt_asset_id` and IDs inside `prompt_snapshot` as archive trace IDs; these are used by deleted-source relationship checks.",
    "- After import, run the pending ID audit SQL. Any remaining `pending-*` value is a failed import.",
    "",
    "### Local to pending map",
    ...tableSections,
    "### deleted_prompt_assets archive trace IDs",
    ...(deletedArchiveRows.length > 0
      ? deletedArchiveRows.map(
          (row) =>
            `- ${row.localId || "unknown"} -> ${row.pendingId} (archive row; original ID remains in original_prompt_asset_id)`,
        )
      : ["- No deleted archive rows"]),
  ].join("\n");
}

function getWorkspaceScopedCountSql(table: string) {
  if (table === "workspaces") {
    return [
      "select count(*)",
      "  from workspaces workspaces_row",
      "  join target_workspace on target_workspace.workspace_id = workspaces_row.id",
    ].join("\n");
  }

  if (table === "prompt_versions") {
    return [
      "select count(*)",
      "  from prompt_versions prompt_versions_row",
      "  join prompt_assets prompt_assets_row",
      "    on prompt_assets_row.id = prompt_versions_row.prompt_asset_id",
      "  join target_workspace",
      "    on target_workspace.workspace_id = prompt_assets_row.workspace_id",
    ].join("\n");
  }

  if (table === "feedback") {
    return [
      "select count(*)",
      "  from feedback feedback_row",
      "  join prompt_assets prompt_assets_row",
      "    on prompt_assets_row.id = feedback_row.prompt_asset_id",
      "  join target_workspace",
      "    on target_workspace.workspace_id = prompt_assets_row.workspace_id",
    ].join("\n");
  }

  return [
    "select count(*)",
    `  from ${table} ${table}_row`,
    "  join target_workspace",
    `    on target_workspace.workspace_id = ${table}_row.workspace_id`,
  ].join("\n");
}

export function buildSupabaseImportVerificationSql(
  dryRun: SupabaseImportDryRun,
  options: { workspaceId?: string } = {},
) {
  const workspaceId = options.workspaceId?.trim();
  const workspaceIdValue =
    workspaceId && isSupabaseWorkspaceUuid(workspaceId)
      ? workspaceId
      : SUPABASE_WORKSPACE_ID_PLACEHOLDER;
  const countChecks = dryRun.batches.map((batch) => {
    const countSql = getWorkspaceScopedCountSql(batch.table);

    return [
      "select",
      `  ${batch.order} as check_order,`,
      `  '${batch.table}' as table_name,`,
      `  ${batch.rows.length} as expected_rows,`,
      `  (${countSql}) as actual_rows`,
    ].join("\n");
  });

  return [
    "-- Prompt AI Studio Supabase import verification",
    "-- Run after importer execution. This query is read-only.",
    workspaceIdValue === SUPABASE_WORKSPACE_ID_PLACEHOLDER
      ? "-- Replace <workspace_id> with the imported workspace UUID before running."
      : `-- Target workspace_id: ${workspaceIdValue}`,
    "",
    "with target_workspace as (",
    `  select '${workspaceIdValue}'::uuid as workspace_id`,
    "),",
    "checks as (",
    countChecks.join("\nunion all\n"),
    ")",
    "select",
    "  check_order,",
    "  table_name,",
    "  expected_rows,",
    "  actual_rows,",
    "  case when actual_rows = expected_rows",
    "    then 'pass'",
    "    else 'review'",
    "  end as status",
    "from checks",
    "order by check_order;",
  ].join("\n");
}

export function buildSupabaseImportRelationshipVerificationSql(
  options: { workspaceId?: string } = {},
) {
  const workspaceId = options.workspaceId?.trim();
  const workspaceIdValue =
    workspaceId && isSupabaseWorkspaceUuid(workspaceId)
      ? workspaceId
      : SUPABASE_WORKSPACE_ID_PLACEHOLDER;

  return [
    "-- Prompt AI Studio Supabase relationship verification",
    "-- Run after importer execution. This query is read-only.",
    workspaceIdValue === SUPABASE_WORKSPACE_ID_PLACEHOLDER
      ? "-- Replace <workspace_id> with the imported workspace UUID before running."
      : `-- Target workspace_id: ${workspaceIdValue}`,
    "",
    "with target_workspace as (",
    `  select '${workspaceIdValue}'::uuid as workspace_id`,
    "),",
    "workspace_prompt_assets as (",
    "  select prompt_assets.*",
    "  from prompt_assets",
    "  join target_workspace",
    "    on target_workspace.workspace_id = prompt_assets.workspace_id",
    "),",
    "workspace_deleted_prompt_assets as (",
    "  select deleted_prompt_assets.*",
    "  from deleted_prompt_assets",
    "  join target_workspace",
    "    on target_workspace.workspace_id = deleted_prompt_assets.workspace_id",
    "),",
    "workspace_deleted_prompt_versions as (",
    "  select",
    "    deleted_prompt.original_prompt_asset_id,",
    "    version_item->>'id' as original_version_id",
    "  from workspace_deleted_prompt_assets deleted_prompt",
    "  cross join lateral jsonb_array_elements(",
    "    coalesce(deleted_prompt.prompt_snapshot->'versions', '[]'::jsonb)",
    "  ) version_item",
    "),",
    "workspace_deleted_prompt_feedback as (",
    "  select",
    "    deleted_prompt.original_prompt_asset_id,",
    "    feedback_item->>'id' as original_feedback_id,",
    "    feedback_item->>'promptVersionId' as original_feedback_version_id",
    "  from workspace_deleted_prompt_assets deleted_prompt",
    "  cross join lateral jsonb_array_elements(",
    "    coalesce(deleted_prompt.prompt_snapshot->'feedback', '[]'::jsonb)",
    "  ) feedback_item",
    "),",
    "workspace_prompt_skills as (",
    "  select prompt_skills.*",
    "  from prompt_skills",
    "  join target_workspace",
    "    on target_workspace.workspace_id = prompt_skills.workspace_id",
    "),",
    "workspace_learning_memories as (",
    "  select learning_memories.*",
    "  from learning_memories",
    "  join target_workspace",
    "    on target_workspace.workspace_id = learning_memories.workspace_id",
    "),",
    "workspace_user_profiles as (",
    "  select user_profiles.*",
    "  from user_profiles",
    "  join target_workspace",
    "    on target_workspace.workspace_id = user_profiles.workspace_id",
    "),",
    "workspace_company_profiles as (",
    "  select company_profiles.*",
    "  from company_profiles",
    "  join target_workspace",
    "    on target_workspace.workspace_id = company_profiles.workspace_id",
    "),",
    "checks as (",
    "select",
    "  1 as check_order,",
    "  'prompt_assets.source_skill_id' as relation_name,",
    "  'source_skill_id should resolve to a prompt_skills row in the same workspace' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_assets prompt_asset",
    "    left join workspace_prompt_skills source_skill",
    "      on source_skill.id = prompt_asset.source_skill_id",
    "    where prompt_asset.source_skill_id is not null",
    "      and source_skill.id is null",
    "  ) as issue_count",
    "union all",
    "select",
    "  2 as check_order,",
    "  'prompt_assets.improvement_source.sourcePromptId' as relation_name,",
    "  'improvement source prompt should resolve as active prompt or deleted archive snapshot inside the same workspace when present' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_assets prompt_asset",
    "    left join workspace_prompt_assets source_prompt",
    "      on source_prompt.id = case",
    "        when prompt_asset.improvement_source->>'sourcePromptId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'",
    "          then (prompt_asset.improvement_source->>'sourcePromptId')::uuid",
    "        else null",
    "      end",
    "    left join workspace_deleted_prompt_assets deleted_source_prompt",
    "      on deleted_source_prompt.original_prompt_asset_id = prompt_asset.improvement_source->>'sourcePromptId'",
    "    where nullif(prompt_asset.improvement_source->>'sourcePromptId', '') is not null",
    "      and source_prompt.id is null",
    "      and deleted_source_prompt.id is null",
    "  ) as issue_count",
    "union all",
    "select",
    "  3 as check_order,",
    "  'prompt_assets.improvement_source.sourceVersionId' as relation_name,",
    "  'improvement source version should resolve as active version or deleted archive snapshot version inside the same workspace when present' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_assets prompt_asset",
    "    left join prompt_versions source_version",
    "      on source_version.id = case",
    "        when prompt_asset.improvement_source->>'sourceVersionId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'",
    "          then (prompt_asset.improvement_source->>'sourceVersionId')::uuid",
    "        else null",
    "      end",
    "    left join workspace_prompt_assets source_prompt",
    "      on source_prompt.id = source_version.prompt_asset_id",
    "    left join workspace_deleted_prompt_versions deleted_source_version",
    "      on deleted_source_version.original_version_id = prompt_asset.improvement_source->>'sourceVersionId'",
    "    where nullif(prompt_asset.improvement_source->>'sourceVersionId', '') is not null",
    "      and source_prompt.id is null",
    "      and deleted_source_version.original_version_id is null",
    "  ) as issue_count",
    "union all",
    "select",
    "  4 as check_order,",
    "  'prompt_assets.improvement_source.sourceFeedback.id' as relation_name,",
    "  'improvement source feedback should resolve as active feedback or deleted archive snapshot feedback when present' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_assets prompt_asset",
    "    left join feedback source_feedback",
    "      on source_feedback.id = case",
    "        when prompt_asset.improvement_source->'sourceFeedback'->>'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'",
    "          then (prompt_asset.improvement_source->'sourceFeedback'->>'id')::uuid",
    "        else null",
    "      end",
    "    left join workspace_prompt_assets feedback_prompt",
    "      on feedback_prompt.id = source_feedback.prompt_asset_id",
    "    left join workspace_deleted_prompt_feedback deleted_source_feedback",
    "      on deleted_source_feedback.original_feedback_id = prompt_asset.improvement_source->'sourceFeedback'->>'id'",
    "    where nullif(prompt_asset.improvement_source->'sourceFeedback'->>'id', '') is not null",
    "      and feedback_prompt.id is null",
    "      and deleted_source_feedback.original_feedback_id is null",
    "  ) as issue_count",
    "union all",
    "select",
    "  5 as check_order,",
    "  'prompt_assets.improvement_source.sourceFeedback.promptVersionId' as relation_name,",
    "  'improvement source feedback version should resolve as active version or deleted archive snapshot version when present' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_assets prompt_asset",
    "    left join prompt_versions source_feedback_version",
    "      on source_feedback_version.id = case",
    "        when prompt_asset.improvement_source->'sourceFeedback'->>'promptVersionId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'",
    "          then (prompt_asset.improvement_source->'sourceFeedback'->>'promptVersionId')::uuid",
    "        else null",
    "      end",
    "    left join workspace_prompt_assets feedback_version_prompt",
    "      on feedback_version_prompt.id = source_feedback_version.prompt_asset_id",
    "    left join workspace_deleted_prompt_versions deleted_feedback_version",
    "      on deleted_feedback_version.original_version_id = prompt_asset.improvement_source->'sourceFeedback'->>'promptVersionId'",
    "    where nullif(prompt_asset.improvement_source->'sourceFeedback'->>'promptVersionId', '') is not null",
    "      and feedback_version_prompt.id is null",
    "      and deleted_feedback_version.original_version_id is null",
    "  ) as issue_count",
    "union all",
    "select",
    "  6 as check_order,",
    "  'prompt_assets.improvement_source.sourceFeedback completeness' as relation_name,",
    "  'sourceFeedback should include both id and promptVersionId when present' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_assets prompt_asset",
    "    where prompt_asset.improvement_source ? 'sourceFeedback'",
    "      and (",
    "        nullif(prompt_asset.improvement_source->'sourceFeedback'->>'id', '') is null",
    "        or nullif(prompt_asset.improvement_source->'sourceFeedback'->>'promptVersionId', '') is null",
    "      )",
    "  ) as issue_count",
    "union all",
    "select",
    "  7 as check_order,",
    "  'prompt_assets.improvement_source.sourceFeedback pair' as relation_name,",
    "  'sourceFeedback.id should belong to sourceFeedback.promptVersionId when both are present' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_assets prompt_asset",
    "    left join feedback source_feedback",
    "      on source_feedback.id = case",
    "        when prompt_asset.improvement_source->'sourceFeedback'->>'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'",
    "          then (prompt_asset.improvement_source->'sourceFeedback'->>'id')::uuid",
    "        else null",
    "      end",
    "    left join workspace_prompt_assets feedback_prompt",
    "      on feedback_prompt.id = source_feedback.prompt_asset_id",
    "    left join workspace_deleted_prompt_feedback deleted_source_feedback",
    "      on deleted_source_feedback.original_feedback_id = prompt_asset.improvement_source->'sourceFeedback'->>'id'",
    "    where nullif(prompt_asset.improvement_source->'sourceFeedback'->>'id', '') is not null",
    "      and nullif(prompt_asset.improvement_source->'sourceFeedback'->>'promptVersionId', '') is not null",
    "      and not (",
    "        feedback_prompt.id is not null",
    "        and source_feedback.prompt_version_id::text = prompt_asset.improvement_source->'sourceFeedback'->>'promptVersionId'",
    "      )",
    "      and not (",
    "        deleted_source_feedback.original_feedback_id is not null",
    "        and deleted_source_feedback.original_feedback_version_id = prompt_asset.improvement_source->'sourceFeedback'->>'promptVersionId'",
    "      )",
    "  ) as issue_count",
    "union all",
    "select",
    "  8 as check_order,",
    "  'feedback.prompt_version_id' as relation_name,",
    "  'feedback version should belong to the same prompt asset' as expectation,",
    "  (",
    "    select count(*)",
    "    from feedback",
    "    join workspace_prompt_assets prompt_asset",
    "      on prompt_asset.id = feedback.prompt_asset_id",
    "    left join prompt_versions prompt_version",
    "      on prompt_version.id = feedback.prompt_version_id",
    "     and prompt_version.prompt_asset_id = feedback.prompt_asset_id",
    "    where prompt_version.id is null",
    "  ) as issue_count",
    "union all",
    "select",
    "  9 as check_order,",
    "  'prompt_skills.source_prompt_id' as relation_name,",
    "  'skill source prompt should resolve inside the same workspace when present' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_skills skill",
    "    left join workspace_prompt_assets source_prompt",
    "      on source_prompt.id = skill.source_prompt_id",
    "    where skill.source_prompt_id is not null",
    "      and source_prompt.id is null",
    "  ) as issue_count",
    "union all",
    "select",
    "  10 as check_order,",
    "  'prompt_skills.source_version_id' as relation_name,",
    "  'skill source version should resolve inside the same workspace when present' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_skills skill",
    "    left join prompt_versions source_version",
    "      on source_version.id = skill.source_version_id",
    "    left join workspace_prompt_assets source_prompt",
    "      on source_prompt.id = source_version.prompt_asset_id",
    "    where skill.source_version_id is not null",
    "      and source_prompt.id is null",
    "  ) as issue_count",
    "union all",
    "select",
    "  11 as check_order,",
    "  'prompt_skills.source_prompt_id/source_version_id' as relation_name,",
    "  'skill source version should belong to source prompt when both are present' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_skills skill",
    "    join prompt_versions source_version",
    "      on source_version.id = skill.source_version_id",
    "    where skill.source_prompt_id is not null",
    "      and skill.source_version_id is not null",
    "      and source_version.prompt_asset_id <> skill.source_prompt_id",
    "  ) as issue_count",
    "union all",
    "select",
    "  12 as check_order,",
    "  'learning_memories.source_id feedback' as relation_name,",
    "  'feedback memories should resolve to feedback attached to the workspace' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_learning_memories memory",
    "    left join feedback",
    "      on feedback.id::text = memory.source_id",
    "    left join workspace_prompt_assets prompt_asset",
    "      on prompt_asset.id = feedback.prompt_asset_id",
    "    where memory.source_type = 'feedback'",
    "      and prompt_asset.id is null",
    "  ) as issue_count",
    "union all",
    "select",
    "  13 as check_order,",
    "  'learning_memories.source_id profile' as relation_name,",
    "  'profile memories should resolve to the workspace user profile' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_learning_memories memory",
    "    left join workspace_user_profiles user_profile",
    "      on user_profile.id::text = memory.source_id",
    "    where memory.source_type = 'profile'",
    "      and user_profile.id is null",
    "  ) as issue_count",
    "union all",
    "select",
    "  14 as check_order,",
    "  'learning_memories.source_id company' as relation_name,",
    "  'company memories should resolve to the workspace company profile' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_learning_memories memory",
    "    left join workspace_company_profiles company_profile",
    "      on company_profile.id::text = memory.source_id",
    "    where memory.source_type = 'company'",
    "      and company_profile.id is null",
    "  ) as issue_count",
    ")",
    "select",
    "  check_order,",
    "  relation_name,",
    "  expectation,",
    "  issue_count,",
    "  case when issue_count = 0",
    "    then 'pass'",
    "    else 'review'",
    "  end as status",
    "from checks",
    "order by check_order;",
  ].join("\n");
}

export function buildSupabaseImportPendingIdAuditSql(
  options: { workspaceId?: string } = {},
) {
  const workspaceId = options.workspaceId?.trim();
  const workspaceIdValue =
    workspaceId && isSupabaseWorkspaceUuid(workspaceId)
      ? workspaceId
      : SUPABASE_WORKSPACE_ID_PLACEHOLDER;

  return [
    "-- Prompt AI Studio Supabase pending ID audit",
    "-- Run after importer execution. This query is read-only.",
    workspaceIdValue === SUPABASE_WORKSPACE_ID_PLACEHOLDER
      ? "-- Replace <workspace_id> with the imported workspace UUID before running."
      : `-- Target workspace_id: ${workspaceIdValue}`,
    "",
    "with target_workspace as (",
    `  select '${workspaceIdValue}'::uuid as workspace_id`,
    "),",
    "workspace_prompt_assets as (",
    "  select prompt_assets.*",
    "  from prompt_assets",
    "  join target_workspace",
    "    on target_workspace.workspace_id = prompt_assets.workspace_id",
    "),",
    "workspace_deleted_prompt_assets as (",
    "  select deleted_prompt_assets.*",
    "  from deleted_prompt_assets",
    "  join target_workspace",
    "    on target_workspace.workspace_id = deleted_prompt_assets.workspace_id",
    "),",
    "workspace_prompt_skills as (",
    "  select prompt_skills.*",
    "  from prompt_skills",
    "  join target_workspace",
    "    on target_workspace.workspace_id = prompt_skills.workspace_id",
    "),",
    "workspace_learning_memories as (",
    "  select learning_memories.*",
    "  from learning_memories",
    "  join target_workspace",
    "    on target_workspace.workspace_id = learning_memories.workspace_id",
    "),",
    "checks as (",
    "select",
    "  1 as check_order,",
    "  'prompt_assets.improvement_source' as field_name,",
    "  'jsonb improvement_source should not contain pending-* IDs' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_assets prompt_asset",
    "    where prompt_asset.improvement_source::text like '%pending-%'",
    "  ) as issue_count",
    "union all",
    "select",
    "  2 as check_order,",
    "  'prompt_assets.language_decision' as field_name,",
    "  'jsonb language_decision should not contain pending-* IDs' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_assets prompt_asset",
    "    where prompt_asset.language_decision::text like '%pending-%'",
    "  ) as issue_count",
    "union all",
    "select",
    "  3 as check_order,",
    "  'prompt_assets.target_model_decision' as field_name,",
    "  'jsonb target_model_decision should not contain pending-* IDs' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_assets prompt_asset",
    "    where prompt_asset.target_model_decision::text like '%pending-%'",
    "  ) as issue_count",
    "union all",
    "select",
    "  4 as check_order,",
    "  'learning_memories.source_id' as field_name,",
    "  'learning memory source_id should not contain pending-* IDs' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_learning_memories memory",
    "    where memory.source_id like 'pending-%'",
    "  ) as issue_count",
    "union all",
    "select",
    "  5 as check_order,",
    "  'prompt_skills.language_decision' as field_name,",
    "  'jsonb skill language_decision should not contain pending-* IDs' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_prompt_skills skill",
    "    where skill.language_decision::text like '%pending-%'",
    "  ) as issue_count",
    "union all",
    "select",
    "  6 as check_order,",
    "  'deleted_prompt_assets.prompt_snapshot' as field_name,",
    "  'deleted prompt snapshot should not contain pending-* IDs' as expectation,",
    "  (",
    "    select count(*)",
    "    from workspace_deleted_prompt_assets deleted_prompt",
    "    where deleted_prompt.prompt_snapshot::text like '%pending-%'",
    "  ) as issue_count",
    ")",
    "select",
    "  check_order,",
    "  field_name,",
    "  expectation,",
    "  issue_count,",
    "  case when issue_count = 0",
    "    then 'pass'",
    "    else 'review'",
    "  end as status",
    "from checks",
    "order by check_order;",
  ].join("\n");
}

export function buildSupabaseImportRlsAccessAuditSql(
  options: { ownerUserId?: string; workspaceId?: string } = {},
) {
  const workspaceId = options.workspaceId?.trim();
  const ownerUserId = options.ownerUserId?.trim();
  const workspaceIdValue =
    workspaceId && isSupabaseWorkspaceUuid(workspaceId)
      ? workspaceId
      : SUPABASE_WORKSPACE_ID_PLACEHOLDER;
  const ownerUserIdValue =
    ownerUserId && isSupabaseWorkspaceUuid(ownerUserId)
      ? ownerUserId
      : SUPABASE_OWNER_USER_ID_PLACEHOLDER;

  return [
    "-- Prompt AI Studio Supabase RLS owner access audit",
    "-- Run after importer execution and before enabling strict production usage.",
    "-- This is a read-only prerequisite audit. It does not replace an authenticated app-session RLS smoke test.",
    workspaceIdValue === SUPABASE_WORKSPACE_ID_PLACEHOLDER ||
    ownerUserIdValue === SUPABASE_OWNER_USER_ID_PLACEHOLDER
      ? "-- Replace <workspace_id> and <owner_user_id> before running."
      : `-- Target workspace_id: ${workspaceIdValue} / owner_user_id: ${ownerUserIdValue}`,
    "",
    "with target_context as (",
    `  select '${workspaceIdValue}'::uuid as workspace_id,`,
    `         '${ownerUserIdValue}'::uuid as owner_user_id`,
    "),",
    "checks as (",
    "select",
    "  1 as check_order,",
    "  'workspaces.owner_user_id' as check_name,",
    "  'target workspace should exist and match the imported owner user' as expectation,",
    "  (",
    "    select count(*)",
    "    from target_context context",
    "    where not exists (",
    "      select 1",
    "      from workspaces workspace",
    "      where workspace.id = context.workspace_id",
    "        and workspace.owner_user_id = context.owner_user_id",
    "    )",
    "  ) as issue_count",
    "union all",
    "select",
    "  2 as check_order,",
    "  'workspace_members owner row' as check_name,",
    "  'owner user should have exactly one owner membership in the workspace' as expectation,",
    "  (",
    "    select case when count(*) = 1 then 0 else 1 end",
    "    from workspace_members member",
    "    join target_context context",
    "      on context.workspace_id = member.workspace_id",
    "     and context.owner_user_id = member.user_id",
    "    where member.role = 'owner'",
    "  ) as issue_count",
    "union all",
    "select",
    "  3 as check_order,",
    "  'user_profiles owner mapping' as check_name,",
    "  'imported user profile should be attached to the owner user and workspace' as expectation,",
    "  (",
    "    select case when count(*) >= 1 then 0 else 1 end",
    "    from user_profiles user_profile",
    "    join target_context context",
    "      on context.workspace_id = user_profile.workspace_id",
    "     and context.owner_user_id = user_profile.user_id",
    "  ) as issue_count",
    "union all",
    "select",
    "  4 as check_order,",
    "  'prompt_assets.created_by_user_id' as check_name,",
    "  'all imported prompt assets should be owned by the target owner user' as expectation,",
    "  (",
    "    select count(*)",
    "    from prompt_assets prompt_asset",
    "    join target_context context",
    "      on context.workspace_id = prompt_asset.workspace_id",
    "    where prompt_asset.created_by_user_id <> context.owner_user_id",
    "  ) as issue_count",
    "union all",
    "select",
    "  5 as check_order,",
    "  'feedback.user_id' as check_name,",
    "  'all imported feedback rows should be attached to the target owner user' as expectation,",
    "  (",
    "    select count(*)",
    "    from feedback feedback_row",
    "    join prompt_assets prompt_asset",
    "      on prompt_asset.id = feedback_row.prompt_asset_id",
    "    join target_context context",
    "      on context.workspace_id = prompt_asset.workspace_id",
    "    where feedback_row.user_id <> context.owner_user_id",
    "  ) as issue_count",
    "union all",
    "select",
    "  6 as check_order,",
    "  'prompt_skills.created_by_user_id' as check_name,",
    "  'all imported prompt skills should be owned by the target owner user' as expectation,",
    "  (",
    "    select count(*)",
    "    from prompt_skills skill",
    "    join target_context context",
    "      on context.workspace_id = skill.workspace_id",
    "    where skill.created_by_user_id <> context.owner_user_id",
    "  ) as issue_count",
    "union all",
    "select",
    "  7 as check_order,",
    "  'company_profiles workspace mapping' as check_name,",
    "  'imported company profile should be attached to the target workspace' as expectation,",
    "  (",
    "    select case when count(*) >= 1 then 0 else 1 end",
    "    from company_profiles company_profile",
    "    join target_context context",
    "      on context.workspace_id = company_profile.workspace_id",
    "  ) as issue_count",
    "union all",
    "select",
    "  8 as check_order,",
    "  'deleted_prompt_assets prompt_snapshot' as check_name,",
    "  'deleted prompt archive rows should keep their prompt snapshot' as expectation,",
    "  (",
    "    select count(*)",
    "    from deleted_prompt_assets deleted_prompt",
    "    join target_context context",
    "      on context.workspace_id = deleted_prompt.workspace_id",
    "    where deleted_prompt.prompt_snapshot is null",
    "  ) as issue_count",
    ")",
    "select",
    "  check_order,",
    "  check_name,",
    "  expectation,",
    "  issue_count,",
    "  case when issue_count = 0",
    "    then 'pass'",
    "    else 'review'",
    "  end as status",
    "from checks",
    "order by check_order;",
  ].join("\n");
}

export function buildSupabaseRlsPolicyDraftSql() {
  return [
    "-- Prompt AI Studio Supabase RLS policy draft",
    "-- Review and adapt before running in a Supabase project.",
    "-- This draft assumes workspace_members is the source of workspace access.",
    "-- Suggested role semantics: owner/admin/member can write; viewer can read.",
    "",
    "create or replace function public.is_workspace_member(target_workspace_id uuid)",
    "returns boolean",
    "language sql",
    "stable",
    "security definer",
    "set search_path = public",
    "as $$",
    "  select exists (",
    "    select 1",
    "    from public.workspace_members member",
    "    where member.workspace_id = target_workspace_id",
    "      and member.user_id = auth.uid()",
    "  );",
    "$$;",
    "",
    "create or replace function public.has_workspace_role(",
    "  target_workspace_id uuid,",
    "  allowed_roles text[]",
    ")",
    "returns boolean",
    "language sql",
    "stable",
    "security definer",
    "set search_path = public",
    "as $$",
    "  select exists (",
    "    select 1",
    "    from public.workspace_members member",
    "    where member.workspace_id = target_workspace_id",
    "      and member.user_id = auth.uid()",
    "      and member.role = any(allowed_roles)",
    "  );",
    "$$;",
    "",
    "alter table public.workspaces enable row level security;",
    "alter table public.workspace_members enable row level security;",
    "alter table public.user_profiles enable row level security;",
    "alter table public.company_profiles enable row level security;",
    "alter table public.prompt_assets enable row level security;",
    "alter table public.prompt_versions enable row level security;",
    "alter table public.feedback enable row level security;",
    "alter table public.deleted_prompt_assets enable row level security;",
    "alter table public.learning_memories enable row level security;",
    "alter table public.prompt_skills enable row level security;",
    "alter table public.document_sources enable row level security;",
    "alter table public.document_chunks enable row level security;",
    "",
    "drop policy if exists workspace_read on public.workspaces;",
    "create policy workspace_read on public.workspaces",
    "  for select",
    "  using (public.is_workspace_member(id));",
    "",
    "drop policy if exists workspace_insert_owner on public.workspaces;",
    "create policy workspace_insert_owner on public.workspaces",
    "  for insert",
    "  with check (owner_user_id = auth.uid());",
    "",
    "drop policy if exists workspace_update_owner_admin on public.workspaces;",
    "create policy workspace_update_owner_admin on public.workspaces",
    "  for update",
    "  using (public.has_workspace_role(id, array['owner', 'admin']))",
    "  with check (public.has_workspace_role(id, array['owner', 'admin']));",
    "",
    "drop policy if exists workspace_members_read on public.workspace_members;",
    "create policy workspace_members_read on public.workspace_members",
    "  for select",
    "  using (public.is_workspace_member(workspace_id));",
    "",
    "drop policy if exists workspace_members_write_owner_admin on public.workspace_members;",
    "create policy workspace_members_write_owner_admin on public.workspace_members",
    "  for all",
    "  using (public.has_workspace_role(workspace_id, array['owner', 'admin']))",
    "  with check (public.has_workspace_role(workspace_id, array['owner', 'admin']));",
    "",
    "-- Workspace-owned tables with direct workspace_id.",
    "drop policy if exists user_profiles_read on public.user_profiles;",
    "create policy user_profiles_read on public.user_profiles",
    "  for select",
    "  using (public.is_workspace_member(workspace_id));",
    "drop policy if exists user_profiles_write_member on public.user_profiles;",
    "create policy user_profiles_write_member on public.user_profiles",
    "  for all",
    "  using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']))",
    "  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));",
    "",
    "drop policy if exists company_profiles_read on public.company_profiles;",
    "create policy company_profiles_read on public.company_profiles",
    "  for select",
    "  using (public.is_workspace_member(workspace_id));",
    "drop policy if exists company_profiles_write_member on public.company_profiles;",
    "create policy company_profiles_write_member on public.company_profiles",
    "  for all",
    "  using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']))",
    "  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));",
    "",
    "drop policy if exists prompt_assets_read on public.prompt_assets;",
    "create policy prompt_assets_read on public.prompt_assets",
    "  for select",
    "  using (public.is_workspace_member(workspace_id));",
    "drop policy if exists prompt_assets_write_member on public.prompt_assets;",
    "create policy prompt_assets_write_member on public.prompt_assets",
    "  for all",
    "  using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']))",
    "  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));",
    "",
    "drop policy if exists deleted_prompt_assets_read on public.deleted_prompt_assets;",
    "create policy deleted_prompt_assets_read on public.deleted_prompt_assets",
    "  for select",
    "  using (public.is_workspace_member(workspace_id));",
    "drop policy if exists deleted_prompt_assets_write_member on public.deleted_prompt_assets;",
    "create policy deleted_prompt_assets_write_member on public.deleted_prompt_assets",
    "  for all",
    "  using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']))",
    "  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));",
    "",
    "drop policy if exists learning_memories_read on public.learning_memories;",
    "create policy learning_memories_read on public.learning_memories",
    "  for select",
    "  using (public.is_workspace_member(workspace_id));",
    "drop policy if exists learning_memories_write_member on public.learning_memories;",
    "create policy learning_memories_write_member on public.learning_memories",
    "  for all",
    "  using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']))",
    "  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));",
    "",
    "drop policy if exists prompt_skills_read on public.prompt_skills;",
    "create policy prompt_skills_read on public.prompt_skills",
    "  for select",
    "  using (public.is_workspace_member(workspace_id));",
    "drop policy if exists prompt_skills_write_member on public.prompt_skills;",
    "create policy prompt_skills_write_member on public.prompt_skills",
    "  for all",
    "  using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']))",
    "  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));",
    "",
    "drop policy if exists document_sources_read on public.document_sources;",
    "create policy document_sources_read on public.document_sources",
    "  for select",
    "  using (public.is_workspace_member(workspace_id));",
    "drop policy if exists document_sources_write_member on public.document_sources;",
    "create policy document_sources_write_member on public.document_sources",
    "  for all",
    "  using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']))",
    "  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));",
    "",
    "drop policy if exists document_chunks_read on public.document_chunks;",
    "create policy document_chunks_read on public.document_chunks",
    "  for select",
    "  using (public.is_workspace_member(workspace_id));",
    "drop policy if exists document_chunks_write_member on public.document_chunks;",
    "create policy document_chunks_write_member on public.document_chunks",
    "  for all",
    "  using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']))",
    "  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));",
    "",
    "-- Tables scoped through prompt_assets.",
    "drop policy if exists prompt_versions_read on public.prompt_versions;",
    "create policy prompt_versions_read on public.prompt_versions",
    "  for select",
    "  using (exists (",
    "    select 1 from public.prompt_assets asset",
    "    where asset.id = prompt_versions.prompt_asset_id",
    "      and public.is_workspace_member(asset.workspace_id)",
    "  ));",
    "drop policy if exists prompt_versions_write_member on public.prompt_versions;",
    "create policy prompt_versions_write_member on public.prompt_versions",
    "  for all",
    "  using (exists (",
    "    select 1 from public.prompt_assets asset",
    "    where asset.id = prompt_versions.prompt_asset_id",
    "      and public.has_workspace_role(asset.workspace_id, array['owner', 'admin', 'member'])",
    "  ))",
    "  with check (exists (",
    "    select 1 from public.prompt_assets asset",
    "    where asset.id = prompt_versions.prompt_asset_id",
    "      and public.has_workspace_role(asset.workspace_id, array['owner', 'admin', 'member'])",
    "  ));",
    "",
    "drop policy if exists feedback_read on public.feedback;",
    "create policy feedback_read on public.feedback",
    "  for select",
    "  using (exists (",
    "    select 1 from public.prompt_assets asset",
    "    where asset.id = feedback.prompt_asset_id",
    "      and public.is_workspace_member(asset.workspace_id)",
    "  ));",
    "drop policy if exists feedback_write_member on public.feedback;",
    "create policy feedback_write_member on public.feedback",
    "  for all",
    "  using (exists (",
    "    select 1 from public.prompt_assets asset",
    "    where asset.id = feedback.prompt_asset_id",
    "      and public.has_workspace_role(asset.workspace_id, array['owner', 'admin', 'member'])",
    "  ))",
    "  with check (exists (",
    "    select 1 from public.prompt_assets asset",
    "    where asset.id = feedback.prompt_asset_id",
    "      and public.has_workspace_role(asset.workspace_id, array['owner', 'admin', 'member'])",
    "      and feedback.user_id = auth.uid()",
    "  ));",
  ].join("\n");
}

export function buildSupabaseRlsSmokeTestChecklistText(
  options: { ownerUserId?: string; workspaceId?: string } = {},
) {
  const workspaceId = options.workspaceId?.trim();
  const ownerUserId = options.ownerUserId?.trim();
  const workspaceIdValue =
    workspaceId && isSupabaseWorkspaceUuid(workspaceId)
      ? workspaceId
      : SUPABASE_WORKSPACE_ID_PLACEHOLDER;
  const ownerUserIdValue =
    ownerUserId && isSupabaseWorkspaceUuid(ownerUserId)
      ? ownerUserId
      : SUPABASE_OWNER_USER_ID_PLACEHOLDER;

  return [
    "# Prompt AI Studio RLS Smoke Test Checklist",
    "",
    "## Target",
    `- workspace_id: ${workspaceIdValue}`,
    `- owner_user_id: ${ownerUserIdValue}`,
    "- policy source: workspace_members",
    "- write roles: owner, admin, member",
    "- read-only role: viewer",
    "",
    "## Test accounts",
    "- [ ] Owner account: auth user mapped to workspace owner",
    "- [ ] Member account: auth user with workspace_members.role = member",
    "- [ ] Viewer account: auth user with workspace_members.role = viewer",
    "- [ ] Non-member account: auth user with no workspace_members row",
    "",
    "## Owner session",
    "- [ ] Owner can read workspaces, workspace_members, user_profiles, company_profiles, prompt_assets, prompt_versions, feedback, deleted_prompt_assets, learning_memories, prompt_skills.",
    "- [ ] Owner can insert and update prompt_assets and prompt_versions.",
    "- [ ] Owner can insert feedback where feedback.user_id = auth.uid().",
    "- [ ] Owner can update company_profiles and prompt_skills.",
    "- [ ] Owner can manage workspace_members according to the reviewed policy.",
    "",
    "## Member session",
    "- [ ] Member can read workspace-scoped records.",
    "- [ ] Member can insert and update prompt_assets and prompt_versions.",
    "- [ ] Member can insert feedback only for their own auth.uid().",
    "- [ ] Member cannot manage workspace_members unless policy was explicitly changed.",
    "- [ ] Member cannot update workspaces unless policy was explicitly changed.",
    "",
    "## Viewer session",
    "- [ ] Viewer can read workspace-scoped records.",
    "- [ ] Viewer cannot insert, update, or delete prompt_assets.",
    "- [ ] Viewer cannot insert, update, or delete deleted_prompt_assets.",
    "- [ ] Viewer cannot insert feedback.",
    "- [ ] Viewer cannot update company_profiles, prompt_skills, or workspace_members.",
    "",
    "## Non-member session",
    "- [ ] Non-member cannot read target workspace records.",
    "- [ ] Non-member cannot infer prompt_versions or feedback through prompt_assets joins.",
    "- [ ] Non-member cannot write any target workspace record.",
    "",
    "## Cross-workspace isolation",
    "- [ ] A member of a different workspace cannot read this workspace's prompt_assets.",
    "- [ ] A member of a different workspace cannot read this workspace's deleted_prompt_assets.",
    "- [ ] A member of a different workspace cannot read prompt_versions or feedback attached to this workspace.",
    "- [ ] A member of a different workspace cannot write rows with this workspace_id.",
    "",
    "## Required evidence",
    "- [ ] Record test account IDs and roles.",
    "- [ ] Save successful owner/member read and write responses.",
    "- [ ] Save denied viewer write response.",
    "- [ ] Save denied non-member read and write responses.",
    "- [ ] Save cross-workspace denial response.",
    "",
    "## Acceptance",
    "- [ ] All expected allow cases pass.",
    "- [ ] All expected deny cases are denied by RLS, not by client-side UI only.",
    "- [ ] No service role key is used in app-session smoke tests.",
    "- [ ] Any policy exception is documented before production usage.",
  ].join("\n");
}

export function getSupabaseImportVerificationCheckCounts() {
  return {
    handoffSections: supabaseMigrationHandoffSectionTitles.length,
    pendingIdAudit: countSqlChecks(buildSupabaseImportPendingIdAuditSql()),
    relationship: countSqlChecks(buildSupabaseImportRelationshipVerificationSql()),
    rlsOwnerAccess: countSqlChecks(buildSupabaseImportRlsAccessAuditSql()),
    rlsPolicyTables: countRlsPolicyTables(buildSupabaseRlsPolicyDraftSql()),
  };
}

export function buildSupabaseImportVerificationReportText(
  dryRun: SupabaseImportDryRun,
  options: { ownerUserId?: string; workspaceId?: string } = {},
) {
  const workspaceId = options.workspaceId?.trim();
  const ownerUserId = options.ownerUserId?.trim();
  const workspaceIdValue =
    workspaceId && isSupabaseWorkspaceUuid(workspaceId)
      ? workspaceId
      : SUPABASE_WORKSPACE_ID_PLACEHOLDER;
  const ownerUserIdValue =
    ownerUserId && isSupabaseWorkspaceUuid(ownerUserId)
      ? ownerUserId
      : SUPABASE_OWNER_USER_ID_PLACEHOLDER;
  const setupWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "setup",
  );
  const relationshipWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "relationship",
  );
  const checkCounts = getSupabaseImportVerificationCheckCounts();

  return [
    "# Prompt AI Studio Supabase Import Verification Report",
    "",
    "## Import target",
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- workspace_id: ${workspaceIdValue}`,
    `- owner_user_id: ${ownerUserIdValue}`,
    `- expected total rows: ${dryRun.totalRows}`,
    `- row count checks: ${dryRun.batches.length}`,
    `- relationship checks: ${checkCounts.relationship}`,
    `- pending ID checks: ${checkCounts.pendingIdAudit}`,
    `- RLS owner access checks: ${checkCounts.rlsOwnerAccess}`,
    `- setup warnings: ${setupWarnings.length}`,
    `- relationship warnings: ${relationshipWarnings.length}`,
    "",
    "## Required execution order",
    "- [ ] Run the importer with real Supabase UUIDs, not pending-* dry-run IDs.",
    "- [ ] Run the row count verification SQL for the imported workspace.",
    "- [ ] Run the relationship verification SQL for the imported workspace.",
    "- [ ] Run the pending ID audit SQL for the imported workspace.",
    "- [ ] Run the RLS owner access audit SQL with workspace_id and owner_user_id.",
    "- [ ] Review the RLS policy draft before any policy SQL is applied.",
    "- [ ] Run authenticated RLS smoke tests after policies are enabled.",
    "- [ ] Save all query outputs with this report.",
    "",
    buildSupabaseImportReferenceReplacementGuideText(dryRun),
    "",
    "## Row count acceptance",
    ...dryRun.batches.map(
      (batch) =>
        `- [ ] ${batch.table}: expected_rows ${batch.rows.length}, status pass`,
    ),
    "",
    "## Relationship acceptance",
    "- [ ] prompt_assets.source_skill_id issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourcePromptId issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourceVersionId issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourceFeedback.id issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourceFeedback.promptVersionId issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourceFeedback completeness issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourceFeedback pair issue_count 0",
    "- [ ] deleted archive source references are accepted through deleted_prompt_assets snapshots.",
    "- [ ] feedback.prompt_version_id issue_count 0",
    "- [ ] prompt_skills.source_prompt_id issue_count 0",
    "- [ ] prompt_skills.source_version_id issue_count 0",
    "- [ ] prompt_skills source prompt/version pair issue_count 0",
    "- [ ] learning_memories feedback source_id issue_count 0",
    "- [ ] learning_memories profile source_id issue_count 0",
    "- [ ] learning_memories company source_id issue_count 0",
    "",
    "## Pending ID acceptance",
    "- [ ] prompt_assets.improvement_source issue_count 0",
    "- [ ] prompt_assets.language_decision issue_count 0",
    "- [ ] prompt_assets.target_model_decision issue_count 0",
    "- [ ] learning_memories.source_id issue_count 0",
    "- [ ] prompt_skills.language_decision issue_count 0",
    "- [ ] deleted_prompt_assets.prompt_snapshot issue_count 0",
    "",
    "## RLS owner access acceptance",
    "- [ ] workspaces.owner_user_id issue_count 0",
    "- [ ] workspace_members owner row issue_count 0",
    "- [ ] user_profiles owner mapping issue_count 0",
    "- [ ] prompt_assets.created_by_user_id issue_count 0",
    "- [ ] feedback.user_id issue_count 0",
    "- [ ] prompt_skills.created_by_user_id issue_count 0",
    "- [ ] company_profiles workspace mapping issue_count 0",
    "- [ ] deleted_prompt_assets prompt_snapshot issue_count 0",
    "",
    "## Authenticated RLS smoke test acceptance",
    "- [ ] Owner session allow/deny cases pass.",
    "- [ ] Member session allow/deny cases pass.",
    "- [ ] Viewer session read-only cases pass.",
    "- [ ] Non-member session deny cases pass.",
    "- [ ] Cross-workspace isolation cases pass.",
    "",
    "## Dry-run warnings to resolve",
    ...(dryRun.warningItems.length > 0
      ? dryRun.warningItems.map((warning) => `- [ ] ${formatWarningLabel(warning)}`)
      : ["- [x] No dry-run warnings"]),
    "",
    "## Rollback or review triggers",
    "- Any row count check returns status review.",
    "- Any relationship check returns issue_count greater than 0.",
    "- Any pending ID audit check returns issue_count greater than 0.",
    "- Any RLS owner access audit check returns issue_count greater than 0.",
    "- owner_user_id, user_id, or workspace membership is mapped to the wrong user.",
    "- RLS policies block the owner from reading imported workspace records.",
    "- Any non-member or cross-workspace user can read or write imported records.",
    "",
    "## Sign-off",
    "- [ ] Backup JSON and fingerprint are archived.",
    "- [ ] Row count SQL output is archived.",
    "- [ ] Relationship SQL output is archived.",
    "- [ ] Pending ID audit SQL output is archived.",
    "- [ ] RLS owner access audit SQL output is archived.",
    "- [ ] RLS policy draft review decision is recorded.",
    "- [ ] Authenticated RLS smoke test evidence is archived.",
    "- [ ] Import is accepted or rollback decision is recorded.",
  ].join("\n");
}

export function buildSupabaseMigrationHandoffPackageText(
  dryRun: SupabaseImportDryRun,
  options: { ownerUserId?: string; workspaceId?: string } = {},
) {
  const workspaceId = options.workspaceId?.trim();
  const ownerUserId = options.ownerUserId?.trim();
  const workspaceIdValue =
    workspaceId && isSupabaseWorkspaceUuid(workspaceId)
      ? workspaceId
      : SUPABASE_WORKSPACE_ID_PLACEHOLDER;
  const ownerUserIdValue =
    ownerUserId && isSupabaseWorkspaceUuid(ownerUserId)
      ? ownerUserId
      : SUPABASE_OWNER_USER_ID_PLACEHOLDER;
  const resolvedOptions = {
    ownerUserId:
      ownerUserIdValue === SUPABASE_OWNER_USER_ID_PLACEHOLDER
        ? undefined
        : ownerUserIdValue,
    workspaceId:
      workspaceIdValue === SUPABASE_WORKSPACE_ID_PLACEHOLDER
        ? undefined
        : workspaceIdValue,
  };
  const checkCounts = getSupabaseImportVerificationCheckCounts();

  return [
    "# Prompt AI Studio Supabase Migration Handoff Package",
    "",
    "## Package target",
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- workspace_id: ${workspaceIdValue}`,
    `- owner_user_id: ${ownerUserIdValue}`,
    `- expected total rows: ${dryRun.totalRows}`,
    `- generated sections: ${checkCounts.handoffSections}`,
    "",
    "## Read order",
    ...supabaseMigrationHandoffSectionTitles.map(
      (title, index) => `- ${index + 1}. ${title}`,
    ),
    "",
    "## 1. Importer dry-run",
    buildSupabaseImportDryRunText(dryRun),
    "",
    "## 2. Pending ID replacement guide",
    buildSupabaseImportReferenceReplacementGuideText(dryRun),
    "",
    "## 3. Row count verification SQL",
    "```sql",
    buildSupabaseImportVerificationSql(dryRun, resolvedOptions),
    "```",
    "",
    "## 4. Relationship verification SQL",
    "```sql",
    buildSupabaseImportRelationshipVerificationSql(resolvedOptions),
    "```",
    "",
    "## 5. Pending ID audit SQL",
    "```sql",
    buildSupabaseImportPendingIdAuditSql(resolvedOptions),
    "```",
    "",
    "## 6. RLS owner access audit SQL",
    "```sql",
    buildSupabaseImportRlsAccessAuditSql(resolvedOptions),
    "```",
    "",
    "## 7. RLS policy draft SQL",
    "```sql",
    buildSupabaseRlsPolicyDraftSql(),
    "```",
    "",
    "## 8. RLS smoke test checklist",
    buildSupabaseRlsSmokeTestChecklistText(resolvedOptions),
    "",
    "## 9. Verification report",
    buildSupabaseImportVerificationReportText(dryRun, resolvedOptions),
  ].join("\n");
}

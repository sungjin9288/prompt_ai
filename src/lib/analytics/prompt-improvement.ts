import {
  modelLabels,
  type PromptAsset,
  type PromptDeletedAsset,
  type PromptVersion,
  type TargetModel,
} from "@/lib/prompt";

export const reimprovementQualityThreshold = 4.2;

export interface PromptImprovementRecord {
  prompt: PromptAsset;
  sourcePrompt: PromptAsset;
  sourceVersion: PromptVersion;
  improvedVersion: PromptVersion;
  targetModel: TargetModel;
  domain: string;
  depth: number;
  delta: number;
  sourceScore: number;
  improvedScore: number;
  createdAt: string;
  sourceDeletedAt?: string;
}

export type PromptSourceHealthIssueReason =
  | "archived-source"
  | "missing-source"
  | "missing-source-version"
  | "missing-improved-version";

export interface PromptSourceHealthIssue {
  prompt: PromptAsset;
  sourcePrompt?: PromptAsset;
  sourceDeletedAt?: string;
  targetModel?: TargetModel;
  reason: PromptSourceHealthIssueReason;
  createdAt: string;
}

export interface PromptImprovementGroup {
  id: string;
  label: string;
  count: number;
  averageDelta: number;
  bestDelta: number;
  latestAt?: string;
  depth?: number;
  targetModel?: TargetModel;
}

export interface PromptImprovementSummary {
  totalImprovementPrompts: number;
  measurableCount: number;
  archivedSourceCount: number;
  unmeasuredCount: number;
  improvedCount: number;
  regressedCount: number;
  averageDelta: number;
  bestRecord?: PromptImprovementRecord;
  reimprovementQueue: PromptImprovementRecord[];
  sourceHealthIssues: PromptSourceHealthIssue[];
  byDepth: PromptImprovementGroup[];
  byTargetModel: PromptImprovementGroup[];
  byDomain: PromptImprovementGroup[];
}

function getLatestDate(values: string[]) {
  return values
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function getSourceVersion(
  improvementPrompt: PromptAsset,
  sourcePrompt?: PromptAsset,
) {
  if (!sourcePrompt || !improvementPrompt.improvementSource) {
    return undefined;
  }

  const { sourceVersionId, sourceVersionModel } =
    improvementPrompt.improvementSource;

  return (
    sourcePrompt.versions.find((version) => version.id === sourceVersionId) ??
    sourcePrompt.versions.find(
      (version) => version.targetModel === sourceVersionModel,
    ) ??
    sourcePrompt.versions[0]
  );
}

function getImprovedVersion(
  improvementPrompt: PromptAsset,
  sourceVersion?: PromptVersion,
) {
  return (
    improvementPrompt.versions.find(
      (version) => version.targetModel === sourceVersion?.targetModel,
    ) ?? improvementPrompt.versions[0]
  );
}

function findPromptById(
  promptId: string | undefined,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  if (!promptId) {
    return undefined;
  }

  return (
    prompts.find((item) => item.id === promptId) ??
    deletedPrompts.find((item) => item.prompt.id === promptId)?.prompt
  );
}

function getPromptImprovementDepth(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  const visited = new Set<string>();
  let current: PromptAsset | undefined = prompt;
  let depth = 0;

  while (current?.improvementSource && !visited.has(current.id)) {
    visited.add(current.id);
    depth += 1;
    current = findPromptById(
      current.improvementSource.sourcePromptId,
      prompts,
      deletedPrompts,
    );
  }

  return depth;
}

function formatImprovementDepth(depth: number) {
  return `${Math.max(1, depth)}차 개선본`;
}

function average(records: PromptImprovementRecord[]) {
  return records.length
    ? records.reduce((sum, record) => sum + record.delta, 0) / records.length
    : 0;
}

function sortReimprovementRecords(
  left: PromptImprovementRecord,
  right: PromptImprovementRecord,
) {
  if (left.delta !== right.delta) {
    return left.delta - right.delta;
  }

  if (left.improvedScore !== right.improvedScore) {
    return left.improvedScore - right.improvedScore;
  }

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function summarizeGroup(
  records: PromptImprovementRecord[],
  getKey: (record: PromptImprovementRecord) => string,
  getLabel: (record: PromptImprovementRecord) => string,
  getDepth?: (record: PromptImprovementRecord) => number,
  getTargetModel?: (record: PromptImprovementRecord) => TargetModel,
) {
  const groups = new Map<string, PromptImprovementRecord[]>();

  records.forEach((record) => {
    const key = getKey(record);
    const current = groups.get(key) ?? [];

    groups.set(key, [...current, record]);
  });

  return [...groups.entries()]
    .map(([id, groupRecords]) => ({
      id,
      label: getLabel(groupRecords[0]),
      count: groupRecords.length,
      averageDelta: average(groupRecords),
      bestDelta: Math.max(...groupRecords.map((record) => record.delta)),
      depth: getDepth?.(groupRecords[0]),
      latestAt: getLatestDate(groupRecords.map((record) => record.createdAt)),
      targetModel: getTargetModel?.(groupRecords[0]),
    }))
    .sort((left, right) => {
      if (right.averageDelta !== left.averageDelta) {
        return right.averageDelta - left.averageDelta;
      }

      return right.count - left.count;
    });
}

export function listPromptImprovementRecords(
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[] = [],
): PromptImprovementRecord[] {
  return prompts.flatMap((prompt) => {
    if (!prompt.improvementSource) {
      return [];
    }

    const sourcePromptId = prompt.improvementSource.sourcePromptId;
    const deletedSourcePrompt = deletedPrompts.find(
      (item) => item.prompt.id === sourcePromptId,
    );
    const sourcePrompt =
      prompts.find((item) => item.id === sourcePromptId) ??
      deletedSourcePrompt?.prompt;
    const sourceDeletedAt = deletedSourcePrompt?.deletedAt;
    const sourceVersion = getSourceVersion(prompt, sourcePrompt);
    const improvedVersion = getImprovedVersion(prompt, sourceVersion);

    if (!sourcePrompt || !sourceVersion || !improvedVersion) {
      return [];
    }

    return [
      {
        prompt,
        sourcePrompt,
        sourceVersion,
        improvedVersion,
        targetModel: sourceVersion.targetModel,
        domain: sourcePrompt.domain || prompt.domain || "범용",
        depth: getPromptImprovementDepth(prompt, prompts, deletedPrompts),
        delta: improvedVersion.qualityScore - sourceVersion.qualityScore,
        sourceScore: sourceVersion.qualityScore,
        improvedScore: improvedVersion.qualityScore,
        createdAt: prompt.updatedAt || prompt.createdAt,
        sourceDeletedAt,
      },
    ];
  });
}

function listPromptSourceHealthIssues(
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
  records: PromptImprovementRecord[],
): PromptSourceHealthIssue[] {
  const measurablePromptIds = new Set(records.map((record) => record.prompt.id));
  const archivedSourceIssues = records
    .filter((record) => record.sourceDeletedAt)
    .map((record) => ({
      prompt: record.prompt,
      sourcePrompt: record.sourcePrompt,
      sourceDeletedAt: record.sourceDeletedAt,
      targetModel: record.targetModel,
      reason: "archived-source" as const,
      createdAt: record.createdAt,
    }));
  const unmeasuredIssues = prompts.flatMap((prompt) => {
    if (!prompt.improvementSource || measurablePromptIds.has(prompt.id)) {
      return [];
    }

    const sourcePromptId = prompt.improvementSource.sourcePromptId;
    const deletedSourcePrompt = deletedPrompts.find(
      (item) => item.prompt.id === sourcePromptId,
    );
    const sourcePrompt =
      prompts.find((item) => item.id === sourcePromptId) ??
      deletedSourcePrompt?.prompt;
    const sourceVersion = getSourceVersion(prompt, sourcePrompt);
    const improvedVersion = getImprovedVersion(prompt, sourceVersion);
    const reason: PromptSourceHealthIssueReason = !sourcePrompt
      ? "missing-source"
      : !sourceVersion
        ? "missing-source-version"
        : !improvedVersion
          ? "missing-improved-version"
          : "missing-improved-version";

    return [
      {
        prompt,
        sourcePrompt,
        sourceDeletedAt: deletedSourcePrompt?.deletedAt,
        targetModel:
          sourceVersion?.targetModel ?? prompt.improvementSource?.sourceVersionModel,
        reason,
        createdAt: prompt.updatedAt || prompt.createdAt,
      },
    ];
  });

  return [...archivedSourceIssues, ...unmeasuredIssues].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function summarizePromptImprovementPerformance(
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[] = [],
): PromptImprovementSummary {
  const records = listPromptImprovementRecords(prompts, deletedPrompts);
  const sourceHealthIssues = listPromptSourceHealthIssues(
    prompts,
    deletedPrompts,
    records,
  );
  const totalImprovementPrompts = prompts.filter(
    (prompt) => prompt.improvementSource,
  ).length;

  return {
    totalImprovementPrompts,
    measurableCount: records.length,
    archivedSourceCount: records.filter((record) => record.sourceDeletedAt).length,
    unmeasuredCount: Math.max(0, totalImprovementPrompts - records.length),
    improvedCount: records.filter((record) => record.delta >= 0).length,
    regressedCount: records.filter((record) => record.delta < 0).length,
    averageDelta: average(records),
    bestRecord: records
      .slice()
      .sort((left, right) => right.delta - left.delta)[0],
    sourceHealthIssues,
    reimprovementQueue: records
      .filter(
        (record) =>
          record.delta <= 0 ||
          record.improvedScore < reimprovementQualityThreshold,
      )
      .sort(sortReimprovementRecords),
    byDepth: summarizeGroup(
      records,
      (record) => String(record.depth),
      (record) => formatImprovementDepth(record.depth),
      (record) => record.depth,
    ).sort((left, right) => (left.depth ?? 0) - (right.depth ?? 0)),
    byTargetModel: summarizeGroup(
      records,
      (record) => record.targetModel,
      (record) => modelLabels[record.targetModel],
      undefined,
      (record) => record.targetModel,
    ),
    byDomain: summarizeGroup(
      records,
      (record) => record.domain,
      (record) => record.domain,
    ),
  };
}

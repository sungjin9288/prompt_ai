export interface McpFeedbackRecord {
  createdAt?: string;
  id?: string;
  improvementQueueItem?: string;
  learningMemoryCandidate?: string;
  notes?: string;
  promptId?: string;
  rating?: "positive" | "neutral" | "negative" | string;
  resultSummary?: string;
  source?: string;
  targetAI?: string;
  tool?: string;
}

export interface McpFeedbackParseError {
  line: number;
  message: string;
}

export interface McpFeedbackInboxSnapshot {
  filteredCount: number;
  parseErrors: McpFeedbackParseError[];
  ratingCounts: Record<string, number>;
  records: McpFeedbackRecord[];
  targetAICounts: Record<string, number>;
  totalCount: number;
}

export function normalizeMcpFeedbackInboxLimit(value: unknown) {
  const parsed =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return 10;
  }

  return Math.min(50, Math.max(1, Math.trunc(parsed)));
}

export function parseMcpFeedbackInboxText(
  text: string,
  options: { limit?: unknown; rating?: unknown; targetAI?: unknown } = {},
): McpFeedbackInboxSnapshot {
  const limit = normalizeMcpFeedbackInboxLimit(options.limit);
  const ratingFilter = normalizeMcpFeedbackFilter(options.rating);
  const targetAIFilter = normalizeMcpFeedbackFilter(options.targetAI);
  const parseErrors: McpFeedbackParseError[] = [];
  const records: McpFeedbackRecord[] = [];

  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        records.push(parsed as McpFeedbackRecord);
      } else {
        parseErrors.push({
          line: index + 1,
          message: "Feedback line must be a JSON object.",
        });
      }
    } catch {
      parseErrors.push({
        line: index + 1,
        message: "Feedback line is not valid JSON.",
      });
    }
  });

  const ratingCounts = countBy(records, (record) => record.rating ?? "unknown");
  const targetAICounts = countBy(
    records,
    (record) => record.targetAI ?? "general",
  );
  const filteredRecords = records.filter(
    (record) =>
      matchesFilter(record.rating ?? "unknown", ratingFilter) &&
      matchesFilter(record.targetAI ?? "general", targetAIFilter),
  );

  return {
    filteredCount: filteredRecords.length,
    parseErrors,
    ratingCounts,
    records: filteredRecords.slice(-limit).reverse(),
    targetAICounts,
    totalCount: records.length,
  };
}

export function normalizeMcpFeedbackFilter(value: unknown) {
  if (typeof value !== "string") {
    return "all";
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : "all";
}

function matchesFilter(value: string, filter: string) {
  return filter === "all" || value.toLowerCase() === filter;
}

function countBy(
  records: McpFeedbackRecord[],
  getKey: (record: McpFeedbackRecord) => string,
) {
  return records.reduce<Record<string, number>>((counts, record) => {
    const key = getKey(record).toLowerCase();
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

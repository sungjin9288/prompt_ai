import { type EnvironmentReleaseGateStage } from "@/lib/data/environment-readiness";
import { getSupabaseImportVerificationCheckCounts } from "@/lib/data/supabase-import-report-text";

export const supabaseImportVerificationCheckCounts =
  getSupabaseImportVerificationCheckCounts();
export const supabaseImportExecutionPacketSectionCount = 10;

export function formatBackupDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatJsonLength(value: string) {
  return `${value.trim().length.toLocaleString("ko-KR")}자`;
}

export function formatReleaseGateStage(stage: EnvironmentReleaseGateStage) {
  if (stage === "migration-ready") {
    return "Supabase 전환 가능";
  }

  if (stage === "local-ready") {
    return "로컬 운영 가능";
  }

  return "전환 차단";
}

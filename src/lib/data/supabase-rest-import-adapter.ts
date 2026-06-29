import type {
  SupabaseImportInsertAdapter,
  SupabaseImportInsertRequest,
} from "./supabase-importer";

const allowedImportTables = new Set([
  "workspaces",
  "workspace_members",
  "user_profiles",
  "company_profiles",
  "prompt_assets",
  "prompt_versions",
  "feedback",
  "deleted_prompt_assets",
  "learning_memories",
  "prompt_skills",
]);

export interface SupabaseRestImportAdapterConfig {
  serviceRoleKey: string;
  supabaseUrl: string;
}

export interface SupabaseRestImportEnvironmentStatus {
  executionEnabled: boolean;
  serviceRoleKeyConfigured: boolean;
  supabaseUrlConfigured: boolean;
}

function normalizeSupabaseUrl(supabaseUrl: string) {
  return supabaseUrl.trim().replace(/\/+$/, "");
}

function assertAllowedImportTable(table: string) {
  if (!allowedImportTables.has(table)) {
    throw new Error(`Import table is not allowed: ${table}`);
  }
}

export function getSupabaseRestImportEnvironmentStatus(): SupabaseRestImportEnvironmentStatus {
  return {
    executionEnabled:
      process.env.SUPABASE_IMPORT_EXECUTION_ENABLED?.trim() === "true",
    serviceRoleKeyConfigured: Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    ),
    supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
  };
}

export function createSupabaseRestImportAdapter(
  config: SupabaseRestImportAdapterConfig,
): SupabaseImportInsertAdapter {
  const supabaseUrl = normalizeSupabaseUrl(config.supabaseUrl);
  const serviceRoleKey = config.serviceRoleKey.trim();

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
  }

  return {
    async insertRows(request: SupabaseImportInsertRequest) {
      assertAllowedImportTable(request.table);

      if (request.rows.length === 0) {
        return { insertedRows: 0, note: "No rows to insert." };
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/${encodeURIComponent(request.table)}`,
        {
          body: JSON.stringify(request.rows),
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          method: "POST",
        },
      );

      if (!response.ok) {
        const responseBody = await response.text();

        throw new Error(
          `Supabase insert failed for ${request.table}: ${response.status} ${response.statusText}${responseBody ? ` / ${responseBody}` : ""}`,
        );
      }

      return {
        insertedRows: request.rows.length,
        note: `Inserted via Supabase REST into ${request.table}.`,
      };
    },
  };
}

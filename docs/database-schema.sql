-- Prompt AI Studio persistence schema draft for Supabase/Postgres.
-- This is not applied by the app yet. It documents the target shape for the
-- next persistence phase.

create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  name text not null,
  type text not null check (type in ('personal', 'company')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workspace_id uuid references workspaces(id) on delete cascade,
  role text not null default '',
  industries text[] not null default '{}',
  goals text[] not null default '{}',
  preferred_tone text not null default '',
  preferred_outputs text[] not null default '{}',
  avoid_phrases text[] not null default '{}',
  repeated_tasks text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists company_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_name text not null default '',
  description text not null default '',
  products text[] not null default '{}',
  customers text[] not null default '{}',
  brand_tone text not null default '',
  internal_terms text[] not null default '{}',
  banned_phrases text[] not null default '{}',
  document_formats text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prompt_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  created_by_user_id uuid not null,
  title text not null,
  source text not null check (source in ('local', 'openai')),
  model_used text,
  language_strategy text not null default 'hybrid' check (language_strategy in ('english', 'hybrid')),
  language_decision jsonb not null default '{}'::jsonb,
  output_language text not null default 'korean' check (output_language in ('korean', 'english', 'same_as_input')),
  source_skill_id uuid,
  source_skill_name text,
  improvement_source jsonb not null default '{}'::jsonb,
  learning_context jsonb not null default '{}'::jsonb,
  raw_input text not null,
  goal text not null,
  domain text not null,
  target_models text[] not null default '{}',
  target_model_decision jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_asset_id uuid not null references prompt_assets(id) on delete cascade,
  target_model text not null check (target_model in ('general', 'gpt', 'claude', 'codex', 'gemini')),
  model_label text not null,
  content text not null,
  quality_score numeric(3, 1) not null default 0,
  score_breakdown jsonb not null default '{}'::jsonb,
  assumptions text[] not null default '{}',
  missing_context text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  prompt_asset_id uuid not null references prompt_assets(id) on delete cascade,
  prompt_version_id uuid not null references prompt_versions(id) on delete cascade,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  feedback_type text not null check (
    feedback_type in ('tone', 'context', 'format', 'accuracy', 'company_rule', 'other')
  ),
  created_at timestamptz not null default now()
);

create table if not exists deleted_prompt_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  original_prompt_asset_id text not null,
  title text not null,
  deleted_at timestamptz not null,
  prompt_snapshot jsonb not null,
  restored_prompt_asset_id uuid references prompt_assets(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists learning_memories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  scope text not null check (scope in ('user', 'company', 'domain', 'skill')),
  source_type text not null check (source_type in ('feedback', 'profile', 'company', 'manual')),
  source_id text not null,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  confidence numeric(3, 2) not null check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prompt_skills (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  created_by_user_id uuid not null,
  name text not null,
  description text not null default '',
  domain text not null default '범용',
  target_model text not null check (target_model in ('general', 'gpt', 'claude', 'codex', 'gemini')),
  language_strategy text not null default 'hybrid' check (language_strategy in ('english', 'hybrid')),
  language_decision jsonb not null default '{}'::jsonb,
  output_language text not null default 'korean' check (output_language in ('korean', 'english', 'same_as_input')),
  source_prompt_id uuid references prompt_assets(id) on delete set null,
  source_version_id uuid references prompt_versions(id) on delete set null,
  input_guide text not null default '',
  prompt_template text not null,
  output_format text not null default '',
  quality_checklist text[] not null default '{}',
  tags text[] not null default '{}',
  usage_count integer not null default 0,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  source_type text not null check (source_type in ('upload', 'url', 'note', 'integration')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_source_id uuid not null references document_sources(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector,
  created_at timestamptz not null default now()
);

create index if not exists idx_prompt_assets_workspace_created
  on prompt_assets(workspace_id, created_at desc);

create index if not exists idx_prompt_assets_workspace_skill
  on prompt_assets(workspace_id, source_skill_id, created_at desc);

create index if not exists idx_prompt_versions_asset
  on prompt_versions(prompt_asset_id);

create index if not exists idx_feedback_asset_created
  on feedback(prompt_asset_id, created_at desc);

create index if not exists idx_feedback_asset_rating
  on feedback(prompt_asset_id, rating, created_at desc);

create index if not exists idx_deleted_prompt_assets_workspace_deleted
  on deleted_prompt_assets(workspace_id, deleted_at desc);

create index if not exists idx_deleted_prompt_assets_original_prompt
  on deleted_prompt_assets(workspace_id, original_prompt_asset_id);

create index if not exists idx_learning_memories_workspace_scope
  on learning_memories(workspace_id, scope, updated_at desc);

create index if not exists idx_prompt_skills_workspace_domain
  on prompt_skills(workspace_id, domain, updated_at desc);

create index if not exists idx_document_chunks_workspace
  on document_chunks(workspace_id, document_source_id, chunk_index);

-- Supabase RLS policy direction:
-- 1. Enable RLS on all workspace-owned tables.
-- 2. Allow access when auth.uid() is a member of the workspace.
-- 3. Restrict writes by workspace role.
-- 4. Keep personal workspaces owned by one user until team mode is enabled.

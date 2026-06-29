# Storage Architecture

## Current state

The MVP still stores data in browser `localStorage`, but UI components no longer import the generic storage hook directly.

UI components use domain-level hooks from:

```text
src/lib/data/workspace-store.ts
```

Current hooks:

- `useUserProfileStore`
- `useCompanyProfileStore`
- `usePromptAssetsStore`
- `useLearningMemoriesStore`
- `usePromptSkillsStore`
- `useStudioMemoryScopeStore`

This keeps the current MVP simple while making the eventual Supabase/Postgres migration narrower. When a database is introduced, the main change should happen inside the data layer instead of every page component.

## Local backup boundary

The MVP exposes a local workspace backup flow at:

```text
/data
```

The backup utility lives in:

```text
src/lib/storage/workspace-backup.ts
```

Backup JSON includes:

- `app`: fixed to `prompt-ai-studio`
- `schemaVersion`: currently `1`
- `exportedAt`: ISO timestamp
- `counts`: prompt, version, feedback, memory, skill, and skill-run counts
- `data.userProfile`
- `data.companyProfile`
- `data.prompts`
- `data.memories`
- `data.skills`
- `data.deletedPrompts`

Studio memory scope preferences are stored separately under
`prompt-ai-studio:studio-memory-scopes`. They control the local Studio authoring
experience and are not part of the workspace backup payload.

Generated prompt assets can include `learningContext` metadata. This metadata
captures the enabled memory scopes, applied memory count, recent feedback count,
and representative memory titles used when the prompt was generated. It is part
of `data.prompts` in backup JSON and maps to `prompt_assets.learning_context`
in the Supabase dry-run payload.

The app also stores local backup metadata in `localStorage` under
`prompt-ai-studio:backup-meta`. The metadata keeps the last backup timestamp,
counts, and deterministic backup fingerprint. The fingerprint lets the import
flow compare a pasted or selected backup against the latest generated backup
baseline even after the page has been refreshed.

After a backup is validated, `/data` can copy a restore report as Markdown. The
report includes the backup identifier, fingerprint comparison, counts, restore
impact rows, and risk items. Use this report as a lightweight migration note
before restoring local data or mapping a backup into Supabase.

The same validated backup also shows a Supabase mapping preview against
`docs/database-schema.sql`. It lists target tables, source backup paths, expected
row counts, and setup decisions that still need external context such as the
initial auth user and workspace owner.

`/data` also produces a migration execution checklist from the validated backup.
The checklist separates ready, manually reviewed, and blocked items so the
Supabase project setup, RLS policies, importer, verification queries, and rollback
criteria can be handled before any production data is written.

The importer dry-run utility lives in:

```text
src/lib/data/supabase-import-dry-run.ts
```

It converts a validated `schemaVersion: 1` backup into ordered insert batches
with `pending-*` IDs, table dependencies, payload previews, and warnings. Active
prompt, version, feedback, profile, and company references are remapped to these
dry-run IDs so a future importer can replace the same fields with real Supabase
UUIDs after insert. Deleted archive source IDs remain as trace IDs inside
`deleted_prompt_assets.original_prompt_asset_id` and `prompt_snapshot` so deleted
source relationships can still be audited. This does not connect to Supabase or
write data; it is a deterministic bridge between the local backup shape and a
future server-side importer.

Dry-run warnings are categorized as setup requirements or relationship checks.
Relationship checks include prompt-to-skill, improvement-source prompt/version,
source feedback completeness and pair consistency, skill-source, feedback, and
learning-memory source references. `/data` shows the category counts and the
copied dry-run report preserves the labels.

The dry-run can also generate read-only verification SQL. The SQL uses a
`<workspace_id>` placeholder and compares expected row counts from the dry-run
batches against actual workspace-scoped table counts after an importer run.
Replace the placeholder with the imported workspace UUID before running it.
In `/data`, paste the actual `workspaces.id` UUID into the verification SQL
field to preview and copy a resolved query. The app only resolves the query when
the value matches UUID format; otherwise it keeps the placeholder template.

`/data` also generates a relationship verification SQL template. It checks
workspace-scoped references after import, including prompt source skills,
improvement source prompt/version/feedback fields, source feedback completeness,
source feedback pair consistency, feedback-to-version consistency, skill source
prompt/version links, learning-memory source references, and deleted archive
snapshot references. The expected result is `issue_count = 0` for every
relationship check.

The pending ID audit SQL checks whether dry-run-only `pending-*` values remain
in workspace-scoped `jsonb` or `text` fields after import. It focuses on fields
where placeholder text can survive even when UUID columns are correctly mapped,
such as improvement metadata, language/model decisions, and learning-memory
source IDs. The expected result is `issue_count = 0` for every audit check.
The audit also checks deleted archive snapshots so importer output does not
accidentally persist dry-run placeholder IDs in archived prompt JSON.

`/data` can also copy an import execution plan. The plan accepts the actual
`workspaces.id` and owner `auth.users.id`, generates UUIDs for the remaining
dry-run rows, rewrites `pending-*` references in the insert payload, and preserves
deleted archive trace fields. It is still local-only: it does not connect to
Supabase or write rows. Treat it as the transformation contract for the future
server-side importer.

The server-side importer core lives in:

```text
src/lib/data/supabase-importer.ts
```

It validates the execution plan, exposes ordered insert requests, and defines an
`insertRows` adapter contract. The MVP does not ship a Supabase SDK adapter yet;
the future implementation should bind this contract to a service-role server
client or backend job, never a browser client. `/data` can copy the adapter
contract so migration operators can review the table order and required
post-import audits before a real write path exists.

The server Route Handler lives in:

```text
src/app/api/data/supabase-import/route.ts
```

`POST /api/data/supabase-import` accepts a validated backup payload or backup
JSON plus `workspaceId` and `ownerUserId`. With the default `execute: false`, it
returns the dry-run summary, execution-plan validation, insert order, and adapter
contract text.

The Supabase REST adapter lives in:

```text
src/lib/data/supabase-rest-import-adapter.ts
```

`execute: true` can call this adapter only when all write gates pass:

- `SUPABASE_IMPORT_EXECUTION_ENABLED=true`
- `NEXT_PUBLIC_SUPABASE_URL` is configured
- `SUPABASE_SERVICE_ROLE_KEY` is configured server-side
- request body includes `confirmation: "RUN_SUPABASE_IMPORT"`
- the generated execution plan has no validation blockers

If any gate fails, the route returns a non-2xx response before attempting a
write. Keep `SUPABASE_IMPORT_EXECUTION_ENABLED=false` outside a controlled
migration run.

The `/data` screen can call the same route as an `execute: false` API preflight.
This checks the server-side route contract, insert order, validation status, and
required confirmation string without reaching the write branch. The UI shows the
insert order as a table and shows an execution packet manifest for preflight,
validation, runtime readiness, route audit, execution gate, and packet section
readiness. The manifest and next-action note also expose `waitingItems` as the
number of unresolved manifest items and `copyGate` as either
`resolve waiting items` or `operator review required`; `/data` renders the same
gate as a localized operator label before the detailed checklist. Each preflight
result is scoped to the backup fingerprint, workspace_id, and owner_user_id used
at request time; if those values change, `/data` marks the preflight as stale
and blocks dependent copy actions until preflight is run again. It can copy both
a Markdown preflight report and a migration rehearsal report. It can also
combine the preflight result with runtime readiness into a go/no-go execution
decision memo, bundle the decision, preflight report, route audit, guard
checklist, execute template, rehearsal, post-import evidence record, execution
plan, and adapter contract into one controlled execution packet, then copy a
post-import verification evidence record with slots for the execution audit
artifact, row counts, relationship checks, pending ID audit, RLS owner audit,
and smoke test results. The route also returns a secret-free audit artifact with
execution gate booleans, validation blockers, insert order, and execution result
status; `/data` can copy it after preflight. Run this before copying handoff
material or before enabling the execution gate.

`/data` can also copy an `execute: true` request template and an execution guard
checklist. These are operator artifacts only: the UI still does not trigger a
write. The template uses a backup JSON placeholder and requires operators to
paste the validated backup in a trusted server-side context.

The RLS owner access audit SQL checks the data prerequisites for workspace-based
RLS before production usage. It requires the imported `workspaces.id` and the
actual Supabase `owner_user_id`, then checks owner mapping, owner membership,
user profile mapping, user-owned prompt assets, feedback, prompt skills, and
company profile workspace linkage. This is a read-only prerequisite audit; it
does not replace an authenticated app-session RLS smoke test after policies are
enabled.

`/data` can also copy a workspace-membership RLS policy draft. The draft enables
RLS on the documented workspace tables and creates helper functions plus
read/write policies based on `workspace_members`. Treat it as a review artifact,
not an auto-applied migration: confirm role semantics, policy names, function
ownership, and authenticated app-session smoke tests before running it in a
Supabase project.

After policies are enabled, `/data` can copy an authenticated RLS smoke test
checklist. It separates owner, member, viewer, non-member, and cross-workspace
cases, and requires evidence that allow/deny outcomes come from RLS rather than
client-side UI guards.

After the SQL templates are prepared, `/data` can copy a verification report
template. The report records the expected row counts, relationship acceptance
criteria, pending ID replacement guide, unresolved dry-run warnings, rollback
triggers, and sign-off checklist. Use it as the operator handoff artifact after
running the importer and both verification queries.

For handoff, `/data` can copy a single Supabase migration package that bundles
the dry-run, all verification SQL templates, RLS draft SQL, authenticated smoke
test checklist, reference replacement guide, and verification report into one
Markdown document. The guide separates IDs that must become Supabase UUIDs from
deleted archive trace IDs that should remain unchanged for auditability.

`/data` also exposes an environment readiness package. It lists the currently
active OpenAI variables, Supabase migration-target variables, and future storage
switch variables with their exposure level and validation rule. This package is
for operator preparation only; real secret values should stay in `.env.local`
or the deployment provider's secret store and should not be pasted into handoff
documents.

The runtime state behind that card comes from:

```text
src/app/api/system/readiness/route.ts
```

The route only returns booleans and non-secret labels such as generation mode,
model name, and storage mode. It must not return raw API keys, Supabase keys, or
project secrets.

The `/data` screen can copy the runtime response as formatted JSON for debugging
or as a Markdown diagnostics report for handoff. Both formats are derived from
the non-secret runtime status object.

The runtime status also includes a release gate. The gate intentionally separates
local MVP readiness from Supabase migration readiness so a missing Supabase
configuration does not block local fallback operation, while still making
migration blockers visible before data is moved.

Release gate checks include next actions. `/data` surfaces non-passing checks as
an operator action queue, and the copied runtime diagnostics report preserves
those actions for handoff.

For shorter handoff, `/data` can also copy an operator action plan that includes
only the current gate, non-passing actions, verification steps, and secret
handling rules.

Runtime readiness snapshots are stored locally under
`prompt-ai-studio:runtime-readiness-snapshots`. They keep the latest non-secret
runtime status objects so operators can compare gate stage and score before and
after environment changes. The snapshot list is capped at five entries and can
be copied as JSON from `/data`.

When a snapshot exists, `/data` compares the current runtime status against the
latest snapshot. The comparison highlights stage movement, score delta, variable
configuration changes, release-gate check changes, and can be copied as a
Markdown report.

This is not a database replacement. It is a reversible local safety layer and a migration bridge. Before adding Supabase, use this export format to confirm that the browser workspace data can be serialized, validated, restored, and mapped into relational tables.

## Repository boundary

The long-term async repository contract is defined in:

```text
src/lib/data/repository.ts
```

The contract covers:

- user profile
- company profile
- prompt assets
- prompt versions and feedback through prompt assets
- learning memories
- prompt skills

## Migration path

### Phase 1. Local MVP

- Use `localStorage`
- Keep data shape close to future DB records
- Validate product flows quickly

### Phase 2. Supabase persistence

- Add Supabase client
- Add a migration importer for `schemaVersion: 1` backup JSON
- Replace dry-run `pending-*` references with inserted Supabase UUIDs in the importer
- Import deleted local archive rows into `deleted_prompt_assets` with their prompt snapshots
- Bind the `supabase-importer.ts` adapter to a server-only service-role Supabase client
- Keep `SUPABASE_IMPORT_EXECUTION_ENABLED` false except during a controlled migration run
- Implement a server-side repository for Route Handlers and Server Actions
- Keep browser hooks as query/mutation wrappers
- Preserve local fallback only for demo/offline mode

### Phase 3. Multi-user workspace

- Add auth
- Add workspace membership
- Enable row-level security
- Move company profile, prompt assets, feedback, and learning memories under workspace ownership

### Phase 4. RAG and documents

- Add document source records
- Add document chunks with embeddings
- Use retrieved chunks as additional prompt context

The `/data` screen now exposes document/RAG readiness before upload execution
exists. It separates prepared schema artifacts from future gates:
`pgvector`, `document_sources`, and `document_chunks` are documented as ready
schema targets, while ingestion and retrieval remain planned execution gates.
The copied readiness note must keep the same safety line: uploads are not
enabled yet, document data must stay workspace-scoped, embeddings belong in a
trusted server-side job, and retrieved prompt context must preserve source ID
and chunk index citations.

The same panel can load text, Markdown, or JSON into a local-only chunk preview.
This preview does not persist document data. It only creates a copy-ready
ingestion packet with source name, text length, chunk count, chunk ranges, table
write order, server-side embedding gate, and retrieval citation requirements.
Use the packet to review parser, chunking, and citation behavior before adding
actual document upload writes.

The preview can also be sent to Studio as a `data-document-rag` draft. That
draft stores the document source name, chunk ranges, citation requirement, and
return link to `/data` in session storage. When the generated prompt is saved,
the result keeps Studio source metadata so Library and Dashboard can separate
document/RAG drafts from normal local prompt saves. The `/data` panel shows the
Studio handoff readiness before navigation: automatic prompt language strategy
selection, same-as-input answer language, previewed chunk range, and the source
ID plus chunk index citation rule. If draft storage is blocked, the panel stays
on `/data` and shows the document/RAG Studio prompt in the existing manual copy
textarea.

## Data ownership rule

Product learning data belongs to the user's workspace. Model providers are execution engines, not the primary source of truth.

Important data to persist:

- profile preferences
- company rules
- prompt versions
- prompt improvement lineage
- deleted prompt archive snapshots
- execution results
- feedback
- learning memories
- prompt skills
- later: document chunks and retrieval traces

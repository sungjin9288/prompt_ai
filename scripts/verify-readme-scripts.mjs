import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const readme = readFileSync("README.md", "utf8");
const evidenceReadme = readFileSync("docs/evidence/README.md", "utf8");
const scriptsBlockMatch = readme.match(/## Scripts\s+```bash\n([\s\S]*?)```/);

assert.ok(scriptsBlockMatch, "README.md should contain a Scripts bash block");

const documentedCommands = scriptsBlockMatch[1]
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
const documentedCommandSet = new Set(documentedCommands);
const packageScriptCommands = Object.keys(packageJson.scripts || {}).map(
  (scriptName) => `npm run ${scriptName}`,
);
const extraExpectedCommands = ["npm run verify:evidence -- --help"];

for (const command of [...packageScriptCommands, ...extraExpectedCommands]) {
  assert.ok(
    documentedCommandSet.has(command),
    `README Scripts block is missing ${command}`,
  );
}

for (const command of documentedCommands) {
  if (extraExpectedCommands.includes(command)) {
    continue;
  }

  const scriptName = command.replace(/^npm run /, "");

  assert.ok(
    packageJson.scripts?.[scriptName],
    `README Scripts block documents missing package script ${scriptName}`,
  );
}

assert.match(
  readme,
  /same verification check\s+manifest/,
  "README should explain that verify and evidence use the same manifest",
);
assert.match(
  readme,
  /smoke:mcp` runs the local MCP bridge self-test without contacting GPT,\s+Claude, Codex, Gemini, OpenAI, or Supabase/,
  "README should document the local MCP smoke command",
);
assert.match(
  readme,
  /-- --out path\/to\/mcp-smoke\.md/,
  "README should document the MCP smoke evidence output path",
);
assert.match(
  readme,
  /smoke:mcp-client` runs a local stdio JSON-RPC client sequence against\s+the MCP bridge, confirms a review-required handoff, and writes confirmed\s+feedback to a temporary JSONL inbox without contacting external AI/,
  "README should document the local MCP client smoke command",
);
assert.match(
  readme,
  /-- --out path\/to\/mcp-client-smoke\.md/,
  "README should document the MCP client smoke evidence output path",
);
assert.match(
  readme,
  /smoke:chrome-extension` checks the unpacked Chrome extension manifest,\s+background service worker, popup workflow, local-only URL guard, session restore,\s+and evidence fallback before loading it in Chrome/,
  "README should document the local Chrome extension smoke command",
);
assert.match(
  readme,
  /-- --out path\/to\/chrome-smoke\.md/,
  "README should document the Chrome extension smoke evidence output path",
);
assert.match(
  readme,
  /smoke:learning-feedback` checks the Learning feedback-improvement\s+queue, low-confidence Studio validation draft, Library validation filter, queue\s+report links, and manual copy fallback contract/,
  "README should document the local Learning feedback smoke command",
);
assert.match(
  readme,
  /-- --out path\/to\/learning-feedback-smoke\.md/,
  "README should document the Learning feedback smoke evidence output path",
);
assert.match(
  readme,
  /smoke:integrations` writes the Chrome, MCP bridge, MCP client, and\s+Learning smoke evidence packets plus `integrations-smoke-summary\.md` to\s+`output\/smoke` in one preflight pass before any actual external AI handoff/,
  "README should document the integrated local integrations smoke evidence command",
);
assert.match(
  readme,
  /summary records git branch\/commit provenance, working tree state, and changed\s+file count for the local preflight packet set/,
  "README should document integrated smoke summary git provenance",
);
assert.match(
  readme,
  /production build lock/,
  "README should mention the Next.js build lock limitation",
);
assert.match(
  readme,
  /## Release Evidence Checklist/,
  "README should include a release evidence checklist",
);
assert.match(
  readme,
  /npm run verify:evidence -- --out-dir docs\/evidence/,
  "README should document evidence artifact generation",
);
assert.match(
  readme,
  /includes git branch\/commit provenance, working tree state, command results,\s+runtime readiness booleans/,
  "README should document git provenance in verification evidence",
);
assert.match(
  readme,
  /Runtime variable rows use\s+`variable KEY; configured yes\/no` wording instead of environment assignment\s+syntax/,
  "README should document secret-scan-safe runtime variable evidence formatting",
);
assert.match(
  readme,
  /redaction, git provenance, and\s+failure evidence writing/,
  "README should document the evidence CLI git provenance guard",
);
assert.match(
  readme,
  /verify:evidence-hygiene` checks that `docs\/evidence` has its README,\s+keeps at most one active timestamped evidence record, requires git provenance,\s+and rejects runtime variable rows that look like secret assignments/,
  "README should document the evidence hygiene verification scope",
);
assert.match(
  readme,
  /Confirm the evidence includes git branch, commit, working tree state, and\s+changed file count captured before the grouped commit is created/,
  "README release checklist should require pre-commit evidence git provenance",
);
assert.match(
  readme,
  /verify:manifest` checks that the shared verification manifest matches\s+package scripts, runs first inside `npm run verify`, and keeps the\s+release-candidate gate tied to repo boundary, evidence hygiene, local smoke\s+evidence, and secret safety checks/,
  "README should document the verification manifest scope",
);
assert.match(
  readme,
  /verify:openai-fallback` checks that prompt generation stays on the\s+local builder when `OPENAI_API_KEY` is absent and that the status route reports\s+local mode without exposing a model value/,
  "README should document the OpenAI fallback verification scope",
);
assert.match(
  readme,
  /verify:navigation-href` checks that shared internal route helpers reject\s+external or protocol-relative URLs, preserve path\/query\/hash, and format copy\s+links through normalized internal hrefs/,
  "README should document the navigation href verification scope",
);
assert.match(
  readme,
  /It also checks that `\.env\.example`,\s+runtime readiness, and the operator-gated OpenAI next step stay aligned/,
  "README should document the OpenAI operator readiness verification scope",
);
assert.match(
  readme,
  /verify:openai-comparison` builds the same local prompt fixture used for\s+OpenAI rollout checks, keeps the default run offline, and documents the\s+`OPENAI_API_KEY` plus `OPENAI_COMPARISON_LIVE=1` gate for a live comparison/,
  "README should document the OpenAI comparison smoke scope",
);
assert.match(
  readme,
  /-- --out path\/to\/openai-comparison\.md/,
  "README should document the OpenAI comparison evidence output path",
);
assert.match(
  readme,
  /verify:secrets/,
  "README should require secret scanning in release evidence",
);
assert.match(
  readme,
  /verify:smoke-evidence` checks that `output\/smoke` contains its local\s+README plus exactly the integrated summary, Chrome, MCP bridge, MCP client, and\s+Learning smoke evidence packets and that each packet keeps its local-only or\s+review-required contract text/,
  "README should document the smoke evidence verification scope",
);
assert.match(
  readme,
  /Supabase import execution gate/,
  "README should mention the Supabase import execution gate",
);
assert.match(
  readme,
  /verify:scope` checks Supabase preflight scope drift for backup\s+fingerprint, workspace_id, and owner_user_id changes/,
  "README should document the Supabase preflight scope verification scope",
);
assert.match(
  readme,
  /-- --out path\/to\/supabase-scope-guard\.md/,
  "README should document the Supabase scope guard evidence output path",
);
assert.match(
  readme,
  /verify:data-management` checks that Data management exposes the\s+Supabase import execution packet manifest, waiting summary, copy gate, and\s+next-action note as copy-ready operational artifacts/,
  "README should document the data-management verification scope",
);
assert.match(
  readme,
  /parses `\/data`\s+copy handlers and fails if a `copyDataText` call omits the failure notice and\s+metadata-rich manual fallback body/,
  "README should document the data-management copy fallback verification scope",
);
assert.match(
  readme,
  /checks that the Supabase REST\s+import adapter keeps write gates server-only, rejects unexpected tables, and\s+skips empty batches without calling Supabase/,
  "README should document the data-management Supabase REST adapter guard verification scope",
);
assert.match(
  readme,
  /checks that the import\s+route returns explicit execute-gate and validation-blocked responses before any\s+write adapter can run/,
  "README should document the data-management Supabase import route gate verification scope",
);
assert.match(
  readme,
  /checks that the route returns the execution\s+result summary and embeds the same result in the route audit artifact/,
  "README should document the data-management Supabase execute result verification scope",
);
assert.match(
  readme,
  /checks that the execute request template keeps the exact execute JSON\s+payload, required preconditions, and post-import follow-up checks together/,
  "README should document the data-management Supabase execute request template verification scope",
);
assert.match(
  readme,
  /checks that the execution guard checklist keeps every no-go condition\s+and required post-execution action together/,
  "README should document the data-management Supabase execution guard checklist verification scope",
);
assert.match(
  readme,
  /checks that the post-import evidence record keeps identity, required\s+evidence, acceptance gates, evidence slots, and rollback triggers together/,
  "README should document the data-management Supabase post-import evidence verification scope",
);
assert.match(
  readme,
  /checks that the migration handoff package keeps target identity, read\s+order, SQL audits, RLS checks, and the verification report together/,
  "README should document the data-management Supabase migration handoff package verification scope",
);
assert.match(
  readme,
  /`execute=true`로 실제 Supabase REST insert를 실행하려면[\s\S]*?`SUPABASE_IMPORT_EXECUTION_ENABLED=true`[\s\S]*?`NEXT_PUBLIC_SUPABASE_URL`[\s\S]*?`SUPABASE_SERVICE_ROLE_KEY`[\s\S]*?`confirmation: "RUN_SUPABASE_IMPORT"`[\s\S]*?execution plan validation이 `ok`여야 합니다/,
  "README should document every Supabase execute=true gate, including plan validation",
);
assert.match(
  readme,
  /verify:integrations` checks that the Integrations route, navigation,\s+Chrome\/Gen AI\/MCP surfaces, MCP tool contract, and product docs stay aligned/,
  "README should document the integrations verification scope",
);
assert.match(
  readme,
  /verify:build-stability` checks that runtime source stays free of\s+network Google font imports and keeps local app font stacks defined for stable\s+offline production builds/,
  "README should document the build-stability verification scope",
);
assert.match(
  readme,
  /verify:terminology` checks README, docs, source, and scripts for\s+current Studio saved-source wording and blocks old source-kind\/source-metadata\s+terms from returning/,
  "README should document the terminology verification scope",
);
assert.match(
  readme,
  /verify:studio-draft-fallbacks` checks that every Studio draft write\s+stores the result in `wroteDraft` and immediately returns from its manual\s+fallback guard/,
  "README should document the Studio draft fallback guard verification scope",
);
assert.match(
  readme,
  /verify:release-candidate` checks active evidence hygiene, local smoke\s+evidence packets, secret scan, and root temporary directory cleanup before a\s+grouped commit or handoff/,
  "README should document the release-candidate verification scope",
);
assert.match(
  readme,
  /verify:repo-boundary` checks that this project is the active git\s+top-level instead of a loose folder inside the parent `\/Users\/sungjin\/dev` repo/,
  "README should document the repo-boundary verification scope",
);
assert.match(
  readme,
  /raw OpenAI API keys/,
  "README should warn against pasting raw secrets into handoff material",
);
assert.match(
  readme,
  /Before the first grouped commit, run `npm run verify:repo-boundary` and\s+confirm this project is the git top-level at\s+`\/Users\/sungjin\/dev\/personal\/prompt-ai-studio`, not a loose untracked\s+folder inside the parent `\/Users\/sungjin\/dev` repo/,
  "README should document the project git boundary check before grouped commits",
);
assert.match(
  readme,
  /## 다음 개발 후보[\s\S]*?### 로컬에서 바로 진행[\s\S]*?Integrations 실제 사용 smoke[\s\S]*?Release candidate 정리[\s\S]*?npm run verify:release-candidate[\s\S]*?npm run verify:repo-boundary[\s\S]*?\/Users\/sungjin\/dev\/personal\/prompt-ai-studio/,
  "README should separate local next development candidates",
);
assert.match(
  readme,
  /MCP부터 시작할 때는 `npm run smoke:mcp`로 로컬 bridge 계약을 먼저 확인[\s\S]*?npm run smoke:mcp -- --out output\/smoke\/mcp-bridge-smoke\.md/,
  "README should route MCP next-step smoke through npm run smoke:mcp with evidence output",
);
assert.match(
  readme,
  /실제 client 호출 흐름까지 확인하려면[\s\S]*?npm run smoke:mcp-client -- --out output\/smoke\/mcp-client-smoke\.md/,
  "README should route MCP next-step client smoke through npm run smoke:mcp-client",
);
assert.match(
  readme,
  /Chrome부터 시작할 때는 `npm run smoke:chrome-extension`으로 unpacked\s+extension 파일 계약을 먼저 확인[\s\S]*?npm run smoke:chrome-extension -- --out output\/smoke\/chrome-extension-smoke\.md/,
  "README should route Chrome next-step smoke through npm run smoke:chrome-extension",
);
assert.match(
  readme,
  /실제 연결 전에 `npm run smoke:integrations`로 Chrome, MCP bridge, MCP\s+client, Learning local smoke packet과 `integrations-smoke-summary\.md`를 한\s+번에 갱신합니다/,
  "README should route integrations next-step preflight through npm run smoke:integrations",
);
assert.match(
  readme,
  /Learning feedback 개선 큐 정리:[\s\S]*?npm run smoke:learning-feedback[\s\S]*?npm run smoke:learning-feedback -- --out output\/smoke\/learning-feedback-smoke\.md/,
  "README should route Learning feedback next-step smoke through npm run smoke:learning-feedback with evidence output",
);
assert.match(
  readme,
  /### operator gate 이후 진행[\s\S]*?OpenAI API 기반 프롬프트 분석 고도화[\s\S]*?npm run verify:openai-fallback[\s\S]*?OPENAI_COMPARISON_LIVE=1 npm run verify:openai-comparison[\s\S]*?-- --out docs\/evidence\/openai-comparison-live\.md[\s\S]*?Supabase Postgres 저장소와 백업 JSON importer 구현[\s\S]*?npm run verify:scope -- --out docs\/evidence\/supabase-scope-guard\.md[\s\S]*?팀\/회사 워크스페이스/,
  "README should separate operator-gated next development candidates",
);
assert.match(
  readme,
  /현재 runtime readiness와 필요한 권한 gate를 먼저 확인/,
  "README should require runtime readiness and permission gates before next candidates",
);

assert.match(
  evidenceReadme,
  /npm run verify:evidence -- --out-dir docs\/evidence/,
  "docs/evidence README should document evidence artifact generation",
);
assert.match(
  evidenceReadme,
  /runtime variable rows written as `variable KEY; configured yes\/no`/,
  "docs/evidence README should document secret-scan-safe runtime variable rows",
);
assert.match(
  evidenceReadme,
  /every script from the shared verification manifest, including `verify:manifest`,\s+`verify:docs`, `verify:secrets`, `verify:smoke-evidence`, `lint`, and `build`/,
  "docs/evidence README should require every shared manifest check in evidence",
);
assert.match(
  evidenceReadme,
  /git provenance with branch, commit, working tree state, and changed file count\s+captured before the grouped commit is created/,
  "docs/evidence README should require pre-commit git provenance fields",
);
assert.match(
  evidenceReadme,
  /Remove superseded records before committing a grouped change set/,
  "docs/evidence README should document grouped-change evidence hygiene",
);
assert.match(
  evidenceReadme,
  /Never paste raw OpenAI keys, Supabase keys, service-role values, or tokens/,
  "docs/evidence README should document secret handling",
);

console.log(
  `README scripts verification passed for ${documentedCommands.length} commands.`,
);

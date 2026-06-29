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
  /Runtime\s+variable rows use `variable KEY; configured yes\/no` wording instead of\s+environment assignment syntax/,
  "README should document secret-scan-safe runtime variable evidence formatting",
);
assert.match(
  readme,
  /runtime variable evidence format so missing keys do not look like secret\s+assignments/,
  "README should document the evidence CLI runtime variable formatting guard",
);
assert.match(
  readme,
  /verify:evidence-hygiene` checks that `docs\/evidence` has its README,\s+keeps at most one active timestamped evidence record, and rejects runtime\s+variable rows that look like secret assignments/,
  "README should document the evidence hygiene verification scope",
);
assert.match(
  readme,
  /verify:manifest/,
  "README should require manifest verification in release evidence",
);
assert.match(
  readme,
  /verify:openai-fallback` checks that prompt generation stays on the\s+local builder when `OPENAI_API_KEY` is absent and that the status route reports\s+local mode without exposing a model value/,
  "README should document the OpenAI fallback verification scope",
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
  /verify:studio-draft-fallbacks` checks that every Studio draft write\s+stores the result in `wroteDraft` and keeps a matching manual fallback guard/,
  "README should document the Studio draft fallback guard verification scope",
);
assert.match(
  readme,
  /verify:release-candidate` checks active evidence hygiene, secret scan,\s+and root temporary directory cleanup before a grouped commit or handoff/,
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
  /MCP부터 시작할 때는 `npm run smoke:mcp`로 로컬 bridge 계약을 먼저 확인/,
  "README should route MCP next-step smoke through npm run smoke:mcp",
);
assert.match(
  readme,
  /Chrome부터 시작할 때는 `npm run smoke:chrome-extension`으로 unpacked\s+extension 파일 계약을 먼저 확인[\s\S]*?npm run smoke:chrome-extension -- --out docs\/evidence\/chrome-extension-smoke\.md/,
  "README should route Chrome next-step smoke through npm run smoke:chrome-extension",
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
  /every script from the shared verification manifest, including `verify:manifest`,\s+`verify:docs`, `verify:secrets`, `lint`, and `build`/,
  "docs/evidence README should require every shared manifest check in evidence",
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

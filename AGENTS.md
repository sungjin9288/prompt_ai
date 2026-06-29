<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Codex 작업 게이트

- 비자명한 구현은 `karpathy-guidelines` 흐름으로 시작합니다: 성공 기준을 먼저 적고, repo 문맥을 확인한 뒤, 최소 변경으로 닫고, 검증 명령을 실행합니다.
- 수정 전에는 `repo-intake` 기준으로 이 파일, `package.json`, 관련 `docs/`, 관련 `scripts/verify-*.mjs`를 먼저 확인합니다.
- 변경은 `edit-discipline` 기준으로 요청 범위에 직접 연결되는 파일만 건드립니다. source ID, variant, registry, href helper는 README의 개발 기준을 따릅니다.
- 완료 전에는 `verify-gate` 기준으로 touched surface에 맞는 `npm run verify:*`, `npm run lint`, `npm run build`, 또는 `npm run verify`를 실행하고 결과를 남깁니다.
- LazyCodex/Hermes 계열 패턴은 의존성이나 글로벌 Codex 설정으로 vendoring하지 않습니다. 이 프로젝트에는 review-required handoff, 명시적 operator gate, feedback evidence, session/source trace 패턴만 제품 문맥에 맞게 재구현합니다.

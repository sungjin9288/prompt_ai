import assert from "node:assert/strict";
import { readSource } from "./lib/read-source.mjs";

const source = readSource("src/components/app-shell.tsx");
const readme = readSource("README.md");

const navItemMatches = [...source.matchAll(/href: "([^"]+)",[\s\S]*?label: "([^"]+)",[\s\S]*?nextAction: "([^"]+)",[\s\S]*?summary: "([^"]+)"/g)];
const navGroupMatches = [...source.matchAll(/group: "([^"]+)"/g)];

assert.equal(
  navItemMatches.length,
  9,
  "App shell should keep every primary navigation item documented with summary and next action",
);

assert.deepEqual(
  [...new Set(navGroupMatches.map(([, group]) => group))],
  ["운영", "작업", "시스템", "기준"],
  "App shell should group primary navigation into readable work areas",
);

for (const [, href, label, nextAction, summary] of navItemMatches) {
  assert.ok(href, `${label} should have an href`);
  assert.ok(nextAction.length >= 4, `${label} should have a readable next action`);
  assert.ok(summary.length >= 10, `${label} should have a readable summary`);
}

assert.match(
  source,
  /const currentItem =[\s\S]*?navItems\.find\(\(item\) => isActivePath\(pathname, item\.href\)\) \?\? navItems\[0\]/,
  "App shell should derive the current navigation item from the route",
);

assert.match(
  source,
  /<select[\s\S]*?value=\{currentItem\.href\}[\s\S]*?router\.push\(event\.target\.value\)[\s\S]*?navItems\.map/,
  "Mobile navigation should remain a route-driven select menu",
);

assert.match(
  source,
  /const currentGroup =[\s\S]*?navGroups\.find\(\(group\) => group\.label === currentItem\.group\) \?\?[\s\S]*?navGroups\[0\]/,
  "App shell should derive the current navigation group from the active item",
);

assert.match(
  source,
  /const currentGroupItems = navItems\.filter\([\s\S]*?item\.group === currentGroup\.label[\s\S]*?\)/,
  "App shell should derive the current group's quick actions from the active group",
);

assert.match(
  source,
  /data-testid="app-shell-current-context"[\s\S]*?currentGroup\.label[\s\S]*?currentItem\.label[\s\S]*?currentItem\.summary[\s\S]*?currentGroup\.summary[\s\S]*?currentItem\.nextAction/,
  "App shell should render current section group, context, and next action",
);

assert.match(
  source,
  /data-testid="app-shell-current-group-actions"[\s\S]*?currentGroupItems\.map[\s\S]*?isActivePath\(pathname, item\.href\)[\s\S]*?item\.label[\s\S]*?item\.nextAction/,
  "App shell should render quick links for the active group's sections and next actions",
);

assert.match(
  source,
  /aria-label="주요 메뉴"[\s\S]*?groupedNavItems\.map[\s\S]*?group\.items\.map[\s\S]*?isActivePath\(pathname, item\.href\)/,
  "Desktop navigation should render every primary nav item inside readable groups with active state",
);

assert.match(
  readme,
  /전역 헤더는 현재 섹션의 역할과 다음 행동을 함께 보여줘 기능이 많아져도 사용자가 위치와 다음 조치를 바로 파악하게 합니다\./,
  "README should document the app shell current context summary",
);

assert.match(
  readme,
  /전역 헤더는 주요 메뉴를 운영, 작업, 기준, 시스템 그룹으로 나눠/,
  "README should document grouped app shell navigation",
);

assert.match(
  readme,
  /전역 헤더는 현재 그룹의 빠른 이동 줄에서 같은 흐름의 기능명과 다음 행동을 함께 보여줘/,
  "README should document current-group quick navigation actions",
);

console.log("App shell navigation verification passed.");

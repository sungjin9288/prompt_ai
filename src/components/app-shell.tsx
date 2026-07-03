"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LiveAnnouncer } from "@/components/common/live-announcer";
import { CommandPalette } from "@/components/common/command-palette";
import { KeyboardShortcuts } from "@/components/common/keyboard-shortcuts";
import { openCommandPalette } from "@/lib/browser/command-palette-bus";

type NavGroup = "운영" | "작업" | "기준" | "시스템";

interface NavItem {
  group: NavGroup;
  href: string;
  label: string;
  nextAction: string;
  summary: string;
}

const navGroups: { label: NavGroup; summary: string }[] = [
  { label: "운영", summary: "대시보드, 저장본, 학습 점검" },
  { label: "작업", summary: "프롬프트 작성과 스킬 실행" },
  { label: "기준", summary: "개인/회사 맥락" },
  { label: "시스템", summary: "연결과 데이터" },
];

const navItems = [
  {
    group: "운영",
    href: "/",
    label: "홈",
    nextAction: "우선순위 확인",
    summary: "전체 운영 상태와 다음 실행 큐",
  },
  {
    group: "작업",
    href: "/studio",
    label: "작성",
    nextAction: "프롬프트 생성",
    summary: "원문을 전문 프롬프트로 정제",
  },
  {
    group: "운영",
    href: "/library",
    label: "라이브러리",
    nextAction: "저장본 점검",
    summary: "프롬프트 자산과 개선 이력 관리",
  },
  {
    group: "운영",
    href: "/learning",
    label: "학습",
    nextAction: "메모리 보강",
    summary: "개인화 기준과 피드백 규칙 관리",
  },
  {
    group: "운영",
    href: "/activity",
    label: "활동",
    nextAction: "이력 확인",
    summary: "생성·개선·실행 이력을 시간순으로 확인",
  },
  {
    group: "작업",
    href: "/skills",
    label: "스킬",
    nextAction: "반복 업무 실행",
    summary: "저장 프롬프트를 실행 템플릿으로 전환",
  },
  {
    group: "시스템",
    href: "/integrations",
    label: "연결",
    nextAction: "외부 AI 전달",
    summary: "Chrome, MCP, Gen AI 환경 연결",
  },
  {
    group: "기준",
    href: "/profile",
    label: "개인",
    nextAction: "선호 저장",
    summary: "사용자 업무 방식과 응답 선호 관리",
  },
  {
    group: "기준",
    href: "/company",
    label: "회사",
    nextAction: "브랜드 기준 저장",
    summary: "회사 톤과 제품 맥락 관리",
  },
  {
    group: "시스템",
    href: "/data",
    label: "데이터",
    nextAction: "백업 확인",
    summary: "백업, 복원, RAG 준비도 관리",
  },
] satisfies NavItem[];

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentItem =
    navItems.find((item) => isActivePath(pathname, item.href)) ?? navItems[0];
  const currentGroup =
    navGroups.find((group) => group.label === currentItem.group) ??
    navGroups[0];
  const currentGroupItems = navItems.filter(
    (item) => item.group === currentGroup.label,
  );
  const groupedNavItems = navGroups.map((group) => ({
    ...group,
    items: navItems.filter((item) => item.group === group.label),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-line bg-background/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-black text-background">
                PA
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold tracking-normal">
                  Prompt AI Studio
                </span>
                <span className="block truncate text-xs text-muted">
                  개인화 프롬프트 운영 워크스페이스
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => openCommandPalette()}
              className="hidden shrink-0 items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs text-muted transition hover:bg-surface hover:text-foreground md:flex"
            >
              <span>검색</span>
              <span className="rounded border border-control-border px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </span>
            </button>
          </div>

          <div className="flex min-w-0 flex-col gap-2 lg:flex-1 lg:items-end">
            <label className="md:hidden">
              <span className="sr-only">주요 메뉴</span>
              <select
                value={currentItem.href}
                onChange={(event) => router.push(event.target.value)}
                className="h-11 w-full rounded-md border border-control-border bg-panel px-3 text-sm font-medium text-foreground focus:border-accent"
              >
                {navItems.map((item) => (
                  <option key={item.href} value={item.href}>
                    {item.group} · {item.label}
                  </option>
                ))}
              </select>
            </label>

            <nav
              className="hidden flex-wrap items-center justify-end gap-2 md:flex"
              aria-label="주요 메뉴"
            >
              {groupedNavItems.map((group) => (
                <div
                  key={group.label}
                  className="flex items-center gap-1 rounded-md border border-line bg-panel px-1.5 py-1"
                >
                  <span className="px-1.5 text-[11px] font-semibold text-muted">
                    {group.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {group.items.map((item) => {
                      const isActive = isActivePath(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`shrink-0 rounded px-2.5 py-1.5 text-sm transition ${
                            isActive
                              ? "bg-panel-strong text-foreground"
                              : "text-muted hover:bg-surface hover:text-foreground"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div
              className="flex min-w-0 flex-col gap-1 rounded-md border border-line bg-panel px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3 lg:max-w-3xl"
              data-testid="app-shell-current-context"
            >
              <p className="min-w-0 break-words text-muted">
                <span className="font-semibold text-soft">
                  {currentGroup.label} · {currentItem.label}
                </span>{" "}
                · {currentItem.summary}
                <span className="hidden text-muted sm:inline">
                  {" "}
                  / {currentGroup.summary}
                </span>
              </p>
              <p className="shrink-0 font-semibold text-accent">
                다음 · {currentItem.nextAction}
              </p>
            </div>

            <div
              className="flex min-w-0 gap-2 overflow-x-auto pb-1 lg:max-w-3xl"
              data-testid="app-shell-current-group-actions"
            >
              {currentGroupItems.map((item) => {
                const isActive = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`min-w-36 shrink-0 rounded-md border px-3 py-2 text-xs transition ${
                      isActive
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line bg-panel text-muted hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <span className="block font-semibold">{item.label}</span>
                    <span className="mt-0.5 block truncate">
                      {item.nextAction}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto min-h-[calc(100vh-73px)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      >
        {children}
      </main>
      <LiveAnnouncer />
      <CommandPalette />
      <KeyboardShortcuts />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  usePromptAssetsStore,
  usePromptSkillsStore,
  useLearningMemoriesStore,
} from "@/lib/data/workspace-store";
import { scopeLabels } from "@/lib/learning-view/labels";
import { buildPromptLibraryHref, buildSkillHref } from "@/lib/skills-view/hrefs";
import { getLearningHref } from "@/lib/learning-view/hrefs";
import { setCommandPaletteOpenListener } from "@/lib/browser/command-palette-bus";
import { openKeyboardHelp } from "@/lib/browser/keyboard-help-bus";
import { sortPinnedFirst } from "@/lib/library/pins";

interface CommandItem {
  id: string;
  group: string;
  label: string;
  sublabel?: string;
  searchText?: string;
  href?: string;
  onSelect?: () => void;
}

const MAX_RESULTS = 9;
const RECENT_PROMPT_COUNT = 3;
const PROMPT_LABEL_PREVIEW_LENGTH = 40;
const MEMORY_LABEL_PREVIEW_LENGTH = 40;

const quickNavItems: CommandItem[] = [
  { id: "nav-home", group: "이동", label: "홈", href: "/" },
  { id: "nav-studio", group: "이동", label: "작성", href: "/studio" },
  { id: "nav-library", group: "이동", label: "라이브러리", href: "/library" },
  { id: "nav-learning", group: "이동", label: "학습", href: "/learning" },
  { id: "nav-activity", group: "이동", label: "활동", href: "/activity" },
  { id: "nav-skills", group: "이동", label: "스킬", href: "/skills" },
  { id: "nav-integrations", group: "이동", label: "연결", href: "/integrations" },
  { id: "nav-profile", group: "이동", label: "개인", href: "/profile" },
  { id: "nav-company", group: "이동", label: "회사", href: "/company" },
  { id: "nav-data", group: "이동", label: "데이터", href: "/data" },
  {
    id: "action-keyboard-shortcuts",
    group: "일반",
    label: "키보드 단축키",
    onSelect: () => openKeyboardHelp(),
  },
];

function truncate(text: string, maxLength: number) {
  const trimmed = text.trim();

  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength)}…`
    : trimmed;
}

function matchesQuery(item: CommandItem, query: string) {
  const haystack = `${item.label} ${item.sublabel ?? ""} ${
    item.searchText ?? ""
  }`.toLowerCase();

  return haystack.includes(query);
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const [prompts] = usePromptAssetsStore();
  const [skills] = usePromptSkillsStore();
  const [memories] = useLearningMemoriesStore();

  const allItems = useMemo<CommandItem[]>(() => {
    const promptItems: CommandItem[] = sortPinnedFirst(prompts).map((prompt) => ({
      id: `prompt-${prompt.id}`,
      group: "프롬프트",
      label:
        prompt.title.trim().length > 0
          ? prompt.title
          : truncate(prompt.rawInput, PROMPT_LABEL_PREVIEW_LENGTH),
      sublabel: prompt.domain,
      searchText: (prompt.tags ?? []).join(" "),
      href: buildPromptLibraryHref(prompt.id, prompt.versions[0]?.targetModel),
    }));

    const skillItems: CommandItem[] = skills.map((skill) => ({
      id: `skill-${skill.id}`,
      group: "스킬",
      label: skill.name,
      href: buildSkillHref(skill.id),
    }));

    const memoryItems: CommandItem[] = memories.map((memory) => ({
      id: `memory-${memory.id}`,
      group: "학습",
      label:
        memory.title.trim().length > 0
          ? memory.title
          : truncate(memory.content, MEMORY_LABEL_PREVIEW_LENGTH),
      sublabel: scopeLabels[memory.scope],
      href: getLearningHref({
        query: "",
        reviewFilter: "all",
        scope: memory.scope,
        sortMode: "confidence-desc",
      }),
    }));

    return [...quickNavItems, ...promptItems, ...skillItems, ...memoryItems];
  }, [prompts, skills, memories]);

  const results = useMemo<CommandItem[]>(() => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      const recentPrompts = allItems.filter(
        (item) => item.group === "프롬프트",
      );

      return [
        ...quickNavItems,
        ...recentPrompts.slice(0, RECENT_PROMPT_COUNT),
      ].slice(0, MAX_RESULTS);
    }

    return allItems
      .filter((item) => matchesQuery(item, trimmedQuery))
      .slice(0, MAX_RESULTS);
  }, [allItems, query]);

  const groupedResults = useMemo(() => {
    const groups = new Map<string, CommandItem[]>();

    for (const item of results) {
      const existing = groups.get(item.group) ?? [];
      groups.set(item.group, [...existing, item]);
    }

    return [...groups.entries()];
  }, [results]);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
    previouslyFocusedRef.current?.focus();
  }, []);

  const openPalette = useCallback(() => {
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setIsOpen(true);
  }, []);

  const selectItem = useCallback(
    (item: CommandItem) => {
      closePalette();

      if (item.onSelect) {
        item.onSelect();

        return;
      }

      if (item.href) {
        router.push(item.href);
      }
    },
    [router, closePalette],
  );

  useEffect(() => {
    setCommandPaletteOpenListener(openPalette);

    return () => setCommandPaletteOpenListener(null);
  }, [openPalette]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      const isToggleShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (isToggleShortcut) {
        event.preventDefault();
        setIsOpen((current) => {
          if (current) {
            setQuery("");
            setActiveIndex(0);
            previouslyFocusedRef.current?.focus();

            return false;
          }

          previouslyFocusedRef.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;

          return true;
        });

        return;
      }

      if (event.key === "Escape" && isOpen) {
        closePalette();
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, closePalette]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const clampedActiveIndex =
    results.length === 0
      ? 0
      : Math.min(activeIndex, results.length - 1);

  const handleQueryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      setActiveIndex(0);
    },
    [],
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (results.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => {
          const base = Math.min(current, results.length - 1);

          return (base + 1) % results.length;
        });

        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => {
          const base = Math.min(current, results.length - 1);

          return (base - 1 + results.length) % results.length;
        });

        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const activeItem = results[clampedActiveIndex];

        if (activeItem) {
          selectItem(activeItem);
        }
      }
    },
    [results, clampedActiveIndex, selectItem],
  );

  if (!isOpen) {
    return null;
  }

  const activeItemId = results[clampedActiveIndex]
    ? `command-palette-option-${results[clampedActiveIndex].id}`
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={closePalette}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="워크스페이스 검색"
        className="relative z-10 w-full max-w-xl rounded-lg border border-line bg-panel shadow-2xl"
      >
        <label htmlFor="command-palette-input" className="sr-only">
          저장본, 스킬, 메모리 검색 또는 이동
        </label>
        <input
          id="command-palette-input"
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-palette-listbox"
          aria-activedescendant={activeItemId}
          autoComplete="off"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleInputKeyDown}
          placeholder="저장본, 스킬, 메모리 검색 또는 이동…"
          className="w-full rounded-t-lg border-b border-line bg-panel px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none"
        />

        <div
          id="command-palette-listbox"
          role="listbox"
          aria-label="검색 결과"
          className="max-h-80 overflow-y-auto py-2"
        >
          {groupedResults.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted">
              검색 결과가 없습니다.
            </p>
          )}

          {groupedResults.map(([group, items]) => (
            <div key={group} className="px-2 py-1">
              <p className="px-2 py-1 text-[11px] font-semibold text-muted">
                {group}
              </p>
              {items.map((item) => {
                const index = results.indexOf(item);
                const isActive = index === clampedActiveIndex;

                return (
                  <button
                    key={item.id}
                    id={`command-palette-option-${item.id}`}
                    role="option"
                    aria-selected={isActive}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectItem(item)}
                    className={`flex w-full min-w-0 items-center justify-between gap-3 rounded px-2 py-2 text-left text-sm transition ${
                      isActive
                        ? "bg-panel-strong text-foreground"
                        : "text-soft hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <span className="min-w-0 truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="shrink-0 truncate text-xs text-muted">
                        {item.sublabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          결과 {results.length}개
        </div>
      </div>
    </div>
  );
}

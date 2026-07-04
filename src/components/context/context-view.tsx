"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CompanyEditor } from "@/components/company/company-editor";
import { ProfileEditor } from "@/components/profile/profile-editor";
import {
  resolveContextSection,
  type ContextSection,
} from "@/lib/context/section";

const contextSections: { id: ContextSection; label: string }[] = [
  { id: "profile", label: "개인 맥락" },
  { id: "company", label: "회사 맥락" },
];

function getInitialSection(fallback: ContextSection): ContextSection {
  if (typeof window === "undefined" || !window.location.hash) {
    return fallback;
  }

  return resolveContextSection(window.location.hash.replace("#", ""));
}

export function ContextView({
  initialSection,
  returnTo,
}: {
  initialSection: ContextSection;
  returnTo?: string;
}) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ContextSection>(() =>
    getInitialSection(initialSection),
  );
  const tabRefs = useRef<Record<ContextSection, HTMLButtonElement | null>>({
    profile: null,
    company: null,
  });

  function selectSection(section: ContextSection) {
    setActiveSection(section);
    router.replace(`/context#${section}`, { scroll: false });
  }

  function focusSection(section: ContextSection) {
    selectSection(section);
    tabRefs.current[section]?.focus();
  }

  function handleTablistKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const currentIndex = contextSections.findIndex(
      (section) => section.id === activeSection,
    );

    if (currentIndex === -1) {
      return;
    }

    const lastIndex = contextSections.length - 1;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
      focusSection(contextSections[nextIndex].id);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const previousIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
      focusSection(contextSections[previousIndex].id);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusSection(contextSections[0].id);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusSection(contextSections[lastIndex].id);
    }
  }

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="맥락 섹션"
        onKeyDown={handleTablistKeyDown}
        className="flex w-full gap-2 rounded-md border border-line bg-panel p-1.5"
      >
        {contextSections.map((section) => {
          const isActive = section.id === activeSection;

          return (
            <button
              key={section.id}
              ref={(element) => {
                tabRefs.current[section.id] = element;
              }}
              type="button"
              role="tab"
              id={`context-tab-${section.id}`}
              aria-controls={`context-panel-${section.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              data-testid={`context-section-tab-${section.id}`}
              onClick={() => selectSection(section.id)}
              className={`min-h-10 flex-1 rounded-md border-b-2 px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-accent bg-panel-strong text-foreground"
                  : "border-transparent text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="context-panel-profile"
        aria-labelledby="context-tab-profile"
        tabIndex={0}
        data-testid="context-section-panel-profile"
        hidden={activeSection !== "profile"}
      >
        {activeSection === "profile" ? (
          <ProfileEditor returnTo={returnTo} />
        ) : null}
      </div>

      <div
        role="tabpanel"
        id="context-panel-company"
        aria-labelledby="context-tab-company"
        tabIndex={0}
        data-testid="context-section-panel-company"
        hidden={activeSection !== "company"}
      >
        {activeSection === "company" ? (
          <CompanyEditor returnTo={returnTo} />
        ) : null}
      </div>
    </div>
  );
}

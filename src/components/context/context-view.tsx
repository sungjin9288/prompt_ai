"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

  function selectSection(section: ContextSection) {
    setActiveSection(section);
    router.replace(`/context#${section}`, { scroll: false });
  }

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="맥락 섹션"
        className="flex w-full gap-2 rounded-md border border-line bg-panel p-1.5"
      >
        {contextSections.map((section) => {
          const isActive = section.id === activeSection;

          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`context-section-tab-${section.id}`}
              onClick={() => selectSection(section.id)}
              className={`min-h-10 flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-panel-strong text-foreground"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        data-testid="context-section-panel-profile"
        hidden={activeSection !== "profile"}
      >
        {activeSection === "profile" ? (
          <ProfileEditor returnTo={returnTo} />
        ) : null}
      </div>

      <div
        role="tabpanel"
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

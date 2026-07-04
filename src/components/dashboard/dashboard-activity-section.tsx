"use client";

import { useEffect, useRef } from "react";
import { ActivityView } from "@/components/activity/activity-view";

export function DashboardActivitySection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function focusIfActivityHash() {
      if (window.location.hash === "#activity") {
        sectionRef.current?.focus();
      }
    }

    focusIfActivityHash();
    window.addEventListener("hashchange", focusIfActivityHash);

    return () => {
      window.removeEventListener("hashchange", focusIfActivityHash);
    };
  }, []);

  return (
    <section
      id="activity"
      ref={sectionRef}
      tabIndex={-1}
      aria-label="최근 활동"
      className="mt-6 scroll-mt-24 outline-none"
      data-testid="dashboard-activity"
    >
      <ActivityView />
    </section>
  );
}

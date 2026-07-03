"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";
import { EmptyState } from "@/components/common/empty-state";
import {
  useLearningMemoriesStore,
  usePromptAssetsStore,
  usePromptSkillsStore,
} from "@/lib/data/workspace-store";
import {
  ACTIVITY_TYPE_FILTER_LABELS,
  ACTIVITY_TYPE_ORDER,
  buildActivityTimeline,
  countActivityEventsByType,
  filterActivityEvents,
  groupActivityEventsByDay,
  type ActivityEvent,
  type ActivityType,
  type ActivityTypeFilter,
} from "@/lib/activity/timeline";

const ACTIVITY_EVENT_LIMIT = 60;

const activityFilterOptions: ActivityTypeFilter[] = [
  "all",
  ...ACTIVITY_TYPE_ORDER,
];

function formatDayLabel(dayKey: string, todayKey: string, yesterdayKey: string) {
  if (dayKey === todayKey) {
    return "오늘";
  }

  if (dayKey === yesterdayKey) {
    return "어제";
  }

  if (dayKey === "unknown") {
    return "날짜 미상";
  }

  return new Date(dayKey).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatEventTime(timestamp: string) {
  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return "시간 미상";
  }

  return parsed.toLocaleString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shiftDayKey(dayKey: string, offsetDays: number) {
  const parsed = new Date(`${dayKey}T00:00:00.000Z`);

  parsed.setUTCDate(parsed.getUTCDate() + offsetDays);

  return parsed.toISOString().slice(0, 10);
}

function ActivityEventRow({ event }: { event: ActivityEvent }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <Link
        href={event.href}
        className="flex flex-col gap-1 px-5 py-4 transition hover:bg-surface sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium text-soft">
            {ACTIVITY_TYPE_FILTER_LABELS[event.type]}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {event.title}
            </p>
            {event.detail ? (
              <p className="mt-0.5 truncate text-xs text-muted">{event.detail}</p>
            ) : null}
          </div>
        </div>
        <time
          dateTime={event.timestamp}
          className="shrink-0 text-xs text-muted sm:pl-4"
        >
          {formatEventTime(event.timestamp)}
        </time>
      </Link>
    </li>
  );
}

function ActivityFilterRow({
  filter,
  counts,
  totalCount,
  onChange,
}: {
  filter: ActivityTypeFilter;
  counts: Record<ActivityType, number>;
  totalCount: number;
  onChange: (next: ActivityTypeFilter) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="활동 유형 필터"
      className="flex flex-wrap gap-2"
    >
      {activityFilterOptions.map((option) => {
        const isActive = option === filter;
        const count = option === "all" ? totalCount : counts[option];

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              isActive
                ? "border-accent bg-accent/10 font-semibold text-accent"
                : "border-line bg-surface font-medium text-soft hover:bg-panel-strong"
            }`}
          >
            {ACTIVITY_TYPE_FILTER_LABELS[option]} {count}
          </button>
        );
      })}
    </div>
  );
}

export function ActivityView() {
  const [prompts] = usePromptAssetsStore();
  const [skills] = usePromptSkillsStore();
  const [memories] = useLearningMemoriesStore();
  const [filter, setFilter] = useState<ActivityTypeFilter>("all");

  const events = buildActivityTimeline({ prompts, skills, memories });
  const counts = countActivityEventsByType(events);
  const filteredEvents = filterActivityEvents(events, filter);
  const isTruncated = filteredEvents.length > ACTIVITY_EVENT_LIMIT;
  const visibleEvents = filteredEvents.slice(0, ACTIVITY_EVENT_LIMIT);
  const groups = groupActivityEventsByDay(visibleEvents);

  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterdayKey = shiftDayKey(todayKey, -1);

  const isWorkspaceEmpty = events.length === 0;
  const hasNoEventsForFilter = !isWorkspaceEmpty && visibleEvents.length === 0;

  return (
    <div>
      <PageHeader
        title="최근 활동"
        description="생성, 개선, 스킬 실행, 피드백, 메모리 추가 이력을 최신순으로 확인합니다."
      />
      {isWorkspaceEmpty ? (
        <Panel>
          <EmptyState
            title="아직 활동이 없어요"
            description="Studio에서 프롬프트를 생성하면 활동 이력이 여기에 쌓입니다."
            action={{ label: "Studio 열기", href: "/studio" }}
          />
        </Panel>
      ) : (
        <div className="flex flex-col gap-6">
          <ActivityFilterRow
            filter={filter}
            counts={counts}
            totalCount={events.length}
            onChange={setFilter}
          />
          {hasNoEventsForFilter ? (
            <Panel>
              <p className="px-5 py-6 text-center text-sm text-muted">
                이 유형의 활동이 없어요
              </p>
            </Panel>
          ) : (
            <>
              {isTruncated ? (
                <p className="text-xs text-muted">
                  최근 {ACTIVITY_EVENT_LIMIT}개 표시
                </p>
              ) : null}
              {groups.map((group) => (
                <Panel key={group.dayKey}>
                  <div className="border-b border-line px-5 py-3">
                    <h2 className="text-sm font-semibold text-soft">
                      {formatDayLabel(group.dayKey, todayKey, yesterdayKey)}
                    </h2>
                  </div>
                  <ol className="divide-y divide-line">
                    {group.events.map((event) => (
                      <ActivityEventRow key={event.id} event={event} />
                    ))}
                  </ol>
                </Panel>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

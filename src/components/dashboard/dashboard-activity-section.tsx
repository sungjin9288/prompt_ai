import { ActivityView } from "@/components/activity/activity-view";

export function DashboardActivitySection() {
  return (
    <section
      id="activity"
      className="mt-6 scroll-mt-24"
      data-testid="dashboard-activity"
    >
      <ActivityView />
    </section>
  );
}

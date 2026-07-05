import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "대시보드",
};

export default function Home() {
  return <DashboardView />;
}

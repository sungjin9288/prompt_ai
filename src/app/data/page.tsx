import type { Metadata } from "next";
import { DataManagementView } from "@/components/data/data-management-view";

export const metadata: Metadata = {
  title: "데이터 관리",
};

export default function DataPage() {
  return <DataManagementView />;
}

import type { Metadata } from "next";
import { IntegrationsView } from "@/components/integrations/integrations-view";

export const metadata: Metadata = {
  title: "연동",
};

export default function IntegrationsPage() {
  return <IntegrationsView />;
}

import type { Metadata } from "next";
import { ContextView } from "@/components/context/context-view";
import { resolveContextSection } from "@/lib/context/section";

export const metadata: Metadata = {
  title: "컨텍스트",
};

export default async function ContextPage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string | string[];
    returnTo?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const section = Array.isArray(params.section)
    ? params.section[0]
    : params.section;
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;

  return (
    <ContextView
      initialSection={resolveContextSection(section)}
      returnTo={returnTo}
    />
  );
}

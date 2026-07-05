import type { Metadata } from "next";
import { ImproveView } from "@/components/improve/improve-view";
import { resolveImproveParams } from "@/lib/improve/params";

export const metadata: Metadata = {
  title: "빠른 개선",
};

export default async function ImprovePage({
  searchParams,
}: {
  searchParams: Promise<{
    draft?: string | string[];
    source?: string | string[];
    origin?: string | string[];
  }>;
}) {
  const params = resolveImproveParams(await searchParams);

  return (
    <ImproveView
      initialDraft={params.draft}
      source={params.source}
      origin={params.origin}
    />
  );
}

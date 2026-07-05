import type { Metadata } from "next";
import { StudioWorkspace } from "@/components/studio/studio-workspace";

export const metadata: Metadata = {
  title: "스튜디오",
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{
    companyUpdated?: string | string[];
    profileUpdated?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const companyUpdated = Array.isArray(params.companyUpdated)
    ? params.companyUpdated[0] === "1"
    : params.companyUpdated === "1";
  const profileUpdated = Array.isArray(params.profileUpdated)
    ? params.profileUpdated[0] === "1"
    : params.profileUpdated === "1";

  return (
    <StudioWorkspace
      companyUpdated={companyUpdated}
      profileUpdated={profileUpdated}
    />
  );
}

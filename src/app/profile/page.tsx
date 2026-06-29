import { ProfileEditor } from "@/components/profile/profile-editor";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;

  return <ProfileEditor returnTo={returnTo} />;
}

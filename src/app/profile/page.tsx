import { redirect } from "next/navigation";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;
  const query = new URLSearchParams({ section: "profile" });

  if (returnTo) {
    query.set("returnTo", returnTo);
  }

  redirect(`/context?${query.toString()}#profile`);
}

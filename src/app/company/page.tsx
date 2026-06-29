import { CompanyEditor } from "@/components/company/company-editor";

export default async function CompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;

  return <CompanyEditor returnTo={returnTo} />;
}

import { SkillsView } from "@/components/skills/skills-view";

interface SkillsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function normalizePromptId(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const promptId = candidate?.trim();

  return promptId ? promptId : undefined;
}

export default async function SkillsPage({ searchParams }: SkillsPageProps) {
  const params = await searchParams;
  const initialPromptId = normalizePromptId(params.prompt);
  const initialSkillId = normalizePromptId(params.skill);

  return (
    <SkillsView
      initialPromptId={initialPromptId}
      initialSkillId={initialSkillId}
    />
  );
}

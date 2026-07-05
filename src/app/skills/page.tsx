import type { Metadata } from "next";
import { SkillsView } from "@/components/skills/skills-view";

export const metadata: Metadata = {
  title: "스킬",
};

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

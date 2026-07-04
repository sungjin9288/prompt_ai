"use client";

import { useCallback } from "react";
import { announce } from "@/lib/browser/announcer";
import {
  useLearningMemoriesStore,
  usePromptAssetsStore,
  usePromptSkillsStore,
} from "@/lib/data/workspace-store";
import { mergeSampleWorkspace, sampleWorkspace } from "./sample-workspace";

/**
 * Seeds the curated sample prompts/skills/memories into the local stores so a
 * first-run user can immediately explore Library, version compare, learning,
 * and the dashboard. Safe to call repeatedly: `mergeSampleWorkspace` only
 * appends items whose id is not already present, so re-invoking after data
 * already exists is a no-op.
 */
export function useLoadSampleWorkspace() {
  const [, setPrompts] = usePromptAssetsStore();
  const [, setSkills] = usePromptSkillsStore();
  const [, setMemories] = useLearningMemoriesStore();

  return useCallback(() => {
    setPrompts((prev) => mergeSampleWorkspace(prev, sampleWorkspace.prompts));
    setSkills((prev) => mergeSampleWorkspace(prev, sampleWorkspace.skills));
    setMemories((prev) => mergeSampleWorkspace(prev, sampleWorkspace.memories));

    announce("샘플 데이터를 불러왔어요. 라이브러리에서 확인하세요.");
  }, [setMemories, setPrompts, setSkills]);
}

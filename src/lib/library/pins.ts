import type { PromptAsset } from "@/lib/prompt";

export function isPromptPinned(prompt: PromptAsset): boolean {
  return prompt.pinned === true;
}

export function setPromptPinned(
  prompts: PromptAsset[],
  id: string,
  pinned: boolean,
): PromptAsset[] {
  return prompts.map((prompt) => {
    if (prompt.id !== id) {
      return prompt;
    }

    if (!pinned) {
      const { pinned: _pinned, ...rest } = prompt;
      return rest;
    }

    return {
      ...prompt,
      pinned: true,
    };
  });
}

export function sortPinnedFirst(prompts: PromptAsset[]): PromptAsset[] {
  return prompts
    .map((prompt, index) => ({ prompt, index }))
    .sort((left, right) => {
      const leftPinned = isPromptPinned(left.prompt);
      const rightPinned = isPromptPinned(right.prompt);

      if (leftPinned === rightPinned) {
        return left.index - right.index;
      }

      return leftPinned ? -1 : 1;
    })
    .map((entry) => entry.prompt);
}

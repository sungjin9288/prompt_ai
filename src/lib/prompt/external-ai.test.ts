import { describe, expect, it } from "vitest";

import type { TargetModel } from "@/lib/prompt";
import {
  getExternalAiLabel,
  getExternalAiTarget,
} from "@/lib/prompt/external-ai";

const targetModels: TargetModel[] = [
  "general",
  "gpt",
  "codex",
  "claude",
  "gemini",
];

describe("getExternalAiTarget", () => {
  it("maps every target model to a valid https url and label", () => {
    for (const targetModel of targetModels) {
      const target = getExternalAiTarget(targetModel);

      expect(target.label.length).toBeGreaterThan(0);
      expect(target.url.startsWith("https://")).toBe(true);
    }
  });

  it("maps gpt to ChatGPT", () => {
    expect(getExternalAiTarget("gpt")).toEqual({
      label: "ChatGPT",
      url: "https://chatgpt.com/",
    });
  });

  it("maps codex to ChatGPT since Codex is hosted in ChatGPT", () => {
    expect(getExternalAiTarget("codex")).toEqual({
      label: "ChatGPT",
      url: "https://chatgpt.com/",
    });
  });

  it("maps general to ChatGPT", () => {
    expect(getExternalAiTarget("general")).toEqual({
      label: "ChatGPT",
      url: "https://chatgpt.com/",
    });
  });

  it("maps claude to Claude", () => {
    expect(getExternalAiTarget("claude")).toEqual({
      label: "Claude",
      url: "https://claude.ai/new",
    });
  });

  it("maps gemini to Gemini", () => {
    expect(getExternalAiTarget("gemini")).toEqual({
      label: "Gemini",
      url: "https://gemini.google.com/app",
    });
  });

  it("exposes the label alone through getExternalAiLabel", () => {
    expect(getExternalAiLabel("claude")).toBe("Claude");
  });
});

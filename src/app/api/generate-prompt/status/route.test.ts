import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/generate-prompt/status/route";

const ORIGINAL_OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ORIGINAL_OPENAI_MODEL = process.env.OPENAI_MODEL;

function restoreEnvVar(key: string, originalValue: string | undefined) {
  if (originalValue === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = originalValue;
  }
}

describe("GET /api/generate-prompt/status", () => {
  afterEach(() => {
    restoreEnvVar("OPENAI_API_KEY", ORIGINAL_OPENAI_API_KEY);
    restoreEnvVar("OPENAI_MODEL", ORIGINAL_OPENAI_MODEL);
  });

  describe("when OPENAI_API_KEY is not set", () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_MODEL;
    });

    it("reports local mode with configured=false and model=null", async () => {
      const response = await GET();
      const json = (await response.json()) as {
        configured: boolean;
        model: string | null;
        mode: string;
      };

      expect(response.status).toBe(200);
      expect(json.configured).toBe(false);
      expect(json.model).toBeNull();
      expect(json.mode).toBe("local");
    });
  });

  describe("when OPENAI_API_KEY is set", () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = "openai-key";
    });

    it("reports openai mode with configured=true and the default model", async () => {
      delete process.env.OPENAI_MODEL;

      const response = await GET();
      const json = (await response.json()) as {
        configured: boolean;
        model: string | null;
        mode: string;
      };

      expect(response.status).toBe(200);
      expect(json.configured).toBe(true);
      expect(json.model).toBe("gpt-5-mini");
      expect(json.mode).toBe("openai");
    });

    it("reports the configured OPENAI_MODEL when set", async () => {
      process.env.OPENAI_MODEL = "gpt-5";

      const response = await GET();
      const json = (await response.json()) as { model: string | null };

      expect(json.model).toBe("gpt-5");
    });

    it("never includes the raw OPENAI_API_KEY value in the response", async () => {
      const response = await GET();
      const rawText = await response.text();

      expect(rawText).not.toContain("openai-key");
    });
  });

  it("treats a blank OPENAI_API_KEY as not configured", async () => {
    process.env.OPENAI_API_KEY = "   ";

    const response = await GET();
    const json = (await response.json()) as { configured: boolean; mode: string };

    expect(json.configured).toBe(false);
    expect(json.mode).toBe("local");
  });
});

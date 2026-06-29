import { NextResponse } from "next/server";
import {
  createPromptPackage,
  defaultCompanyProfile,
  defaultUserProfile,
} from "@/lib/prompt";
import { enhancePromptWithOpenAI } from "@/lib/openai/prompt-optimizer";
import type {
  CompanyProfile,
  PromptRequestInput,
  UserProfile,
} from "@/lib/prompt/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      request?: PromptRequestInput;
      userProfile?: UserProfile;
      companyProfile?: CompanyProfile;
      priorFeedback?: string[];
    };

    if (!body.request?.rawInput?.trim()) {
      return NextResponse.json(
        { error: "rawInput is required" },
        { status: 400 },
      );
    }

    const localPrompt = createPromptPackage(
      body.request,
      body.userProfile ?? defaultUserProfile,
      body.companyProfile ?? defaultCompanyProfile,
      body.priorFeedback ?? [],
    );

    try {
      const result = await enhancePromptWithOpenAI(localPrompt);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({
        prompt: localPrompt,
        mode: "local",
        notice:
          error instanceof Error
            ? `OpenAI enhancement failed. Used local prompt builder. ${error.message}`
            : "OpenAI enhancement failed. Used local prompt builder.",
      });
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid prompt generation request" },
      { status: 400 },
    );
  }
}

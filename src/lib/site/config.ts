function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  return configured && configured.length > 0
    ? configured.replace(/\/+$/, "")
    : "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

export const siteName = "Prompt AI Studio";

export const siteDescription =
  "프롬프트를 전문가 수준으로 다듬는 로컬 우선 워크스페이스 — 별도 서버나 계정 없이 브라우저에서 바로 시작합니다.";

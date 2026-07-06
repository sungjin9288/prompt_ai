const selectionMenuId = "prompt-ai-studio-refine-selection";

// Reuse the SAME storage key popup.js writes so the in-page flow reads the
// operator's configured Studio URL. Do NOT invent a second key.
const studioUrlStorageKey = "prompt-ai-studio:url";
const defaultStudioUrl = "https://prompt-ai-studio.netlify.app";
const refineTimeoutMs = 15000;

// Identical body to isAllowedStudioUrl in popup.js. MV3 plain scripts can't
// import each other, so this is intentionally duplicated and pinned in verify.
function isAllowedStudioUrl(url) {
  const localHostnames = new Set(["localhost", "127.0.0.1"]);

  if (url.protocol === "https:") {
    return true;
  }

  return url.protocol === "http:" && localHostnames.has(url.hostname);
}

function normalizeStudioUrl(value) {
  try {
    const url = new URL(value || defaultStudioUrl);

    if (!isAllowedStudioUrl(url)) {
      return defaultStudioUrl;
    }

    url.pathname = "";
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return defaultStudioUrl;
  }
}

async function readStudioUrl() {
  const stored = await chrome.storage.local.get(studioUrlStorageKey);

  return normalizeStudioUrl(stored[studioUrlStorageKey]);
}

// Extract the final refined prompt from the refine API response. The response
// returns a review-required handoff package; the copy-ready prompt body is
// promptPackage.versions[0].content. Fall back to the full handoff text.
function extractImprovedPrompt(data) {
  const version = data?.promptPackage?.versions?.[0];

  if (version?.content && typeof version.content === "string") {
    return version.content;
  }

  const handoff = data?.handoffPackages?.[0]?.handoffText;

  return typeof handoff === "string" ? handoff : "";
}

async function refineDraft(draft, origin) {
  const studioUrl = await readStudioUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), refineTimeoutMs);

  try {
    const response = await fetch(`${studioUrl}/api/integrations/refine`, {
      body: JSON.stringify({
        rawInput: draft,
        sourceApp: origin === "chatgpt" ? "chatgpt" : origin,
        goal: "전문 프롬프트로 변환",
        domain: "범용",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data?.error || "Refine 요청이 실패했습니다." };
    }

    const improvedPrompt = extractImprovedPrompt(data);

    if (!improvedPrompt) {
      return { ok: false, error: "개선된 프롬프트를 찾을 수 없습니다." };
    }

    return { ok: true, improvedPrompt };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Studio 응답이 시간 초과되었습니다."
        : "Studio에 연결할 수 없습니다.";

    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "pas-refine") {
    refineDraft(message.draft || "", message.origin || "unknown")
      .then(sendResponse)
      .catch(() =>
        sendResponse({ ok: false, error: "Studio에 연결할 수 없습니다." }),
      );

    return true;
  }

  if (message?.type === "pas-studio-url") {
    readStudioUrl()
      .then((studioUrl) => sendResponse({ studioUrl }))
      .catch(() => sendResponse({ studioUrl: defaultStudioUrl }));

    return true;
  }

  return undefined;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    contexts: ["selection"],
    id: selectionMenuId,
    title: "Refine with Prompt AI Studio",
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== selectionMenuId) {
    return;
  }

  const selection = (info.selectionText || "").trim();

  if (!selection) {
    return;
  }

  await chrome.storage.session.set({
    pendingSelection: {
      selection,
      title: tab?.title || "",
      url: tab?.url || "",
      capturedAt: new Date().toISOString(),
      source: "context-menu",
    },
  });
  await chrome.action.setBadgeText({ text: "1" });
  await chrome.action.setBadgeBackgroundColor({ color: "#67d4c3" });
});

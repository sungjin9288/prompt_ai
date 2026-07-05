const defaultStudioUrl = "http://localhost:3000";
const defaultTargetAI = "codex";
const defaultDomain = "개발";
const defaultGoal = "전문 프롬프트로 변환";
const studioUrlStorageKey = "prompt-ai-studio:url";
const targetAIStorageKey = "prompt-ai-studio:target-ai";
const domainStorageKey = "prompt-ai-studio:domain";
const goalStorageKey = "prompt-ai-studio:goal";
const lastHandoffStorageKey = "prompt-ai-studio:last-handoff";

const studioUrl = document.getElementById("studioUrl");
const rawInput = document.getElementById("rawInput");
const targetAI = document.getElementById("targetAI");
const domain = document.getElementById("domain");
const goal = document.getElementById("goal");
const refineButton = document.getElementById("refineButton");
const copyButton = document.getElementById("copyButton");
const evidenceButton = document.getElementById("evidenceButton");
const clearButton = document.getElementById("clearButton");
const status = document.getElementById("status");
const runtimeEvidence = document.getElementById("runtimeEvidence");
const handoffText = document.getElementById("handoffText");
const resultMeta = document.getElementById("resultMeta");
const reviewGateMeta = document.getElementById("reviewGateMeta");
const targetMeta = document.getElementById("targetMeta");
const sourceMeta = document.getElementById("sourceMeta");
const sessionMeta = document.getElementById("sessionMeta");
const evidenceFallback = document.getElementById("evidenceFallback");
const evidenceText = document.getElementById("evidenceText");
let currentEvidencePacket = "";

function getChromeExtensionApi() {
  const api = globalThis.chrome;

  if (
    !api?.storage?.local ||
    !api.storage?.session ||
    !api.tabs ||
    !api.scripting ||
    !api.action
  ) {
    return null;
  }

  return api;
}

function setStatus(message, state = "idle") {
  status.textContent = message;
  status.dataset.state = state;
}

function setRuntimeEvidence(api = getChromeExtensionApi()) {
  runtimeEvidence.textContent = api
    ? "extension runtime connected · local http or any https Studio URL"
    : "preview only · Chrome runtime unavailable";
}

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

function normalizeTargetAI(value) {
  const allowedTargetAI = new Set(["auto", "gpt", "claude", "codex", "gemini"]);

  return allowedTargetAI.has(value) ? value : defaultTargetAI;
}

function normalizeTextSetting(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getRefineApiUrl() {
  return `${normalizeStudioUrl(studioUrl.value)}/api/integrations/refine`;
}

function buildHandoffMeta(handoffPackage) {
  return `${handoffPackage.modelLabel} · ${handoffPackage.qualityScore.toFixed(
    1,
  )}/5 · review required`;
}

function formatSavedAt(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

function formatSourceLabel(sourceUrl, sourceTitle) {
  try {
    const url = new URL(sourceUrl);
    return sourceTitle ? `${sourceTitle} (${url.hostname})` : url.hostname;
  } catch {
    return sourceTitle || "";
  }
}

function buildRestoredHandoffStatus(cached) {
  const details = [
    `target: ${cached.targetAI || cached.requestedTargetAI || "previous refine"}`,
    cached.savedAt ? `saved: ${formatSavedAt(cached.savedAt)}` : "",
    formatSourceLabel(cached.sourceUrl, cached.sourceTitle),
  ].filter(Boolean);

  return `Last handoff package restored${details.length ? ` · ${details.join(" · ")}` : ""}.`;
}

function setHandoffReviewSummary(summary = {}) {
  reviewGateMeta.textContent = summary.reviewGate || "Not generated";
  targetMeta.textContent = summary.target || "Waiting";
  sourceMeta.textContent = summary.source || "No source yet";
  sessionMeta.textContent = summary.session || "Not saved";
}

function setCurrentEvidencePacket(packet = "") {
  currentEvidencePacket = packet;
  evidenceText.value = packet;
  evidenceFallback.hidden = true;
  evidenceButton.disabled = !packet.trim();
}

function formatQualityScore(value) {
  return typeof value === "number" ? `${value.toFixed(1)}/5` : "not recorded";
}

function buildHandoffReviewSummary(handoffPackage, sourceContext, savedAt = "") {
  return {
    reviewGate: "reviewRequired",
    session: savedAt ? `Saved ${formatSavedAt(savedAt)}` : "Saved in session",
    source: formatSourceLabel(sourceContext.url, sourceContext.title) || "Chrome popup",
    target: handoffPackage.targetModel || targetAI.value || "auto",
  };
}

function buildChromeHandoffEvidencePacket(details) {
  return [
    "# Prompt AI Studio Chrome Handoff Evidence",
    "",
    "Surface: Chrome extension",
    "Gate: review-required handoff, operator-reviewed delivery, session trace.",
    "",
    `- Review gate: ${details.summary.reviewGate}`,
    `- Target AI: ${details.summary.target}`,
    `- Source: ${details.summary.source}`,
    `- Session: ${details.summary.session}`,
    `- Model label: ${details.modelLabel || "not recorded"}`,
    `- Quality score: ${formatQualityScore(details.qualityScore)}`,
    `- Domain: ${details.domainValue || "not recorded"}`,
    `- Goal: ${details.goalValue || "not recorded"}`,
    "",
    "Operator decision:",
    "- Copy only after review gate, target AI, source, and session state are checked.",
    "- Save execution feedback only after the external AI result is reviewed.",
  ].join("\n");
}

function buildRestoredHandoffReviewSummary(cached) {
  return {
    reviewGate: "reviewRequired",
    session: cached.savedAt
      ? `Saved ${formatSavedAt(cached.savedAt)}`
      : "Session restored",
    source: formatSourceLabel(cached.sourceUrl, cached.sourceTitle) || "Chrome popup",
    target: cached.targetAI || cached.requestedTargetAI || "previous refine",
  };
}

async function hydrateSettings() {
  const api = getChromeExtensionApi();

  if (!api) {
    return;
  }

  const stored = await api.storage.local.get([
    studioUrlStorageKey,
    targetAIStorageKey,
    domainStorageKey,
    goalStorageKey,
  ]);
  const normalizedUrl = normalizeStudioUrl(stored[studioUrlStorageKey]);
  const normalizedTargetAI = normalizeTargetAI(stored[targetAIStorageKey]);
  const normalizedDomain = normalizeTextSetting(
    stored[domainStorageKey],
    defaultDomain,
  );
  const normalizedGoal = normalizeTextSetting(stored[goalStorageKey], defaultGoal);

  studioUrl.value = normalizedUrl;
  targetAI.value = normalizedTargetAI;
  domain.value = normalizedDomain;
  goal.value = normalizedGoal;
}

async function savePopupSettings(statusMessage = "") {
  const normalizedUrl = normalizeStudioUrl(studioUrl.value);
  const normalizedTargetAI = normalizeTargetAI(targetAI.value);
  const normalizedDomain = normalizeTextSetting(domain.value, defaultDomain);
  const normalizedGoal = normalizeTextSetting(goal.value, defaultGoal);

  studioUrl.value = normalizedUrl;
  targetAI.value = normalizedTargetAI;
  domain.value = normalizedDomain;
  goal.value = normalizedGoal;

  const api = getChromeExtensionApi();

  if (!api) {
    if (statusMessage) {
      setStatus(
        "Chrome extension runtime is unavailable; settings were normalized for this preview only.",
      );
    }
    return;
  }

  await api.storage.local.set({
    [studioUrlStorageKey]: normalizedUrl,
    [targetAIStorageKey]: normalizedTargetAI,
    [domainStorageKey]: normalizedDomain,
    [goalStorageKey]: normalizedGoal,
  });

  if (statusMessage) {
    setStatus(statusMessage);
  }
}

async function hydrateLastHandoff() {
  const api = getChromeExtensionApi();

  if (!api) {
    return;
  }

  const stored = await api.storage.session.get(lastHandoffStorageKey);
  const cached = stored[lastHandoffStorageKey];

  if (!cached?.handoffText?.trim()) {
    return;
  }

  handoffText.value = cached.handoffText;
  resultMeta.textContent = cached.resultMeta || "Last handoff restored";
  copyButton.disabled = false;
  clearButton.disabled = false;
  const restoredSummary = buildRestoredHandoffReviewSummary(cached);
  setHandoffReviewSummary(restoredSummary);
  setCurrentEvidencePacket(
    buildChromeHandoffEvidencePacket({
      domainValue: cached.domain,
      goalValue: cached.goal,
      modelLabel: cached.modelLabel,
      qualityScore: cached.qualityScore,
      summary: restoredSummary,
    }),
  );
  setStatus(buildRestoredHandoffStatus(cached));
}

async function saveLastHandoffPackage(
  handoffPackage,
  metaText,
  sourceContext,
  savedAt = new Date().toISOString(),
) {
  const api = getChromeExtensionApi();

  if (!api) {
    return;
  }

  await api.storage.session.set({
    [lastHandoffStorageKey]: {
      domain: domain.value,
      handoffText: handoffPackage.handoffText,
      goal: goal.value,
      modelLabel: handoffPackage.modelLabel,
      qualityScore: handoffPackage.qualityScore,
      requestedTargetAI: targetAI.value,
      resultMeta: metaText,
      savedAt,
      source: "chrome-refine",
      sourceTitle: sourceContext.title,
      sourceUrl: sourceContext.url,
      targetAI: handoffPackage.targetModel || targetAI.value,
    },
  });
}

async function getActiveTab() {
  const api = getChromeExtensionApi();

  if (!api) {
    return null;
  }

  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getCurrentSelection() {
  const api = getChromeExtensionApi();
  const tab = await getActiveTab();

  if (!api || !tab?.id) {
    return { selection: "", title: "", url: "" };
  }

  try {
    const [{ result }] = await api.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        selection: window.getSelection()?.toString() || "",
        title: document.title,
        url: location.href,
      }),
    });

    return result || { selection: "", title: tab.title || "", url: tab.url || "" };
  } catch {
    return { selection: "", title: tab.title || "", url: tab.url || "" };
  }
}

async function getPendingSelection() {
  const api = getChromeExtensionApi();

  if (!api) {
    return null;
  }

  const { pendingSelection } = await api.storage.session.get("pendingSelection");

  if (!pendingSelection?.selection?.trim()) {
    return null;
  }

  await api.storage.session.remove("pendingSelection");
  await api.action.setBadgeText({ text: "" });

  return pendingSelection;
}

async function hydrateSelection() {
  try {
    const pending = await getPendingSelection();

    if (pending) {
      rawInput.value = pending.selection.trim();
      setStatus(
        "Context menu selection is ready for review-required refine.",
      );
      return;
    }

    const current = await getCurrentSelection();
    const selection = current.selection.trim();

    if (selection) {
      rawInput.value = selection;
      setStatus("Current page selection is ready for review-required refine.");
      return;
    }

    setStatus("No page selection found. You can paste or type source text.");
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Unable to read page selection.",
      "error",
    );
  }
}

async function refineSelection() {
  const text = rawInput.value.trim();

  if (!text) {
    setStatus("Source selection is required before refine.", "error");
    return;
  }

  refineButton.disabled = true;
  copyButton.disabled = true;
  evidenceButton.disabled = true;
  clearButton.disabled = true;
  setCurrentEvidencePacket();
  setStatus("Refining selected text...");

  try {
    await savePopupSettings();
    const current = await getCurrentSelection();
    const response = await fetch(getRefineApiUrl(), {
      body: JSON.stringify({
        domain: domain.value.trim() || "범용",
        goal: goal.value.trim() || "전문 프롬프트로 변환",
        rawInput: text,
        sourceApp: "chrome",
        sourceUrl: current.url,
        targetAI: targetAI.value,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Refine request failed.");
    }

    const firstPackage = data.handoffPackages?.[0];

    if (!firstPackage?.handoffText) {
      throw new Error("Refine response did not include a handoff package.");
    }

    const metaText = buildHandoffMeta(firstPackage);

    handoffText.value = firstPackage.handoffText;
    resultMeta.textContent = metaText;
    copyButton.disabled = false;
    clearButton.disabled = false;
    const savedAt = new Date().toISOString();
    await saveLastHandoffPackage(firstPackage, metaText, current, savedAt);
    const handoffSummary = buildHandoffReviewSummary(firstPackage, current, savedAt);
    setHandoffReviewSummary(handoffSummary);
    setCurrentEvidencePacket(
      buildChromeHandoffEvidencePacket({
        domainValue: domain.value,
        goalValue: goal.value,
        modelLabel: firstPackage.modelLabel,
        qualityScore: firstPackage.qualityScore,
        summary: handoffSummary,
      }),
    );
    setStatus("Review-required handoff package is ready.");
  } catch (error) {
    handoffText.value = "";
    resultMeta.textContent = "Not generated";
    copyButton.disabled = true;
    clearButton.disabled = true;
    setHandoffReviewSummary();
    setCurrentEvidencePacket();
    setStatus(error instanceof Error ? error.message : "Refine failed.", "error");
  } finally {
    refineButton.disabled = false;
  }
}

async function copyHandoff() {
  if (!handoffText.value.trim()) {
    return;
  }

  try {
    await navigator.clipboard.writeText(handoffText.value);
    setStatus("Handoff package copied.");
  } catch {
    handoffText.focus();
    handoffText.select();
    setStatus("Clipboard copy failed. Select the handoff text manually.", "error");
  }
}

async function copyEvidencePacket() {
  if (!currentEvidencePacket.trim()) {
    return;
  }

  try {
    await navigator.clipboard.writeText(currentEvidencePacket);
    evidenceFallback.hidden = true;
    setStatus("Chrome handoff evidence packet copied.");
  } catch {
    evidenceFallback.hidden = false;
    evidenceText.focus();
    evidenceText.select();
    setStatus(
      "Clipboard copy failed. Select the evidence packet manually.",
      "error",
    );
  }
}

async function clearLastHandoff() {
  const api = getChromeExtensionApi();

  if (api) {
    await api.storage.session.remove(lastHandoffStorageKey);
  }

  handoffText.value = "";
  resultMeta.textContent = "Not generated";
  copyButton.disabled = true;
  evidenceButton.disabled = true;
  clearButton.disabled = true;
  setHandoffReviewSummary();
  setCurrentEvidencePacket();
  setStatus("Last handoff package cleared.");
}

refineButton.addEventListener("click", refineSelection);
copyButton.addEventListener("click", copyHandoff);
evidenceButton.addEventListener("click", copyEvidencePacket);
clearButton.addEventListener("click", clearLastHandoff);
studioUrl.addEventListener("change", () =>
  savePopupSettings("Popup settings saved for local refine requests."),
);
targetAI.addEventListener("change", () =>
  savePopupSettings("Popup settings saved for local refine requests."),
);
domain.addEventListener("change", () =>
  savePopupSettings("Popup settings saved for local refine requests."),
);
goal.addEventListener("change", () =>
  savePopupSettings("Popup settings saved for local refine requests."),
);

async function initializePopup() {
  await hydrateSettings();
  setRuntimeEvidence();

  if (!getChromeExtensionApi()) {
    setStatus(
      "Load this folder as an unpacked Chrome extension to read page selections and restore handoff packages.",
    );
    return;
  }

  await hydrateSelection();
  await hydrateLastHandoff();
}

initializePopup();

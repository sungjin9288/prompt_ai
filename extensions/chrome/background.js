const selectionMenuId = "prompt-ai-studio-refine-selection";

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

// In-page improve content script.
//
// On chatgpt.com / claude.ai / gemini.google.com this mounts a floating "개선"
// button near the composer. Clicking it reads the draft, sends it through the
// background service worker to the app's refine API, and replaces the composer
// text with the improved prompt — with 되돌리기 (undo) and 복사 (copy) support.
//
// These sites are SPAs, so a debounced MutationObserver re-attaches the button
// as the composer appears / disappears / navigates. Everything is wrapped in
// try/catch so a failure here can never break the host page.
//
// Plain vanilla JS, no bundler. Depends on window.pasInpageAdapters (adapters.js).

(function () {
  "use strict";

  var ROOT_ID = "pas-inpage-root";
  var MOUNTED_ATTR = "data-pas-inpage-mounted";

  // Messaging seam: use the real chrome.runtime.sendMessage when loaded as an
  // extension; fall back to a test shim (window.__pasTestSendMessage) so the
  // adapter + UI logic can be driven on a fixture page without Chrome plumbing.
  function sendRefineMessage(message) {
    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      typeof chrome.runtime.sendMessage === "function"
    ) {
      return chrome.runtime.sendMessage(message);
    }

    if (typeof window.__pasTestSendMessage === "function") {
      return Promise.resolve(window.__pasTestSendMessage(message));
    }

    return Promise.reject(new Error("확장 런타임을 사용할 수 없습니다."));
  }

  // Studio URL for the "Studio에서 열기" link. The dedicated /improve page ships
  // in the next phase; for now this opens ${studioUrl}/studio. Keep the URL
  // construction in ONE helper so the next phase flips only this function.
  // The draft query param is omitted for now to avoid leaking long drafts into
  // a URL and to keep the link short; the next phase re-adds it against /improve.
  function buildStudioOpenUrl(studioUrl) {
    var base = (studioUrl || "http://localhost:3000").replace(/\/$/, "");
    return base + "/studio";
  }

  function getAdapter() {
    if (!window.pasInpageAdapters) {
      return null;
    }

    return window.pasInpageAdapters.selectAdapter(window.location.hostname);
  }

  function removeInpageRoot() {
    var existing = document.getElementById(ROOT_ID);

    if (existing) {
      existing.remove();
    }
  }

  function createActionButton(label, onClick) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "pas-inpage-action";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function mountButton(adapter) {
    // Guard against double-mounting.
    if (document.getElementById(ROOT_ID)) {
      return;
    }

    var root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "pas-inpage-root";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "pas-inpage-improve";
    button.setAttribute("data-testid", "pas-inpage-improve");
    button.setAttribute("aria-label", "Prompt AI Studio로 개선");
    button.title = "Prompt AI Studio로 개선";

    var dot = document.createElement("span");
    dot.className = "pas-inpage-dot";
    var labelText = document.createElement("span");
    labelText.className = "pas-inpage-label";
    labelText.textContent = "개선";
    button.appendChild(dot);
    button.appendChild(labelText);

    var hint = document.createElement("div");
    hint.className = "pas-inpage-hint";
    hint.hidden = true;

    var bar = document.createElement("div");
    bar.className = "pas-inpage-bar";
    bar.hidden = true;

    root.appendChild(button);
    root.appendChild(hint);
    root.appendChild(bar);
    document.body.appendChild(root);

    var state = { originalDraft: "", improvedPrompt: "" };

    function setLoading(isLoading) {
      button.disabled = isLoading;
      labelText.textContent = isLoading ? "개선 중…" : "개선";
    }

    function showHint(message) {
      bar.hidden = true;
      hint.textContent = message;
      hint.hidden = false;
    }

    function showErrorBar(message) {
      hint.hidden = true;
      bar.className = "pas-inpage-bar pas-inpage-bar-error";
      bar.textContent = "";
      var label = document.createElement("span");
      label.className = "pas-inpage-bar-label";
      label.textContent = message;
      bar.appendChild(label);
      bar.hidden = false;
    }

    function showResultBar() {
      hint.hidden = true;
      bar.className = "pas-inpage-bar";
      bar.textContent = "";

      var label = document.createElement("span");
      label.className = "pas-inpage-bar-label";
      label.textContent = "개선됨";
      bar.appendChild(label);

      var actions = document.createElement("div");
      actions.className = "pas-inpage-actions";

      actions.appendChild(
        createActionButton("되돌리기", function () {
          try {
            var composer = adapter.findComposer();

            if (composer) {
              adapter.setText(composer, state.originalDraft);
            }

            bar.hidden = true;
          } catch {
            showErrorBar("되돌리기에 실패했습니다.");
          }
        }),
      );

      actions.appendChild(
        createActionButton("복사", function () {
          copyImproved();
        }),
      );

      actions.appendChild(
        createActionButton("Studio에서 열기", function () {
          openInStudio();
        }),
      );

      bar.appendChild(actions);
      bar.hidden = false;
    }

    function copyImproved() {
      try {
        if (
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === "function"
        ) {
          navigator.clipboard.writeText(state.improvedPrompt).then(
            function () {},
            function () {
              showErrorBar("클립보드 복사에 실패했습니다. 직접 선택해 복사하세요.");
            },
          );
          return;
        }

        showErrorBar("클립보드를 사용할 수 없습니다. 직접 선택해 복사하세요.");
      } catch {
        showErrorBar("클립보드 복사에 실패했습니다. 직접 선택해 복사하세요.");
      }
    }

    function openInStudio() {
      try {
        sendRefineMessage({ type: "pas-studio-url" }).then(
          function (response) {
            var studioUrl = response && response.studioUrl;
            window.open(buildStudioOpenUrl(studioUrl), "_blank", "noopener");
          },
          function () {
            window.open(buildStudioOpenUrl(), "_blank", "noopener");
          },
        );
      } catch {
        window.open(buildStudioOpenUrl(), "_blank", "noopener");
      }
    }

    async function onImproveClick() {
      try {
        var composer = adapter.findComposer();

        if (!composer) {
          showHint("입력한 초안이 없습니다");
          return;
        }

        var draft = (adapter.getText(composer) || "").trim();

        if (!draft) {
          showHint("입력한 초안이 없습니다");
          return;
        }

        hint.hidden = true;
        bar.hidden = true;
        setLoading(true);

        var response;

        try {
          response = await sendRefineMessage({
            type: "pas-refine",
            draft: draft,
            origin: adapter.id,
          });
        } catch {
          setLoading(false);
          showErrorBar(
            "Studio에 연결할 수 없습니다. 확장 팝업에서 Studio URL을 확인하세요.",
          );
          return;
        }

        setLoading(false);

        if (!response || !response.ok || !response.improvedPrompt) {
          showErrorBar(
            "Studio에 연결할 수 없습니다. 확장 팝업에서 Studio URL을 확인하세요.",
          );
          return;
        }

        state.originalDraft = draft;
        state.improvedPrompt = response.improvedPrompt;

        var target = adapter.findComposer();

        if (target) {
          adapter.setText(target, response.improvedPrompt);
        }

        showResultBar();
      } catch {
        // Never break the host page.
        setLoading(false);
        showErrorBar(
          "Studio에 연결할 수 없습니다. 확장 팝업에서 Studio URL을 확인하세요.",
        );
      }
    }

    button.addEventListener("click", onImproveClick);
    document.body.setAttribute(MOUNTED_ATTR, adapter.id);
  }

  function syncButton(adapter) {
    try {
      var composer = adapter.findComposer();

      if (composer) {
        mountButton(adapter);
        return;
      }

      removeInpageRoot();
      document.body.removeAttribute(MOUNTED_ATTR);
    } catch {
      // Fail silently — a broken selector must not break the page.
    }
  }

  function debounce(fn, delay) {
    var timer = null;

    return function () {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(fn, delay);
    };
  }

  function start() {
    var adapter = getAdapter();

    if (!adapter) {
      // Unknown host — exit without mounting anything.
      return;
    }

    syncButton(adapter);

    var debouncedSync = debounce(function () {
      syncButton(adapter);
    }, 300);

    try {
      var observer = new MutationObserver(debouncedSync);
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    } catch {
      // If observing fails we still have the initial mount.
    }
  }

  // Expose a manual start hook so tests can drive mounting deterministically.
  window.pasInpageStart = start;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

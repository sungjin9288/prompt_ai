// Site adapters for the in-page "개선" (improve) button.
//
// DOM on chatgpt.com / claude.ai / gemini.google.com is third-party and shifts
// over time, so every adapter uses a fallback chain and must fail SILENTLY
// (return null) when nothing matches — the caller then mounts no button.
//
// Contract per adapter:
//   { id, matches(hostname), findComposer(), getText(el), setText(el, text) }
//
// Plain vanilla JS, no modules — this file is injected before inpage.js and
// exposes window.pasInpageAdapters.

(function () {
  "use strict";

  function isTextarea(element) {
    return Boolean(element) && element.tagName === "TEXTAREA";
  }

  function readContentEditableText(element) {
    return (element.innerText || "").trim();
  }

  // Contenteditable insert that preserves the site's undo stack and fires the
  // input events React / ProseMirror / Quill listen to for state sync.
  function setContentEditableText(element, text) {
    try {
      element.focus();
      document.execCommand("selectAll", false, undefined);
      const inserted = document.execCommand("insertText", false, text);

      if (inserted) {
        return;
      }
    } catch {
      // execCommand can throw in locked-down documents; fall through.
    }

    element.textContent = text;
    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: text,
      }),
    );
  }

  // React-controlled textareas ignore a plain `.value =`, so go through the
  // native value setter and then dispatch a bubbling input event.
  function setTextareaValue(element, text) {
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    );

    if (descriptor && typeof descriptor.set === "function") {
      descriptor.set.call(element, text);
    } else {
      element.value = text;
    }

    element.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }

  function getText(element) {
    if (isTextarea(element)) {
      return element.value;
    }

    return readContentEditableText(element);
  }

  function setText(element, text) {
    if (isTextarea(element)) {
      setTextareaValue(element, text);
      return;
    }

    setContentEditableText(element, text);
  }

  function firstMatch(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);

      if (element) {
        return element;
      }
    }

    return null;
  }

  const chatgptAdapter = {
    id: "chatgpt",
    matches(hostname) {
      return hostname === "chatgpt.com" || hostname === "chat.openai.com";
    },
    findComposer() {
      // Primary: #prompt-textarea. Current builds render it as a ProseMirror
      // contenteditable div; older builds used a real <textarea>. Both work
      // because getText/setText branch on tagName.
      return firstMatch([
        "#prompt-textarea",
        'form div[contenteditable="true"]',
        "form textarea",
      ]);
    },
    getText,
    setText,
  };

  const claudeAdapter = {
    id: "claude",
    matches(hostname) {
      return hostname === "claude.ai";
    },
    findComposer() {
      const primary = document.querySelector(
        'div[contenteditable="true"].ProseMirror',
      );

      if (primary) {
        return primary;
      }

      // Fallback: a contenteditable inside the main composer form/fieldset.
      const scoped = document.querySelector(
        'form div[contenteditable="true"], fieldset div[contenteditable="true"]',
      );

      if (scoped) {
        return scoped;
      }

      return document.querySelector('div[contenteditable="true"]');
    },
    getText,
    setText,
  };

  const geminiAdapter = {
    id: "gemini",
    matches(hostname) {
      return hostname === "gemini.google.com";
    },
    findComposer() {
      // Primary: the Quill editor surface inside <rich-textarea>.
      return firstMatch([
        "rich-textarea .ql-editor",
        'div[contenteditable="true"]',
      ]);
    },
    getText,
    setText,
  };

  const adapters = [chatgptAdapter, claudeAdapter, geminiAdapter];

  function selectAdapter(hostname) {
    return adapters.find((adapter) => adapter.matches(hostname)) || null;
  }

  window.pasInpageAdapters = {
    adapters,
    selectAdapter,
  };
})();

# Chrome Web Store Listing Copy (English)

Field-by-field copy for the Chrome Web Store developer dashboard "Store
listing" tab, in the secondary locale (English). Character limits from the
actual form are noted per field. The production URL is
`https://prompt-ai-studio.netlify.app`.

## Name (limit: 45 characters)

```
Prompt AI Studio Refine
```

- Length: 23 characters (within limit).
- Must exactly match `"name"` in `extensions/chrome/manifest.json`. It
  already does — no change needed.

## Short description (limit: 132 characters)

```
Improve prompts in-place on ChatGPT, Claude, and Gemini. Free, local-first, no account required.
```

- Length: 98 characters (within limit).

## Detailed description (limit: 16,000 characters)

```
Prompt AI Studio Refine adds an "Improve" button next to the composer on
ChatGPT, Claude, and Gemini, so you can turn the draft you are already typing
into a clearer, more professional prompt without leaving the page.

■ What it does
- Shows an "Improve" button next to the composer on ChatGPT
  (chatgpt.com, chat.openai.com), Claude (claude.ai), and Gemini
  (gemini.google.com).
- Clicking it reads your current draft, sends it to the Studio server you
  configure, and replaces the composer text with the improved prompt.
- If you don't like the result, "Undo" restores your original draft.
- "Copy" copies the improved prompt to your clipboard, or "Open in Studio"
  opens a focused Prompt AI Studio /improve page in a new tab with the
  improved prompt already filled in, so you can keep refining it.
- The extension popup also offers a separate flow: select any text on a page,
  right-click "Refine with Prompt AI Studio," and get a review-required
  handoff package.

■ What it does NOT do
- No account or sign-in required.
- No visitor tracking, no advertising cookies, no behavioral analytics
  scripts.
- It never reads or transmits page content other than the draft you
  explicitly submit by clicking Improve.
- Submitted drafts are not stored on any server — they are used only to
  compute the improvement result and are not persisted afterward.
- No feature is paywalled. Every feature in this extension is free. (A Pro
  tier is in development but does not gate any current extension feature.)

■ Setup
1. Install the extension from the Chrome Web Store.
2. Click the extension icon to open the popup.
3. Enter the Prompt AI Studio server address in the "Studio URL" field (for
   example, the operator's deployed production URL, or a local dev server at
   `http://localhost:3000`).
4. Visit ChatGPT, Claude, or Gemini and look for the "Improve" (개선) button
   next to the composer.
5. Type a draft and click Improve to see the result.

■ Supported sites
- ChatGPT: chatgpt.com, chat.openai.com
- Claude: claude.ai
- Gemini: gemini.google.com

■ Permissions summary
Every permission this extension requests, and exactly what it is used for, is
listed in the "Permission justification" section below and kept current at
`https://prompt-ai-studio.netlify.app/privacy`. The extension does not use any
permission beyond its stated purpose.

■ Support
For install help, setup questions, or bug reports, see the `/welcome` page in
the app or the support email listed in the privacy policy.
```

## Category

- Recommended: **Productivity** (or **Tools**, depending on the current
  Chrome Web Store taxonomy at submission time). Choose Productivity first.

## Language

- Primary: Korean (see `listing.ko.md`)
- Secondary: **English** (this document, registered as a separate locale)

## Privacy policy URL

```
https://prompt-ai-studio.netlify.app/privacy
```

## Website

```
https://prompt-ai-studio.netlify.app/welcome
```

## Single purpose description

Chrome Web Store policy requires a single clear purpose statement. Use this
paragraph verbatim in the review form's "Single purpose" field.

```
The sole purpose of this extension is to improve a prompt draft the user is
writing in the ChatGPT, Claude, or Gemini composer — by sending it to a
Prompt AI Studio server the user configures — and to replace the composer
text with the improved result. It does not collect unrelated browsing data,
serve ads, run analytics, or perform any unrelated automation.
```

## Permissions justification

The Chrome Web Store review form requires a justification for each sensitive
permission, including `host_permissions`. This list matches every permission
declared in `extensions/chrome/manifest.json`.

### activeTab

```
Needed to read the user's selected text only in the active tab at the moment
the user opens the extension popup or invokes the "Refine with Prompt AI
Studio" context menu item. No tab content is read without this explicit user
action.
```

### storage

```
Needed to store the extension's own settings locally in the browser — the
configured Studio server URL, the last handoff result, and session state.
This data never leaves the user's browser and is not synced to any remote
server.
```

### contextMenus

```
Needed to add a single right-click menu item, "Refine with Prompt AI Studio,"
so selected text can be improved immediately. No other context menu behavior
is added or modified.
```

### scripting

```
Needed to detect the composer element on ChatGPT, Claude, and Gemini pages
and inject the "Improve" button and result UI next to it. No script is
injected on any site other than the three declared in content_scripts.
```

### host_permissions — https://*/*

```
Prompt AI Studio is a local-first tool where the user points the extension at
their own server (a self-hosted deployment or this project's production
deployment), so the https origin cannot be known in advance. This permission
is used only to send the improve request (POST /api/integrations/refine) to
the Studio URL the user explicitly enters in the extension popup — no request
is ever sent to any origin the user has not configured. http://localhost/*
and http://127.0.0.1/* are declared separately for local development
servers.
```

### content script hosts — chatgpt.com, chat.openai.com, claude.ai, gemini.google.com

```
Needed to detect the composer DOM and mount the in-page "Improve" button on
the three supported AI chat services. No content script is injected on any
site outside these four hosts.
```

## Data use disclosure mapping (reference)

Factual mapping to use when filling out the "Privacy practices" tab checklist
in `SUBMISSION.md`. See `https://prompt-ai-studio.netlify.app/privacy` for the
full policy.

| Item | Basis for answer |
|---|---|
| Collects personally identifiable information | No — no account or sign-in |
| Collects user activity (browsing history, etc.) | No |
| Collects location | No |
| Collects website content | Only the composer draft the user explicitly submits via Improve, sent to the user-configured server — never sold, never used for advertising or unrelated purposes |
| Sells user data | No |
| Uses data for undisclosed purposes | No — drafts are used only to compute the improvement result and are not persisted server-side afterward |

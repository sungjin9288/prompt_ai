const internalHrefOrigin = "http://prompt-ai-studio.local";

export function normalizeInternalHref(value: unknown) {
  const rawHref = typeof value === "string" ? value.trim() : "";

  if (!rawHref) {
    return undefined;
  }

  try {
    const url = new URL(rawHref, internalHrefOrigin);

    if (url.origin !== internalHrefOrigin || !url.pathname.startsWith("/")) {
      return undefined;
    }

    const href = `${url.pathname}${url.search}${url.hash}`;

    return href.startsWith("//") ? undefined : href;
  } catch {
    return undefined;
  }
}

export function formatAbsoluteInternalHref(value: unknown, origin?: string) {
  const href = normalizeInternalHref(value);

  if (!href) {
    return undefined;
  }

  if (!origin) {
    return href;
  }

  try {
    return new URL(href, origin).toString();
  } catch {
    return href;
  }
}

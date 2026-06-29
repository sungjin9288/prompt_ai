export function normalizeInternalHref(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  try {
    const base = "http://prompt-ai-studio.local";
    const url = new URL(value, base);

    if (url.origin !== base || !url.pathname.startsWith("/")) {
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

import { announce } from "@/lib/browser/announcer";

const clipboardWriteTimeoutMs = 800;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Clipboard write timed out."));
      }, timeoutMs);
    }),
  ]);
}

async function writeToClipboard(text: string) {
  if (typeof document === "undefined") {
    return false;
  }

  try {
    await withTimeout(
      navigator.clipboard.writeText(text),
      clipboardWriteTimeoutMs,
    );
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export async function copyTextToClipboard(text: string) {
  const copied = await writeToClipboard(text);

  if (copied) {
    announce("클립보드에 복사했습니다.");
  }

  return copied;
}

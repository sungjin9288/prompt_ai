type AnnounceListener = (message: string) => void;

let listener: AnnounceListener | null = null;

export function setAnnounceListener(next: AnnounceListener | null) {
  listener = next;
}

export function announce(message: string) {
  listener?.(message);
}

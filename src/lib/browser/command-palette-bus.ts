type OpenListener = () => void;

let listener: OpenListener | null = null;

export function setCommandPaletteOpenListener(next: OpenListener | null) {
  listener = next;
}

export function openCommandPalette() {
  listener?.();
}

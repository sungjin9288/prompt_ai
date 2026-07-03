type OpenListener = () => void;

let listener: OpenListener | null = null;

export function setKeyboardHelpOpenListener(next: OpenListener | null) {
  listener = next;
}

export function openKeyboardHelp() {
  listener?.();
}

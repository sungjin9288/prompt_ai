export interface GoToShortcut {
  key: string;
  href: string;
  label: string;
}

export const goToShortcuts: GoToShortcut[] = [
  { key: "h", href: "/", label: "홈" },
  { key: "w", href: "/studio", label: "작성" },
  { key: "l", href: "/library", label: "라이브러리" },
  { key: "m", href: "/learning", label: "학습" },
  { key: "k", href: "/skills", label: "스킬" },
  { key: "a", href: "/#activity", label: "활동" },
  { key: "i", href: "/integrations", label: "연결" },
  { key: "x", href: "/context", label: "맥락" },
  { key: "d", href: "/data", label: "데이터" },
];

export function findGoToShortcut(key: string): GoToShortcut | undefined {
  const normalizedKey = key.toLowerCase();

  return goToShortcuts.find((shortcut) => shortcut.key === normalizedKey);
}

export function formatGoToDescription(label: string): string {
  const lastChar = label.charCodeAt(label.length - 1);
  const isHangulSyllable = lastChar >= 0xac00 && lastChar <= 0xd7a3;
  const finalConsonant = isHangulSyllable ? (lastChar - 0xac00) % 28 : 0;
  const needsEuro = finalConsonant !== 0 && finalConsonant !== 8;

  return `${label}${needsEuro ? "으로" : "로"} 이동`;
}

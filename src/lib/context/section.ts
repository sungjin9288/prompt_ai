export type ContextSection = "profile" | "company";

export function resolveContextSection(
  value: string | undefined,
): ContextSection {
  return value === "company" ? "company" : "profile";
}

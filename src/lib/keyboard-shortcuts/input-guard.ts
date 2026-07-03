const EDITABLE_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT"]);

interface EditableTargetShape {
  tagName: string;
  isContentEditable: boolean;
}

function isEditableTargetShape(
  target: EventTarget | null,
): target is EditableTargetShape & EventTarget {
  const candidate = target as Partial<EditableTargetShape> | null;

  return (
    !!candidate &&
    typeof candidate.tagName === "string" &&
    typeof candidate.isContentEditable === "boolean"
  );
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!isEditableTargetShape(target)) {
    return false;
  }

  if (EDITABLE_TAG_NAMES.has(target.tagName)) {
    return true;
  }

  return target.isContentEditable;
}

export function hasBlockingModifier(event: {
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

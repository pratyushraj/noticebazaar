export function safeRemoveChild(parent: Node | null | undefined, child: Node | null | undefined) {
  if (!parent || !child) return;
  try {
    if (child.parentNode === parent) {
      parent.removeChild(child);
    }
  } catch {
    // Ignore stale DOM removal races during rapid unmounts.
  }
}

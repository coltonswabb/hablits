// ============================================
// REORDER HELPERS
// ============================================
// Pure list maths for drag-to-reorder, kept apart from the component so it
// can be tested without rendering anything.
// ============================================

/** A copy of `list` with the item at `from` moved to `to`. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  if (from === to || from < 0 || from >= next.length) return next;
  const clamped = Math.max(0, Math.min(next.length - 1, to));
  const [moved] = next.splice(from, 1);
  next.splice(clamped, 0, moved);
  return next;
}

/**
 * Applies a new order for the rows on screen to the full list. Only the
 * visible items trade places with each other; items that are not on screen
 * (a habit not scheduled today, say) keep their slots.
 */
export function applyVisibleOrder<T extends { id: string }>(all: T[], visibleIdsInNewOrder: string[]): T[] {
  const visible = new Set(visibleIdsInNewOrder);
  const byId = new Map(all.map((item) => [item.id, item]));
  const queue = visibleIdsInNewOrder.filter((id) => byId.has(id));
  let next = 0;
  return all.map((item) => (visible.has(item.id) ? (byId.get(queue[next++]) as T) : item));
}

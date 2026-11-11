// ============================================
// AUTO-SCROLL WHILE DRAGGING
// ============================================
// When a dragged item is held near the top or bottom edge of a scrolling
// area, the area should scroll so the item can reach places that are off
// screen. This works out how fast, and in which direction.
// ============================================

/** How close to an edge, in points, the finger must be for scrolling to start */
export const AUTO_SCROLL_EDGE = 56;
/** Fastest scroll, in points per frame, reached right at the edge */
export const AUTO_SCROLL_MAX_SPEED = 14;

/**
 * Points to scroll this frame for a finger at `fingerY`, inside a viewport that
 * spans `top` to `bottom` (all in the same coordinates). Negative scrolls up,
 * positive down, 0 means leave it. The closer to the edge, the faster.
 */
export function autoScrollSpeed(fingerY: number, top: number, bottom: number): number {
  if (bottom - top < AUTO_SCROLL_EDGE * 2) return 0;
  const intoTop = top + AUTO_SCROLL_EDGE - fingerY;
  if (intoTop > 0) return -Math.ceil(Math.min(1, intoTop / AUTO_SCROLL_EDGE) * AUTO_SCROLL_MAX_SPEED);
  const intoBottom = fingerY - (bottom - AUTO_SCROLL_EDGE);
  if (intoBottom > 0) return Math.ceil(Math.min(1, intoBottom / AUTO_SCROLL_EDGE) * AUTO_SCROLL_MAX_SPEED);
  return 0;
}

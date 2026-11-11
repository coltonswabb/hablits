// ============================================
// SWIPE RULES
// ============================================
// Decides what a released habit-card swipe does. Kept apart from the
// component so it can be tested without rendering anything.
// ============================================

/** How far a card must be dragged for the swipe to count: a quarter of the screen. */
const SWIPE_FRACTION = 0.25;
/** Never less than this, so the rule still works if the screen width is not known yet */
const MIN_SWIPE_THRESHOLD = 60;
/** A flick, in points per second (gesture-handler's unit) */
export const VELOCITY_THRESHOLD = 500;

/** The drag distance, in points, at which a swipe counts on a screen this wide. */
export function swipeThreshold(screenWidth: number): number {
  return Math.max(MIN_SWIPE_THRESHOLD, screenWidth * SWIPE_FRACTION);
}

/**
 * Which way a released swipe commits: 1 (right), -1 (left) or 0 (snap back).
 * A flick commits in the direction the card has already travelled; a slow drag
 * commits past the distance threshold unless it is being flicked back.
 */
export function swipeDirection(swipeDistance: number, velocityX: number, threshold: number): 1 | -1 | 0 {
  const side = swipeDistance > 0 ? 1 : swipeDistance < 0 ? -1 : 0;
  if (side === 0) return 0;
  const speedAlongSwipe = velocityX * side;
  if (speedAlongSwipe > VELOCITY_THRESHOLD) return side;
  if (Math.abs(swipeDistance) > threshold && speedAlongSwipe > -VELOCITY_THRESHOLD) return side;
  return 0;
}

// ============================================
// SWIPE RULES
// ============================================
// Decides what a released habit-card swipe does. Kept apart from the
// component so it can be tested without rendering anything.
// ============================================

import { Dimensions } from 'react-native';

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.15; // 15% of screen width for easy triggering
/** A flick, in points per second (gesture-handler's unit) */
export const VELOCITY_THRESHOLD = 500;

/**
 * Which way a released swipe commits: 1 (right), -1 (left) or 0 (snap back).
 * A flick commits in the direction the card has already travelled; a slow drag
 * commits past the distance threshold unless it is being flicked back.
 */
export function swipeDirection(swipeDistance: number, velocityX: number): 1 | -1 | 0 {
  const side = swipeDistance > 0 ? 1 : swipeDistance < 0 ? -1 : 0;
  if (side === 0) return 0;
  const speedAlongSwipe = velocityX * side;
  if (speedAlongSwipe > VELOCITY_THRESHOLD) return side;
  if (Math.abs(swipeDistance) > SWIPE_THRESHOLD && speedAlongSwipe > -VELOCITY_THRESHOLD) return side;
  return 0;
}

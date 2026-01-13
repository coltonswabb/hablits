// ============================================
// FASTING UTILITIES - SECRET FEATURE
// ============================================
// Helper functions for the hidden fasting timer feature
// ============================================

import { ActiveFast } from '../types';

/**
 * Check if a habit is a fasting habit (name contains "fast")
 */
export function isFastingHabit(habitName: string): boolean {
  return habitName.toLowerCase().includes('fast');
}

/**
 * Calculate remaining time for an active fast
 * Returns milliseconds remaining (or 0 if complete)
 */
export function getRemainingTime(fast: ActiveFast): number {
  const now = Date.now();
  const target = new Date(fast.targetTime).getTime();
  const remaining = target - now;
  return Math.max(0, remaining);
}

/**
 * Check if a fast is complete
 */
export function isFastComplete(fast: ActiveFast): boolean {
  return getRemainingTime(fast) === 0;
}

/**
 * Format remaining time as human-readable string
 * Examples: "12h 30m 45s", "45m 30s", "2m 15s"
 */
export function formatRemainingTime(milliseconds: number): string {
  if (milliseconds === 0) return 'Complete!';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Get progress percentage for a fast (0-100)
 */
export function getFastProgress(fast: ActiveFast): number {
  const start = new Date(fast.startTime).getTime();
  const target = new Date(fast.targetTime).getTime();
  const now = Date.now();

  const totalDuration = target - start;
  const elapsed = now - start;

  const progress = (elapsed / totalDuration) * 100;
  return Math.min(100, Math.max(0, progress));
}

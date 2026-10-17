// ============================================
// PET EVOLUTION
// ============================================
// The pet's mood resets every day; its STAGE never does. Stage is earned
// by the longest streak any habit has ever reached, so a broken streak
// never demotes the pet — the history is the proof.
//
//   stage 0  Hatchling   < 7-day streak
//   stage 1  Companion   7+
//   stage 2  Veteran     30+
//   stage 3  Legend      100+
// ============================================

import { Habit } from '../types';
import { dateStr } from './dates';
import { isHabitActiveOn } from './habits';

export const STAGE_THRESHOLDS = [7, 30, 100] as const;
export const STAGE_NAMES = ['Hatchling', 'Companion', 'Veteran', 'Legend'] as const;
export type PetStage = 0 | 1 | 2 | 3;

const MAX_CONSECUTIVE_MISSES = 1; // same streak-freeze rule as calculateStreak

/**
 * Longest streak a habit has EVER had, using the same rules as the live
 * streak: unscheduled days are neutral, one miss in a row is forgiven.
 */
export function longestStreakEver(
  logs: Record<string, string[]>,
  habitId: string,
  habit?: Habit,
  referenceDate: Date = new Date()
): number {
  const days = Object.keys(logs)
    .filter((d) => (logs[d] || []).includes(habitId))
    .sort();
  if (days.length === 0) return 0;

  const start = new Date(days[0] + 'T12:00:00');
  const end = new Date(referenceDate);
  end.setHours(12, 0, 0, 0);
  const today = dateStr(referenceDate);

  let best = 0;
  let current = 0;
  let misses = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (habit && !isHabitActiveOn(habit, d)) continue;
    const ds = dateStr(d);
    const done = (logs[ds] || []).includes(habitId);

    if (done) {
      current++;
      misses = 0;
      if (current > best) best = current;
    } else if (ds === today) {
      continue; // today isn't over
    } else {
      misses++;
      if (misses > MAX_CONSECUTIVE_MISSES) {
        current = 0;
        misses = 0;
      }
    }
  }
  return best;
}

/** The best streak ever reached by any habit. */
export function bestStreakEver(habits: Habit[], logs: Record<string, string[]>, referenceDate: Date = new Date()): number {
  return habits.reduce((best, h) => Math.max(best, longestStreakEver(logs, h.id, h, referenceDate)), 0);
}

export function stageForStreak(streak: number): PetStage {
  let stage = 0;
  for (const t of STAGE_THRESHOLDS) if (streak >= t) stage++;
  return stage as PetStage;
}

export function getPetStage(habits: Habit[], logs: Record<string, string[]>, referenceDate: Date = new Date()): PetStage {
  return stageForStreak(bestStreakEver(habits, logs, referenceDate));
}

/** Days of streak still needed for the next stage, or null at max stage. */
export function daysToNextStage(bestStreak: number): { needed: number; nextStage: PetStage } | null {
  const stage = stageForStreak(bestStreak);
  const threshold: number | undefined = (STAGE_THRESHOLDS as readonly number[])[stage];
  if (threshold === undefined) return null;
  return { needed: threshold - bestStreak, nextStage: (stage + 1) as PetStage };
}

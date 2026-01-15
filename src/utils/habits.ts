// ============================================
// HABIT UTILITIES
// ============================================
// Functions for working with habits, logs,
// streaks, and progress calculations.
// ============================================

import { Habit, AppState } from '../types';
import { dateStr, startOfWeek } from './dates';

/**
 * Check if a habit is active on a specific day of the week
 * @param habit - The habit to check
 * @param date - The date to check
 * @returns true if habit is active on that day
 */
export function isHabitActiveOn(habit: Habit, date: Date): boolean {
  if (!habit.days || !Array.isArray(habit.days)) {
    return true; // If no days specified, active every day
  }
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  return habit.days[dayOfWeek];
}

/**
 * Sort habits by their order property
 */
export function sortByOrder(habits: Habit[]): Habit[] {
  return [...habits].sort((a, b) => {
    const orderDiff = (a.order || 999) - (b.order || 999);
    if (orderDiff !== 0) return orderDiff;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get habits active for a specific date, optionally filtered by identity
 */
export function getActiveHabits(
  habits: Habit[],
  date: Date,
  identityFilter: string = 'all'
): Habit[] {
  let filtered = habits;

  // Filter by identity if not 'all'
  if (identityFilter !== 'all') {
    filtered = habits.filter((h) => h.identityId === identityFilter);
  }

  // Filter by active day
  filtered = filtered.filter((h) => isHabitActiveOn(h, date));

  return sortByOrder(filtered);
}

/**
 * Count how many times a habit was completed this week
 */
export function countThisWeek(
  logs: Record<string, string[]>,
  habitId: string,
  referenceDate: Date = new Date()
): number {
  const weekStart = startOfWeek(referenceDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  let count = 0;

  for (const [day, habitIds] of Object.entries(logs)) {
    const d = new Date(day + 'T00:00:00');
    if (d >= weekStart && d <= weekEnd) {
      if (habitIds.includes(habitId)) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Calculate current streak for a habit (consecutive days completed)
 * Includes "streak freeze" - allows ONE miss before breaking streak
 */
export function calculateStreak(
  logs: Record<string, string[]>,
  habitId: string
): number {
  let streak = 0;
  let missedDays = 0;
  const MAX_MISSED_DAYS = 1; // Streak freeze: allow 1 miss

  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const dayLogs = logs[ds] || [];

    if (dayLogs.includes(habitId)) {
      streak++;
    } else {
      missedDays++;
      // Break streak if we've missed too many days in a row
      if (missedDays > MAX_MISSED_DAYS) {
        break;
      }
    }
  }

  return streak;
}

/**
 * Check if a habit is completed for a specific day
 */
export function isHabitComplete(
  logs: Record<string, string[]>,
  habitId: string,
  date: Date
): boolean {
  const ds = dateStr(date);
  const dayLogs = logs[ds] || [];
  return dayLogs.includes(habitId);
}

/**
 * Check if a habit is skipped for a specific day
 */
export function isHabitSkipped(
  marks: Record<string, { skip: string[]; fail: string[] }>,
  habitId: string,
  date: Date
): boolean {
  const ds = dateStr(date);
  const dayMarks = marks[ds];
  return dayMarks?.skip?.includes(habitId) || false;
}

/**
 * Check if a habit is failed for a specific day
 */
export function isHabitFailed(
  marks: Record<string, { skip: string[]; fail: string[] }>,
  habitId: string,
  date: Date
): boolean {
  const ds = dateStr(date);
  const dayMarks = marks[ds];
  return dayMarks?.fail?.includes(habitId) || false;
}

/**
 * Calculate completion percentage for a day
 */
export function getDayCompletionPercent(
  habits: Habit[],
  logs: Record<string, string[]>,
  date: Date,
  identityFilter: string = 'all'
): number {
  const activeHabits = getActiveHabits(habits, date, identityFilter);
  if (activeHabits.length === 0) return 0;

  const ds = dateStr(date);
  const dayLogs = logs[ds] || [];
  const completed = activeHabits.filter((h) => dayLogs.includes(h.id)).length;

  return completed / activeHabits.length;
}

/**
 * Generate a unique ID (for new habits, identities, etc.)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ============================================
// HABIT UTILITIES
// ============================================
// Functions for working with habits, logs,
// streaks, and progress calculations.
// ============================================

import { Habit, AppState, VacationPeriod } from '../types';
import { dateStr, startOfWeek } from './dates';

// ---- Streak exemptions ----
// Days that are neither a hit nor a miss for streaks: vacation days (all
// habits) and missed days a pet snack covered (one habit). AppProvider keeps
// this current on every render, so the streak functions below don't need
// the whole state threaded through every call site.
type Exemptions = { vacations: VacationPeriod[]; saves: Record<string, string[]> };
let exemptions: Exemptions = { vacations: [], saves: {} };

export function setStreakExemptions(state: Pick<AppState, 'vacations' | 'streakSaves'>): void {
  exemptions = { vacations: state.vacations || [], saves: state.streakSaves || {} };
}

/** True if `ds` (YYYY-MM-DD) falls inside a vacation period. */
export function isVacationDay(ds: string, vacations: VacationPeriod[] = exemptions.vacations): boolean {
  return vacations.some((v) => ds >= v.from && (!v.to || ds <= v.to));
}

/** True if a missed `ds` should not count against this habit's streak. */
export function isExemptDay(ds: string, habitId: string): boolean {
  return isVacationDay(ds) || (exemptions.saves[ds] || []).includes(habitId);
}

/** How many days a week the habit is scheduled on. */
function scheduledDaysPerWeek(habit: Habit): number {
  return Array.isArray(habit.days) ? habit.days.filter(Boolean).length : 7;
}

/**
 * "X times a week" habits: when the weekly goal is lower than the number of
 * scheduled days, a missed day isn't a miss if that week's goal was met, or
 * (this week) can still be met with the days that are left.
 */
export function isWeeklyGoalCovered(
  logs: Record<string, string[]>,
  habit: Habit,
  date: Date,
  referenceDate: Date = new Date()
): boolean {
  const goal = habit.weeklyGoal || 7;
  if (goal >= scheduledDaysPerWeek(habit)) return false;

  const weekStart = startOfWeek(date);
  const today = dateStr(referenceDate);
  let count = 0;
  let remaining = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const ds = dateStr(d);
    if ((logs[ds] || []).includes(habit.id)) count++;
    else if (ds >= today && isHabitActiveOn(habit, d)) remaining++;
  }
  return count >= goal || count + remaining >= goal;
}

/**
 * Check if a habit is active on a specific day of the week
 * @param habit - The habit to check
 * @param date - The date to check
 * @returns true if habit is active on that day
 */
export function isHabitActiveOn(habit: Habit, date: Date): boolean {
  // Archived habits keep their history but are never scheduled from the archive day on
  if (habit.archivedAt && dateStr(date) >= habit.archivedAt) return false;
  if (!habit.days || !Array.isArray(habit.days)) {
    return true; // If no days specified, active every day
  }
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  return habit.days[dayOfWeek];
}

/**
 * Habits that are ticked off day by day and not archived — what lists,
 * pickers and reminders should show. Quit habits have their own section.
 */
export function liveHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !h.archivedAt && !h.quit);
}

/** Archived habits, most recently archived first. */
export function archivedHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !!h.archivedAt).sort((a, b) => (b.archivedAt || '').localeCompare(a.archivedAt || ''));
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

  // Filter by active day. Quit habits aren't daily to-dos; they have their own section.
  filtered = filtered.filter((h) => !h.quit && isHabitActiveOn(h, date));

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
 * Calculate current streak for a habit (consecutive scheduled days completed).
 *
 * Rules:
 *  - Only days the habit is scheduled on count (pass `habit` for this; a
 *    Mon/Wed/Fri habit is not "missed" on Tuesday).
 *  - "Streak freeze": one missed day between completions is forgiven. Two
 *    misses in a row end the streak. The counter resets on every completion.
 *  - If today isn't done yet it is simply not counted — it's not a miss
 *    until the day is over.
 *
 * @param referenceDate  "today" — injectable for tests
 */
export function calculateStreak(
  logs: Record<string, string[]>,
  habitId: string,
  habit?: Habit,
  referenceDate: Date = new Date()
): number {
  let streak = 0;
  let consecutiveMisses = 0;
  const MAX_CONSECUTIVE_MISSES = 1; // Streak freeze: allow 1 miss in a row

  for (let i = 0; i < 365; i++) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);

    // Unscheduled days are neutral — neither hit nor miss
    if (habit && !isHabitActiveOn(habit, d)) continue;

    const ds = dateStr(d);
    const done = (logs[ds] || []).includes(habitId);

    if (done) {
      streak++;
      consecutiveMisses = 0;
    } else if (i === 0) {
      // Today, not done yet: don't penalize, keep looking back
      continue;
    } else if (isExemptDay(ds, habitId) || (habit && isWeeklyGoalCovered(logs, habit, d, referenceDate))) {
      // Vacation, a snack-saved day, or a week whose goal is covered: neutral
      continue;
    } else {
      consecutiveMisses++;
      if (consecutiveMisses > MAX_CONSECUTIVE_MISSES) break;
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

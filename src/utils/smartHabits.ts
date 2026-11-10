// ============================================
// SMART HABITS
// ============================================
// Pure state helpers for the 1.4 habit types:
//
//   - count / timed habits  (Habit.target + state.progress)
//   - quit habits           (Habit.quit — days since the last slip)
//   - vacation mode         (state.vacations — streaks paused)
//   - pet snacks            (state.snacks — each saves one missed day)
//
// A count/timed habit is "done" for a day exactly when its progress reaches
// the target, and done-ness always lives in `logs` like every other habit,
// so streaks, stats, the widget and the letter need no special cases.
// ============================================

import { AppState, Habit, QuitTracker } from '../types';
import { dateStr } from './dates';
import { calculateStreak, isExemptDay, isHabitActiveOn, isWeeklyGoalCovered, isVacationDay, setStreakExemptions } from './habits';

// ---------------- Count / timed habits ----------------

export function isTimedHabit(habit: Habit): boolean {
  return habit.target?.unit === 'min';
}

/** How much one tap of "+" adds. */
export function progressStep(habit: Habit): number {
  if (!habit.target) return 1;
  if (isTimedHabit(habit)) return habit.target.amount >= 30 ? 5 : 1;
  return habit.target.amount >= 50 ? 10 : 1;
}

export function getProgress(state: Pick<AppState, 'progress'>, habitId: string, date: string): number {
  return state.progress?.[date]?.[habitId] ?? 0;
}

/** "3/8 glasses", "15/20 min" */
export function formatProgress(habit: Habit, amount: number): string {
  if (!habit.target) return '';
  return `${amount}/${habit.target.amount} ${habit.target.unit}`.trim();
}

function withDone(state: AppState, habitId: string, date: string, done: boolean): AppState {
  const dayLogs = state.logs[date] || [];
  const isDone = dayLogs.includes(habitId);
  if (isDone === done) return state;
  const logs = { ...state.logs, [date]: done ? [...dayLogs, habitId] : dayLogs.filter((id) => id !== habitId) };
  let marks = state.marks;
  if (marks[date]) {
    marks = {
      ...marks,
      [date]: {
        skip: marks[date].skip.filter((id) => id !== habitId),
        fail: marks[date].fail.filter((id) => id !== habitId),
      },
    };
  }
  return { ...state, logs, marks };
}

function withProgress(state: AppState, habitId: string, date: string, amount: number): AppState {
  const day = { ...(state.progress?.[date] || {}) };
  if (amount > 0) day[habitId] = amount;
  else delete day[habitId];
  return { ...state, progress: { ...(state.progress || {}), [date]: day } };
}

/** Set a habit's amount for a day; the day becomes done/undone to match the target. */
export function setHabitProgress(state: AppState, habitId: string, date: string, amount: number): AppState {
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit?.target) return state;
  const clamped = Math.max(0, Math.min(Math.round(amount), habit.target.amount * 10));
  return withDone(withProgress(state, habitId, date, clamped), habitId, date, clamped >= habit.target.amount);
}

/**
 * Keep progress in step after a plain tick/untick (swipe, checkbox, widget):
 * ticking fills the target, unticking clears it. No-op for simple habits.
 */
export function syncProgressWithDone(state: AppState, habitId: string, date: string): AppState {
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit?.target) return state;
  const done = (state.logs[date] || []).includes(habitId);
  const current = getProgress(state, habitId, date);
  if (done && current < habit.target.amount) return withProgress(state, habitId, date, habit.target.amount);
  if (!done && current >= habit.target.amount) return withProgress(state, habitId, date, 0);
  return state;
}

// ---------------- Quit habits ----------------

export function isQuitHabit(habit: Habit): boolean {
  return !!habit.quit;
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T12:00:00').getTime();
  const b = new Date(to + 'T12:00:00').getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function newQuitTracker(now: Date = new Date()): QuitTracker {
  return { since: dateStr(now), best: 0, slips: [] };
}

/** Whole clean days so far in the current run. */
export function quitDays(habit: Habit, now: Date = new Date()): number {
  return habit.quit ? daysBetween(habit.quit.since, dateStr(now)) : 0;
}

export function quitBest(habit: Habit, now: Date = new Date()): number {
  return habit.quit ? Math.max(habit.quit.best, quitDays(habit, now)) : 0;
}

/** A slip restarts the count from today and remembers the best run. */
export function recordSlip(state: AppState, habitId: string, now: Date = new Date()): AppState {
  const today = dateStr(now);
  return {
    ...state,
    habits: state.habits.map((h) =>
      h.id === habitId && h.quit
        ? { ...h, quit: { since: today, best: quitBest(h, now), slips: [...h.quit.slips, today].slice(-365) } }
        : h
    ),
  };
}

// ---------------- Vacation mode ----------------

export function isOnVacation(state: Pick<AppState, 'vacations'>, now: Date = new Date()): boolean {
  const last = (state.vacations || []).slice(-1)[0];
  return !!last && !last.to && last.from <= dateStr(now);
}

export function startVacation(state: AppState, now: Date = new Date()): AppState {
  if (isOnVacation(state, now)) return state;
  return { ...state, vacations: [...(state.vacations || []), { from: dateStr(now) }] };
}

/** Ends today's vacation. Today counts as a normal day again; a same-day start/end leaves no trace. */
export function endVacation(state: AppState, now: Date = new Date()): AppState {
  const vacations = [...(state.vacations || [])];
  const last = vacations[vacations.length - 1];
  if (!last || last.to) return state;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const to = dateStr(yesterday);
  if (to < last.from) vacations.pop();
  else vacations[vacations.length - 1] = { ...last, to };
  return { ...state, vacations };
}

// ---------------- Pet snacks (streak freezes) ----------------

export const MAX_SNACKS = 5;
/** A streak has to be worth saving. */
const MIN_STREAK_TO_SAVE = 7;
/** Beyond this many missed days in a row we don't spend snacks: the user is away, not slipping. */
const MAX_MISSES_TO_SAVE = 3;

function tracked(state: AppState): Habit[] {
  return state.habits.filter((h) => !h.archivedAt && !h.quit);
}

/** One snack for every 7 days a streak grows (7, 14, 21...), per habit, up to MAX_SNACKS in hand. */
export function earnSnacks(state: AppState, now: Date = new Date()): AppState {
  setStreakExemptions(state);
  let snacks = state.snacks ?? 0;
  const milestones = { ...(state.snackMilestones || {}) };
  let changed = false;

  for (const h of tracked(state)) {
    const level = Math.floor(calculateStreak(state.logs, h.id, h, now) / 7) * 7;
    const prev = milestones[h.id] ?? 0;
    if (level > prev) {
      snacks = Math.min(MAX_SNACKS, snacks + (level - prev) / 7);
      milestones[h.id] = level;
      changed = true;
    } else if (level < prev) {
      milestones[h.id] = level;
      changed = true;
    }
  }
  return changed ? { ...state, snacks, snackMilestones: milestones } : state;
}

/**
 * Missed days that snacks should cover. The streak rules already forgive one
 * miss in a row; a snack covers each further one, so the streak survives.
 * Only looks at days that are over (yesterday and back).
 */
export function planSnackSaves(state: AppState, now: Date = new Date()): { habitId: string; date: string }[] {
  setStreakExemptions(state);
  let snacks = state.snacks ?? 0;
  const saves: { habitId: string; date: string }[] = [];
  if (snacks <= 0) return saves;

  for (const h of tracked(state)) {
    const misses: string[] = [];
    let lastDone: Date | null = null;

    for (let i = 1; i <= 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (!isHabitActiveOn(h, d)) continue;
      const ds = dateStr(d);
      if ((state.logs[ds] || []).includes(h.id)) {
        lastDone = d;
        break;
      }
      if (isExemptDay(ds, h.id) || isWeeklyGoalCovered(state.logs, h, d, now)) continue;
      misses.push(ds);
      if (misses.length > MAX_MISSES_TO_SAVE) break;
    }

    const need = misses.length - 1;
    if (!lastDone || need < 1 || misses.length > MAX_MISSES_TO_SAVE || need > snacks) continue;
    if (calculateStreak(state.logs, h.id, h, lastDone) < MIN_STREAK_TO_SAVE) continue;

    // Cover the oldest misses; the most recent one is the free pass
    for (const date of misses.slice(-need)) saves.push({ habitId: h.id, date });
    snacks -= need;
  }
  return saves;
}

/** Earn, then spend: the one call the app makes when a day's data changes or the app wakes. */
export function runSnacks(state: AppState, now: Date = new Date()): AppState {
  let next = earnSnacks(state, now);
  const saves = planSnackSaves(next, now);
  if (saves.length > 0) {
    const streakSaves = { ...(next.streakSaves || {}) };
    for (const s of saves) streakSaves[s.date] = [...(streakSaves[s.date] || []), s.habitId];
    const names = [...new Set(saves.map((s) => next.habits.find((h) => h.id === s.habitId)?.name || ''))].filter(Boolean);
    next = {
      ...next,
      streakSaves,
      snacks: Math.max(0, (next.snacks ?? 0) - saves.length),
      lastSnackNote: { date: dateStr(now), habitNames: names },
    };
  }
  setStreakExemptions(next);
  return next;
}

export { isVacationDay };

// ============================================
// WIDGET TAPS
// ============================================
// Ticking a habit on the home screen widget runs inside the widget
// extension, which can't reach the app's AsyncStorage. So the widget's
// button handler records the tap in its own props (`taps`), which WidgetKit
// keeps in the shared App Group. The app reads them back with getTimeline()
// on launch, on foreground and on a live interaction event, applies them,
// then re-syncs the widget, which clears the list.
//
// Taps are "set done to X", not "toggle", so reading the same list twice is
// harmless. See docs/INTERACTIVE_WIDGET.md.
// ============================================

import { AppState } from '../types';
import { dateStr } from './dates';

export type WidgetTap = {
  /** Habit id */
  id: string;
  /** YYYY-MM-DD of the widget entry that was tapped */
  date: string;
  /** The state the user set */
  done: boolean;
  /** ms since epoch, from the widget runtime */
  ts: number;
};

export type HabitDoneChange = { habitId: string; date: string; done: boolean };

/** How far back a tap still counts (a tap on last night's entry, read this morning). */
const MAX_AGE_DAYS = 2;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isTap(t: unknown): t is WidgetTap {
  const x = t as WidgetTap;
  return (
    !!x &&
    typeof x.id === 'string' &&
    x.id.length > 0 &&
    typeof x.date === 'string' &&
    DATE_RE.test(x.date) &&
    typeof x.done === 'boolean' &&
    typeof x.ts === 'number'
  );
}

/** All taps across the widget's timeline entries, oldest first. */
export function collectWidgetTaps(entries: { props?: { taps?: unknown } }[]): WidgetTap[] {
  const taps: WidgetTap[] = [];
  for (const e of entries || []) {
    const list = e?.props?.taps;
    if (Array.isArray(list)) taps.push(...list.filter(isTap));
  }
  return taps.sort((a, b) => a.ts - b.ts);
}

/**
 * Turn taps into the changes the app should make: last tap wins per
 * habit/day; unknown, archived, future and stale taps are dropped, and so
 * are taps that already match the app's state.
 */
export function planWidgetTaps(state: AppState, taps: WidgetTap[], now: Date = new Date()): HabitDoneChange[] {
  const today = dateStr(now);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
  const oldest = dateStr(cutoff);

  const latest = new Map<string, WidgetTap>();
  for (const t of taps) latest.set(`${t.id}|${t.date}`, t);

  const changes: HabitDoneChange[] = [];
  for (const t of latest.values()) {
    if (t.date > today || t.date < oldest) continue;
    const habit = state.habits.find((h) => h.id === t.id);
    if (!habit) continue;
    if (habit.archivedAt && t.date >= habit.archivedAt) continue;
    const isDone = (state.logs[t.date] || []).includes(t.id);
    if (isDone !== t.done) changes.push({ habitId: t.id, date: t.date, done: t.done });
  }
  return changes;
}

/** Set (not toggle) completion for each change; clears that day's skip/fail mark like a toggle does. */
export function applyHabitDoneChanges(state: AppState, changes: HabitDoneChange[]): AppState {
  if (changes.length === 0) return state;
  const logs = { ...state.logs };
  const marks = { ...state.marks };
  for (const { habitId, date, done } of changes) {
    const dayLogs = (logs[date] || []).filter((id) => id !== habitId);
    logs[date] = done ? [...dayLogs, habitId] : dayLogs;
    if (marks[date]) {
      marks[date] = {
        skip: marks[date].skip.filter((id) => id !== habitId),
        fail: marks[date].fail.filter((id) => id !== habitId),
      };
    }
  }
  return { ...state, logs, marks };
}

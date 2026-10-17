// ============================================
// WIDGET SYNC
// ============================================
// Turns app state + theme into the props the home screen widget shows,
// and pushes them to WidgetKit. Two timeline entries go out each time:
//
//   1. now            — today's progress
//   2. next midnight  — tomorrow's habits at 0 done, so the widget rolls
//                       over on its own even if the app isn't opened
//
// Pure computation lives in buildWidgetProps() so it can be unit-tested
// without touching native code.
// ============================================

import { Platform } from 'react-native';
import { AppState, PetMood } from '../types';
import { ThemeColors } from '../theme/colors';
import { calculateStreak, getActiveHabits } from './habits';
import { dateStr } from './dates';
import type { TodayWidgetProps, WidgetHabit } from '../widgets/TodayWidget';

const MOOD_WORDS: Record<PetMood, string> = {
  idle: 'waiting for you',
  curious: 'curious',
  happy: 'happy',
  excited: 'excited',
  celebrate: 'thrilled',
};

function moodFor(pct: number): PetMood {
  if (pct >= 1) return 'celebrate';
  if (pct >= 0.75) return 'excited';
  if (pct >= 0.5) return 'happy';
  if (pct >= 0.25) return 'curious';
  return 'idle';
}

/** Max habits we ship to the widget — the large layout shows 9. */
const MAX_HABITS = 12;

export function buildWidgetProps(state: AppState, colors: ThemeColors, date: Date): TodayWidgetProps {
  const ds = dateStr(date);
  const active = getActiveHabits(state.habits, date, 'all');
  const doneIds = new Set(state.logs[ds] || []);

  const habits: WidgetHabit[] = active.map((h) => ({ name: h.name, done: doneIds.has(h.id) }));
  // Undone first so the widget surfaces what's left; keep app order within each group
  habits.sort((a, b) => Number(a.done) - Number(b.done));

  const total = active.length;
  const done = habits.filter((h) => h.done).length;
  const pct = total > 0 ? done / total : 0;

  const bestStreak = state.habits.reduce((best, h) => Math.max(best, calculateStreak(state.logs, h.id, h, date)), 0);

  return {
    date: ds,
    done,
    total,
    bestStreak,
    mood: MOOD_WORDS[moodFor(pct)],
    habits: habits.slice(0, MAX_HABITS),
    bg: colors.bg,
    card: colors.card,
    text: colors.text,
    muted: colors.muted,
    accent: colors.accent,
    good: colors.good,
  };
}

/** Local midnight at the start of the day after `date`. */
export function nextMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(24, 0, 0, 0);
  return d;
}

let lastPayload: string | null = null;

/**
 * Push the current state to the home screen widget. Safe to call often:
 * no-ops on non-iOS, and skips the native call if nothing changed.
 */
export async function syncWidget(state: AppState, colors: ThemeColors, now: Date = new Date()): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const today = buildWidgetProps(state, colors, now);
    const tomorrow = buildWidgetProps(state, colors, nextMidnight(now));

    const payload = JSON.stringify([today, tomorrow]);
    if (payload === lastPayload) return;

    // Lazy import keeps the native module out of the web bundle and out of tests
    const { default: TodayWidget } = await import('../widgets/TodayWidget');
    TodayWidget.updateTimeline([
      { date: now, props: today },
      { date: nextMidnight(now), props: tomorrow },
    ]);
    lastPayload = payload;
  } catch (error) {
    // Widgets are a nice-to-have; never let them take the app down
    console.warn('Widget sync failed:', error);
  }
}

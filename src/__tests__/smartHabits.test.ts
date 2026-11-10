import { calculateStreak, setStreakExemptions } from '../utils/habits';
import { longestStreakEver } from '../utils/evolution';
import {
  earnSnacks, endVacation, formatProgress, getProgress, isOnVacation, planSnackSaves, quitBest, quitDays,
  recordSlip, runSnacks, setHabitProgress, startVacation, syncProgressWithDone,
} from '../utils/smartHabits';
import { applyHabitDoneChanges } from '../utils/widgetTaps';
import { dateStr } from '../utils/dates';
import { AppState, Habit } from '../types';

const NOW = new Date(2026, 10, 12, 9); // Thu 12 Nov 2026
const TODAY = '2026-11-12';
const day = (offset: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offset);
  return dateStr(d);
};
const EVERY = [true, true, true, true, true, true, true];

function habit(id: string, extra: Partial<Habit> = {}): Habit {
  return { id, name: id, weeklyGoal: 7, identityId: 'g', createdAt: '', days: EVERY, order: 1, ...extra };
}
function state(overrides: Partial<AppState> = {}): AppState {
  return {
    theme: 'light', sfxEnabled: true, hapticsEnabled: true, notificationsEnabled: false,
    notificationTime: { hour: 9, minute: 0 }, identities: [], currentIdentityFilter: 'all',
    habits: [habit('a')], logs: {}, marks: {}, dayPlanSchedules: {}, notes: {},
    routineStepLogs: {}, hasCompletedOnboarding: true, hasSeenSwipeHint: true,
    petSpecies: 'hawk', petHat: 'none', activeFasts: {}, petStageSeen: 0, ...overrides,
  };
}
/** Logs with `id` done on each offset (0 = today, -1 = yesterday...). */
function done(id: string, offsets: number[]): Record<string, string[]> {
  const logs: Record<string, string[]> = {};
  for (const o of offsets) logs[day(o)] = [id];
  return logs;
}
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

afterEach(() => setStreakExemptions({}));

describe('count / timed habits', () => {
  const water = habit('w', { target: { amount: 8, unit: 'glasses' } });

  it('is done exactly when progress reaches the target', () => {
    let s = state({ habits: [water] });
    s = setHabitProgress(s, 'w', TODAY, 7);
    expect(s.logs[TODAY] || []).toEqual([]);
    expect(formatProgress(water, getProgress(s, 'w', TODAY))).toBe('7/8 glasses');
    s = setHabitProgress(s, 'w', TODAY, 8);
    expect(s.logs[TODAY]).toEqual(['w']);
    s = setHabitProgress(s, 'w', TODAY, 5);
    expect(s.logs[TODAY]).toEqual([]);
  });

  it('never goes below zero and ignores habits without a target', () => {
    const s = state({ habits: [water, habit('a')] });
    expect(getProgress(setHabitProgress(s, 'w', TODAY, -3), 'w', TODAY)).toBe(0);
    expect(setHabitProgress(s, 'a', TODAY, 3)).toBe(s);
  });

  it('a plain tick fills the target and an untick clears it', () => {
    let s = state({ habits: [water], progress: { [TODAY]: { w: 3 } } });
    s = syncProgressWithDone(applyHabitDoneChanges(s, [{ habitId: 'w', date: TODAY, done: true }]), 'w', TODAY);
    expect(getProgress(s, 'w', TODAY)).toBe(8);
    s = syncProgressWithDone(applyHabitDoneChanges(s, [{ habitId: 'w', date: TODAY, done: false }]), 'w', TODAY);
    expect(getProgress(s, 'w', TODAY)).toBe(0);
  });
});

describe('X times a week', () => {
  // Thu 12 Nov: this week is Mon 9 .. Sun 15; last week Mon 2 .. Sun 8
  const gym = habit('g', { weeklyGoal: 3 });

  it('does not break the streak on off days in a week whose goal was met', () => {
    // Last week: Mon, Wed, Fri (offsets -10, -8, -6). This week: Mon (-3).
    const logs = done('g', [-10, -8, -6, -3]);
    expect(calculateStreak(logs, 'g', gym, NOW)).toBe(4);
    expect(longestStreakEver(logs, 'g', gym, NOW)).toBe(4);
  });

  it('breaks when a past week fell short', () => {
    // Last week only once; this week once
    const logs = done('g', [-10, -3]);
    expect(calculateStreak(logs, 'g', gym, NOW)).toBe(1);
  });

  it('leaves daily habits strict', () => {
    // Same pattern on a daily habit: two misses in a row since Monday ends it
    const logs = done('a', [-10, -8, -6, -3]);
    expect(calculateStreak(logs, 'a', habit('a'), NOW)).toBe(0);
  });
});

describe('quit habits', () => {
  it('counts clean days and restarts on a slip, keeping the best run', () => {
    const soda = habit('q', { quit: { since: day(-12), best: 5, slips: [] } });
    expect(quitDays(soda, NOW)).toBe(12);
    const s = recordSlip(state({ habits: [soda] }), 'q', NOW);
    const after = s.habits[0];
    expect(quitDays(after, NOW)).toBe(0);
    expect(quitBest(after, NOW)).toBe(12);
    expect(after.quit!.slips).toEqual([TODAY]);
  });
});

describe('vacation mode', () => {
  it('pauses streaks for the days it covers', () => {
    const logs = done('a', [...range(-12, -6), -1, 0]); // 7 days, 4 days away, back yesterday
    expect(calculateStreak(logs, 'a', habit('a'), NOW)).toBe(2);
    setStreakExemptions({ vacations: [{ from: day(-5), to: day(-2) }] });
    expect(calculateStreak(logs, 'a', habit('a'), NOW)).toBe(9);
    expect(longestStreakEver(logs, 'a', habit('a'), NOW)).toBe(9);
  });

  it('starts, ends, and leaves no trace when ended the same day', () => {
    let s = startVacation(state(), NOW);
    expect(isOnVacation(s, NOW)).toBe(true);
    expect(endVacation(s, NOW).vacations).toEqual([]);
    const later = new Date(NOW);
    later.setDate(later.getDate() + 3);
    s = endVacation(s, later);
    expect(s.vacations).toEqual([{ from: TODAY, to: day(2) }]);
    expect(isOnVacation(s, later)).toBe(false);
  });
});

describe('pet snacks', () => {
  it('earns one per 7 days of streak, once', () => {
    let s = earnSnacks(state({ logs: done('a', range(-13, 0)) }), NOW); // 14-day streak
    expect(s.snacks).toBe(2);
    expect(earnSnacks(s, NOW)).toBe(s);
  });

  it('spends a snack to cover the second missed day in a row', () => {
    // 8-day streak, then missed the last two days
    const s = state({ logs: done('a', range(-10, -3)), snacks: 1, snackMilestones: { a: 7 } });
    expect(planSnackSaves(s, NOW)).toEqual([{ habitId: 'a', date: day(-2) }]);
    const after = runSnacks(s, NOW);
    expect(after.snacks).toBe(0);
    expect(after.lastSnackNote?.habitNames).toEqual(['a']);
    expect(calculateStreak(after.logs, 'a', habit('a'), NOW)).toBe(8);
  });

  it('does nothing for a single miss, a short streak, or with no snacks', () => {
    expect(planSnackSaves(state({ logs: done('a', range(-10, -2)), snacks: 1 }), NOW)).toEqual([]);
    expect(planSnackSaves(state({ logs: done('a', range(-5, -3)), snacks: 1 }), NOW)).toEqual([]);
    expect(planSnackSaves(state({ logs: done('a', range(-10, -3)), snacks: 0 }), NOW)).toEqual([]);
  });

  it('does not burn snacks on a long absence', () => {
    expect(planSnackSaves(state({ logs: done('a', range(-20, -6)), snacks: 5 }), NOW)).toEqual([]);
  });
});

describe('streak-at-risk nudge', () => {
  // Imported lazily: the module pulls in expo-notifications
  jest.mock('expo-notifications', () => ({}));
  const { planStreakNudges } = require('../utils/streakNudge');

  it('plans tonight and tomorrow for an open streak of a week or more', () => {
    const s = state({ notificationsEnabled: true, petName: 'Juniper', logs: done('a', range(-8, -1)) });
    const nudges = planStreakNudges(s, NOW);
    expect(nudges.map((n: any) => n.id)).toEqual([`streak-nudge-${TODAY}`, `streak-nudge-${day(1)}`]);
    expect(nudges[0].at.getHours()).toBe(20);
    expect(nudges[0].title).toContain('Juniper');
    expect(nudges[0].body).toContain('8-day a streak');
  });

  it('skips today once the habit is done, short streaks, vacation and notifications off', () => {
    const logs = done('a', range(-8, 0));
    const ids = (s: AppState) => planStreakNudges(s, NOW).map((n: any) => n.id);
    expect(ids(state({ notificationsEnabled: true, logs }))).toEqual([`streak-nudge-${day(1)}`]);
    expect(ids(state({ notificationsEnabled: true, logs: done('a', range(-3, -1)) }))).toEqual([]);
    expect(ids(state({ notificationsEnabled: true, logs, vacations: [{ from: TODAY }] }))).toEqual([]);
    expect(ids(state({ notificationsEnabled: false, logs }))).toEqual([]);
  });
});

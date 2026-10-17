jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  AndroidNotificationPriority: { HIGH: 'high' },
}));

import { planHabitReminders } from '../utils/notifications';
import { AppState, Habit } from '../types';

const MWF = [false, true, false, true, false, true, false];
function habit(id: string, extra: Partial<Habit> = {}): Habit {
  return { id, name: id, weeklyGoal: 7, identityId: 'g', createdAt: '', days: [true, true, true, true, true, true, true], order: 1, ...extra };
}
function state(o: Partial<AppState>): AppState {
  return {
    theme: 'light', sfxEnabled: true, hapticsEnabled: true, notificationsEnabled: true,
    notificationTime: { hour: 9, minute: 0 }, identities: [], currentIdentityFilter: 'all', habits: [], logs: {}, marks: {},
    dayPlanTimes: {}, dayPlanSchedules: {}, notes: {}, routineStepLogs: {}, hasCompletedOnboarding: true, hasSeenSwipeHint: true,
    petSpecies: 'blob', petHat: 'none', activeFasts: {}, petStageSeen: 0, ...o,
  };
}

describe('planHabitReminders', () => {
  it('is empty when notifications are off', () => {
    expect(planHabitReminders(state({ notificationsEnabled: false, habits: [habit('a')] })).triggers).toEqual([]);
  });

  it('gives a scheduled habit its own daily reminder and leaves the rest to the general one', () => {
    const s = state({
      habits: [habit('med', { name: 'Meditate' }), habit('read', { name: 'Read' })],
      dayPlanSchedules: { med: { time: '07:00', duration: 10, recurring: 'daily' } },
    });
    const plan = planHabitReminders(s);
    expect(plan.triggers).toHaveLength(2);
    expect(plan.triggers[0]).toMatchObject({ habitId: 'med', hour: 7, minute: 0, weekday: null, title: 'Meditate' });
    expect(plan.triggers[1]).toMatchObject({ habitId: null, hour: 9, minute: 0 });
    expect(plan.triggers[1].body).toContain('Read');
    expect(plan.triggers[1].body).not.toContain('Meditate');
  });

  it('uses weekly triggers for a Mon/Wed/Fri habit (expo weekday 1=Sun)', () => {
    const s = state({ habits: [habit('gym', { days: MWF })], dayPlanSchedules: { gym: { time: '18:30', duration: 60, recurring: 'daily' } } });
    const t = planHabitReminders(s).triggers;
    expect(t.map((x) => x.weekday)).toEqual([2, 4, 6]);
    expect(t[0]).toMatchObject({ hour: 18, minute: 30 });
  });

  it('intersects custom recurrence with the habit\'s active days', () => {
    const s = state({
      habits: [habit('gym', { days: MWF })],
      dayPlanSchedules: { gym: { time: '18:30', duration: 60, recurring: 'custom', recurringDays: [false, true, true, true, false, false, false] } },
    });
    expect(planHabitReminders(s).triggers.map((x) => x.weekday)).toEqual([2, 4]); // Mon, Wed only
  });

  it('skips a malformed time and no general reminder when every habit has its own', () => {
    const s = state({
      habits: [habit('a'), habit('b')],
      dayPlanSchedules: { a: { time: 'nope', duration: 1, recurring: 'daily' }, b: { time: '06:15', duration: 1, recurring: 'daily' } },
    });
    const plan = planHabitReminders(s);
    expect(plan.generalHabitNames).toEqual(['a']);
    expect(plan.triggers.filter((t) => t.habitId === 'b')).toHaveLength(1);
  });

  it('stays under the iOS 64-notification cap by collapsing weekly to daily', () => {
    const habits = Array.from({ length: 20 }, (_, i) => habit(`h${i}`, { days: MWF }));
    const dayPlanSchedules = Object.fromEntries(habits.map((h) => [h.id, { time: '08:00', duration: 5, recurring: 'daily' as const }]));
    const plan = planHabitReminders(state({ habits, dayPlanSchedules }));
    expect(plan.triggers.length).toBeLessThanOrEqual(60);
    expect(plan.triggers.every((t) => t.weekday === null)).toBe(true);
  });
});

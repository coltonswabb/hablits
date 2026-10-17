import { buildWeeklyRecap, composeLetter, currentLetter, isLetterSeason } from '../utils/petLetter';
import { dateStr } from '../utils/dates';
import { AppState, Habit } from '../types';

const local = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
const MONDAY = local(2026, 6, 15); // Mon Jun 15 2026 → recap covers Jun 8–14
function habit(id: string, name = id, extra: Partial<Habit> = {}): Habit {
  return { id, name, weeklyGoal: 7, identityId: 'g', createdAt: '', days: [true, true, true, true, true, true, true], order: 1, ...extra };
}
function state(o: Partial<AppState>): AppState {
  return {
    theme: 'light', sfxEnabled: true, hapticsEnabled: true, notificationsEnabled: false, notificationTime: { hour: 9, minute: 0 },
    identities: [], currentIdentityFilter: 'all', habits: [], logs: {}, marks: {}, dayPlanSchedules: {}, notes: {}, routineStepLogs: {},
    hasCompletedOnboarding: true, hasSeenSwipeHint: true, petSpecies: 'blob', petHat: 'none', activeFasts: {}, petStageSeen: 0, ...o,
  };
}
function logsFor(entries: Array<[Date, string[]]>): Record<string, string[]> {
  return Object.fromEntries(entries.map(([d, ids]) => [dateStr(d), ids]));
}

describe('buildWeeklyRecap', () => {
  it('summarises the previous Mon–Sun week', () => {
    const habits = [habit('a', 'Meditate'), habit('b', 'Read')];
    const logs = logsFor([
      [local(2026, 6, 8), ['a', 'b']], [local(2026, 6, 9), ['a']], [local(2026, 6, 10), ['a', 'b']], [local(2026, 6, 11), ['a']],
      [local(2026, 6, 12), ['a', 'b']], [local(2026, 6, 13), ['a']], [local(2026, 6, 14), ['a']],
      [local(2026, 6, 15), ['a', 'b']], // this week — excluded
    ]);
    const r = buildWeeklyRecap(state({ habits, logs }), MONDAY)!;
    expect(r.weekStart).toBe('2026-06-08');
    expect(r.weekEnd).toBe('2026-06-14');
    expect(r.scheduled).toBe(14);
    expect(r.completed).toBe(10);
    expect(r.perfectDays).toBe(3);
    expect(r.topHabit).toMatchObject({ name: 'Meditate', done: 7, scheduled: 7 });
    expect(r.strugglingHabit).toMatchObject({ name: 'Read', done: 3 });
  });

  it('returns null when nothing was scheduled', () => {
    expect(buildWeeklyRecap(state({}), MONDAY)).toBeNull();
  });

  it('compares with the week before', () => {
    const habits = [habit('a')];
    const logs = logsFor([[local(2026, 6, 1), ['a']], ...[8, 9, 10, 11, 12].map((d) => [local(2026, 6, d), ['a']] as [Date, string[]])]);
    expect(buildWeeklyRecap(state({ habits, logs }), MONDAY)!.deltaVsLastWeek).toBe(4);
  });
});

describe('composeLetter', () => {
  const base = { weekStart: '2026-06-08', weekEnd: '2026-06-14', perfectDays: 0, bestDay: null, topHabit: null, strugglingHabit: null, deltaVsLastWeek: null, longestStreakNow: 0 };

  it('is deterministic for a week and reflects the tier', () => {
    const great = composeLetter({ ...base, scheduled: 10, completed: 9, pct: 0.9 }, 1);
    const again = composeLetter({ ...base, scheduled: 10, completed: 9, pct: 0.9 }, 1);
    expect(great).toEqual(again);
    expect(great.mood).toBe('celebrate');
    expect(great.paragraphs[0]).toMatch(/9/);
    expect(composeLetter({ ...base, scheduled: 10, completed: 1, pct: 0.1 }, 0).mood).toBe('idle');
  });

  it('mentions the streak when it is a week or more', () => {
    const l = composeLetter({ ...base, scheduled: 10, completed: 7, pct: 0.7, longestStreakNow: 12 }, 2);
    expect(l.paragraphs.some((p) => p.includes('12 days'))).toBe(true);
    expect(l.signoff.length).toBeGreaterThan(0);
  });
});

describe('currentLetter', () => {
  it('only shows Mon/Tue and respects dismissal', () => {
    const habits = [habit('a')];
    const logs = logsFor([[local(2026, 6, 10), ['a']]]);
    const s = state({ habits, logs });
    expect(isLetterSeason(local(2026, 6, 17))).toBe(false); // Wednesday
    expect(currentLetter(s, 0, local(2026, 6, 17))).toBeNull();
    expect(currentLetter(s, 0, MONDAY)).not.toBeNull();
    expect(currentLetter(s, 0, local(2026, 6, 16))).not.toBeNull(); // Tuesday
    expect(currentLetter({ ...s, lastLetterDismissed: '2026-06-08' }, 0, MONDAY)).toBeNull();
  });
});

import { longestStreakEver, bestStreakEver, stageForStreak, daysToNextStage, getPetStage } from '../utils/evolution';
import { migrateState, SCHEMA_VERSION } from '../state/migrations';
import { dateStr } from '../utils/dates';
import { Habit, AppState } from '../types';

const local = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
const TODAY = local(2026, 6, 30);
const MWF = [false, true, false, true, false, true, false];

function habit(id = 'h', extra: Partial<Habit> = {}): Habit {
  return { id, name: id, weeklyGoal: 7, identityId: 'g', createdAt: '', days: [true, true, true, true, true, true, true], order: 1, ...extra };
}
function run(end: Date, n: number, id = 'h'): Record<string, string[]> {
  const logs: Record<string, string[]> = {};
  for (let i = 0; i < n; i++) { const d = new Date(end); d.setDate(d.getDate() - i); logs[dateStr(d)] = [id]; }
  return logs;
}

describe('longestStreakEver', () => {
  it('finds a streak that ended long ago (earned forever)', () => {
    // 40-day run that ended March 1, nothing since
    const logs = run(local(2026, 3, 1), 40);
    expect(longestStreakEver(logs, 'h', habit(), TODAY)).toBe(40);
  });

  it('takes the max across several runs', () => {
    const logs = { ...run(local(2026, 2, 1), 10), ...run(local(2026, 5, 1), 25), ...run(TODAY, 3) };
    expect(longestStreakEver(logs, 'h', habit(), TODAY)).toBe(25);
  });

  it('forgives one miss, breaks on two (same rule as live streak)', () => {
    // 10 days, skip 1, 10 days  → 20 ; then skip 2, 5 days → separate
    const a = run(local(2026, 4, 10), 10);
    const b = run(local(2026, 4, 21), 10); // Apr 12..21, gap = Apr 11 only
    const c = run(local(2026, 4, 29), 5);  // Apr 25..29, gap = Apr 22,23,24
    const logs = { ...a, ...b, ...c };
    expect(longestStreakEver(logs, 'h', habit(), TODAY)).toBe(20);
  });

  it('ignores unscheduled days for a MWF habit', () => {
    // Mon Jun 1 .. Fri Jun 26 2026, every M/W/F → 12 scheduled days
    const logs: Record<string, string[]> = {};
    for (let d = local(2026, 6, 1); d <= local(2026, 6, 26); d.setDate(d.getDate() + 1)) {
      if ([1, 3, 5].includes(d.getDay())) logs[dateStr(d)] = ['h'];
    }
    expect(longestStreakEver(logs, 'h', habit('h', { days: MWF }), TODAY)).toBe(12);
  });

  it('is 0 with no logs', () => {
    expect(longestStreakEver({}, 'h', habit(), TODAY)).toBe(0);
  });
});

describe('stages', () => {
  it('maps streaks to stages at 7/30/100', () => {
    expect(stageForStreak(0)).toBe(0);
    expect(stageForStreak(6)).toBe(0);
    expect(stageForStreak(7)).toBe(1);
    expect(stageForStreak(29)).toBe(1);
    expect(stageForStreak(30)).toBe(2);
    expect(stageForStreak(100)).toBe(3);
    expect(stageForStreak(400)).toBe(3);
  });

  it('reports days to the next stage', () => {
    expect(daysToNextStage(0)).toEqual({ needed: 7, nextStage: 1 });
    expect(daysToNextStage(25)).toEqual({ needed: 5, nextStage: 2 });
    expect(daysToNextStage(100)).toBeNull();
  });

  it('getPetStage uses the best habit', () => {
    const logs = { ...run(TODAY, 3, 'a'), ...run(local(2026, 1, 31), 31, 'b') };
    expect(bestStreakEver([habit('a'), habit('b')], logs, TODAY)).toBe(31);
    expect(getPetStage([habit('a'), habit('b')], logs, TODAY)).toBe(2);
  });
});

describe('migration v2', () => {
  const defaults = {
    theme: 'light', sfxEnabled: true, hapticsEnabled: true, notificationsEnabled: false,
    notificationTime: { hour: 9, minute: 0 }, identities: [], currentIdentityFilter: 'all', habits: [], logs: {}, marks: {},
    dayPlanTimes: {}, dayPlanSchedules: {}, notes: {}, routineStepLogs: {}, hasCompletedOnboarding: false, hasSeenSwipeHint: false,
    petSpecies: 'blob', petHat: 'none', activeFasts: {}, petStageSeen: 0,
  } as AppState;

  it('adds petStageSeen=0 to v1 blobs and preserves it on v2', () => {
    expect(SCHEMA_VERSION).toBe(2);
    expect(migrateState({ schemaVersion: 1, habits: [] }, defaults).petStageSeen).toBe(0);
    expect(migrateState({ schemaVersion: 2, petStageSeen: 2 }, defaults).petStageSeen).toBe(2);
    expect(migrateState({ habits: [] }, defaults).petStageSeen).toBe(0); // v0 walks through both
  });
});

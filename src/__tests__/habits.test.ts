import { calculateStreak, countThisWeek, getDayCompletionPercent, isHabitActiveOn, sortByOrder } from '../utils/habits';
import { dateStr } from '../utils/dates';
import { Habit } from '../types';

const local = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);

const EVERY_DAY = [true, true, true, true, true, true, true];
//                 Sun    Mon   Tue    Wed   Thu    Fri   Sat
const MWF = [false, true, false, true, false, true, false];

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Meditate',
    weeklyGoal: 7,
    identityId: 'general',
    createdAt: '2026-01-01T00:00:00.000Z',
    days: EVERY_DAY,
    order: 1,
    ...overrides,
  };
}

/** Build a logs object marking `habitId` done on each given date */
function logsFor(habitId: string, dates: Date[]): Record<string, string[]> {
  const logs: Record<string, string[]> = {};
  for (const d of dates) logs[dateStr(d)] = [habitId];
  return logs;
}

/** N consecutive days ending at `end` (inclusive) */
function run(end: Date, n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    return d;
  });
}

// Reference "today": Thursday Jan 15, 2026
const TODAY = local(2026, 1, 15);
const yesterday = local(2026, 1, 14);

describe('calculateStreak', () => {
  it('counts consecutive completed days including today', () => {
    const logs = logsFor('h1', run(TODAY, 5));
    expect(calculateStreak(logs, 'h1', habit(), TODAY)).toBe(5);
  });

  it('does not treat an unfinished today as a miss', () => {
    const logs = logsFor('h1', run(yesterday, 10));
    expect(calculateStreak(logs, 'h1', habit(), TODAY)).toBe(10);
  });

  it('forgives a single missed day (streak freeze)', () => {
    // done Jan 15, missed Jan 14, done Jan 13..Jan 10
    const logs = logsFor('h1', [TODAY, ...run(local(2026, 1, 13), 4)]);
    expect(calculateStreak(logs, 'h1', habit(), TODAY)).toBe(5);
  });

  it('breaks on two consecutive misses', () => {
    // done Jan 15, missed Jan 14 and Jan 13, done Jan 12..Jan 1
    const logs = logsFor('h1', [TODAY, ...run(local(2026, 1, 12), 12)]);
    expect(calculateStreak(logs, 'h1', habit(), TODAY)).toBe(1);
  });

  it('resets the freeze after each completion (misses must be IN A ROW)', () => {
    // done, miss, done, miss, done, miss, done — every other day for 2 weeks
    const dates = [0, 2, 4, 6, 8, 10, 12].map((i) => {
      const d = new Date(TODAY);
      d.setDate(d.getDate() - i);
      return d;
    });
    expect(calculateStreak(logsFor('h1', dates), 'h1', habit(), TODAY)).toBe(7);
  });

  it('ignores days the habit is not scheduled on', () => {
    // MWF habit; today is Thursday. Done Wed 14, Mon 12, Fri 9, Wed 7. Tue/Thu/Sat/Sun untouched.
    const logs = logsFor('h1', [local(2026, 1, 14), local(2026, 1, 12), local(2026, 1, 9), local(2026, 1, 7)]);
    expect(calculateStreak(logs, 'h1', habit({ days: MWF }), TODAY)).toBe(4);
  });

  it('counts a missed scheduled day for a MWF habit', () => {
    // Done Wed 14, Mon 12. Missed Fri 9 (freeze). Missed Wed 7 → break.
    const logs = logsFor('h1', [local(2026, 1, 14), local(2026, 1, 12), local(2026, 1, 5)]);
    expect(calculateStreak(logs, 'h1', habit({ days: MWF }), TODAY)).toBe(2);
  });

  it('returns 0 with no logs', () => {
    expect(calculateStreak({}, 'h1', habit(), TODAY)).toBe(0);
  });

  it('only counts the requested habit', () => {
    const logs = { [dateStr(TODAY)]: ['other'], [dateStr(yesterday)]: ['h1', 'other'] };
    expect(calculateStreak(logs, 'h1', habit(), TODAY)).toBe(1);
  });
});

describe('isHabitActiveOn', () => {
  it('respects the days array (Sunday = index 0)', () => {
    const h = habit({ days: MWF });
    expect(isHabitActiveOn(h, local(2026, 1, 12))).toBe(true); // Mon
    expect(isHabitActiveOn(h, local(2026, 1, 13))).toBe(false); // Tue
    expect(isHabitActiveOn(h, local(2026, 1, 18))).toBe(false); // Sun
  });

  it('treats a missing days array as every day (legacy habits)', () => {
    expect(isHabitActiveOn(habit({ days: undefined as any }), local(2026, 1, 13))).toBe(true);
  });
});

describe('countThisWeek', () => {
  it('counts completions Mon–Sun of the reference week only', () => {
    const logs = logsFor('h1', [
      local(2026, 1, 11), // Sun, previous week
      local(2026, 1, 12), // Mon
      local(2026, 1, 14), // Wed
      local(2026, 1, 18), // Sun, this week
      local(2026, 1, 19), // Mon, next week
    ]);
    expect(countThisWeek(logs, 'h1', TODAY)).toBe(3);
  });
});

describe('getDayCompletionPercent', () => {
  it('returns the fraction of ACTIVE habits done that day', () => {
    const habits = [habit({ id: 'a' }), habit({ id: 'b' }), habit({ id: 'c', days: MWF })];
    const logs = { [dateStr(TODAY)]: ['a'] }; // Thursday: c is inactive → 1 of 2
    expect(getDayCompletionPercent(habits, logs, TODAY)).toBe(0.5);
  });

  it('returns 0 when nothing is scheduled (never NaN)', () => {
    expect(getDayCompletionPercent([], {}, TODAY)).toBe(0);
  });

  it('honours the identity filter', () => {
    const habits = [habit({ id: 'a', identityId: 'x' }), habit({ id: 'b', identityId: 'y' })];
    const logs = { [dateStr(TODAY)]: ['a'] };
    expect(getDayCompletionPercent(habits, logs, TODAY, 'x')).toBe(1);
    expect(getDayCompletionPercent(habits, logs, TODAY, 'y')).toBe(0);
  });
});

describe('sortByOrder', () => {
  it('sorts by order then name, without mutating input', () => {
    const input = [habit({ id: '1', name: 'B', order: 2 }), habit({ id: '2', name: 'A', order: 2 }), habit({ id: '3', name: 'Z', order: 1 })];
    const out = sortByOrder(input);
    expect(out.map((h) => h.id)).toEqual(['3', '2', '1']);
    expect(input.map((h) => h.id)).toEqual(['1', '2', '3']);
  });
});

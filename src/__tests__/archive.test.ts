import { isHabitActiveOn, liveHabits, archivedHabits, getActiveHabits, calculateStreak } from '../utils/habits';
import { longestStreakEver, bestStreakEver } from '../utils/evolution';
import { dateStr } from '../utils/dates';
import { Habit } from '../types';

const local = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
function habit(id: string, extra: Partial<Habit> = {}): Habit {
  return { id, name: id, weeklyGoal: 7, identityId: 'g', createdAt: '', days: [true, true, true, true, true, true, true], order: 1, ...extra };
}
function run(end: Date, n: number, id: string): Record<string, string[]> {
  const logs: Record<string, string[]> = {};
  for (let i = 0; i < n; i++) { const d = new Date(end); d.setDate(d.getDate() - i); logs[dateStr(d)] = [id]; }
  return logs;
}

describe('archived habits', () => {
  const archived = habit('a', { archivedAt: '2026-06-10' });

  it('are active before the archive date and never on/after it', () => {
    expect(isHabitActiveOn(archived, local(2026, 6, 9))).toBe(true);
    expect(isHabitActiveOn(archived, local(2026, 6, 10))).toBe(false);
    expect(isHabitActiveOn(archived, local(2026, 7, 1))).toBe(false);
  });

  it('leave the daily list but keep history and the best-ever streak', () => {
    const logs = run(local(2026, 6, 9), 40, 'a'); // 40-day run ending the day before archive
    expect(getActiveHabits([archived], local(2026, 6, 20))).toEqual([]);
    expect(liveHabits([archived, habit('b')]).map((h) => h.id)).toEqual(['b']);
    expect(archivedHabits([archived, habit('b')]).map((h) => h.id)).toEqual(['a']);
    expect(longestStreakEver(logs, 'a', archived, local(2026, 7, 1))).toBe(40);
    expect(bestStreakEver([archived], logs, local(2026, 7, 1))).toBe(40); // pet stage keeps its earned history
  });

  it('live streak freezes rather than breaking after archive', () => {
    const logs = run(local(2026, 6, 9), 12, 'a');
    // 3 weeks later: days since archive are unscheduled → neutral → streak still 12
    expect(calculateStreak(logs, 'a', archived, local(2026, 7, 1))).toBe(12);
  });
});

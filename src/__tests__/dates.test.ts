import { dateStr, startOfWeek, endOfMonth, getWeekDays, getMonthCells, isSameDay } from '../utils/dates';

// Local-time constructor so tests don't depend on the machine's timezone
const local = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

describe('dateStr', () => {
  it('uses local date, not UTC (late-night taps must not land on tomorrow)', () => {
    // 11:30pm local on Jan 15 — in UTC this may already be Jan 16
    expect(dateStr(local(2026, 1, 15, 23))).toBe('2026-01-15');
    expect(dateStr(local(2026, 1, 15, 0))).toBe('2026-01-15');
  });

  it('zero-pads month and day', () => {
    expect(dateStr(local(2026, 3, 7))).toBe('2026-03-07');
  });
});

describe('startOfWeek', () => {
  it('returns Monday 00:00 for any day of the week', () => {
    // Jan 18 2026 is a Sunday → week starts Mon Jan 12
    expect(dateStr(startOfWeek(local(2026, 1, 18)))).toBe('2026-01-12');
    // Monday stays Monday
    expect(dateStr(startOfWeek(local(2026, 1, 12)))).toBe('2026-01-12');
    // Wednesday
    expect(dateStr(startOfWeek(local(2026, 1, 14)))).toBe('2026-01-12');
    expect(startOfWeek(local(2026, 1, 14)).getHours()).toBe(0);
  });

  it('crosses month and year boundaries', () => {
    // Jan 1 2026 is a Thursday → Mon Dec 29 2025
    expect(dateStr(startOfWeek(local(2026, 1, 1)))).toBe('2025-12-29');
  });
});

describe('endOfMonth', () => {
  it('handles leap years and 30/31-day months', () => {
    expect(endOfMonth(local(2024, 2, 10)).getDate()).toBe(29);
    expect(endOfMonth(local(2026, 2, 10)).getDate()).toBe(28);
    expect(endOfMonth(local(2026, 4, 10)).getDate()).toBe(30);
    expect(endOfMonth(local(2026, 12, 10)).getDate()).toBe(31);
  });
});

describe('getWeekDays', () => {
  it('returns Mon..Sun containing the reference date', () => {
    const days = getWeekDays(local(2026, 1, 15));
    expect(days).toHaveLength(7);
    expect(dateStr(days[0])).toBe('2026-01-12');
    expect(dateStr(days[6])).toBe('2026-01-18');
  });
});

describe('getMonthCells', () => {
  it('pads to full Monday-start weeks', () => {
    // Feb 2026 starts on a Sunday → 6 leading nulls; 28 days → 34 → pad to 35
    const cells = getMonthCells(local(2026, 2, 1));
    expect(cells.length % 7).toBe(0);
    expect(cells.slice(0, 6).every((c) => c === null)).toBe(true);
    expect(cells[6] && dateStr(cells[6])).toBe('2026-02-01');
    expect(cells.filter(Boolean)).toHaveLength(28);
  });
});

describe('isSameDay', () => {
  it('ignores time of day', () => {
    expect(isSameDay(local(2026, 1, 15, 1), local(2026, 1, 15, 23))).toBe(true);
    expect(isSameDay(local(2026, 1, 15, 23), local(2026, 1, 16, 0))).toBe(false);
  });
});

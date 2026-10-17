import { buildWidgetProps, buildWeek, nextMidnight } from '../utils/widgetSync';
import { themes } from '../theme/colors';
import { AppState, Habit } from '../types';
import { dateStr } from '../utils/dates';

const local = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);
const TODAY = local(2026, 1, 15); // Thursday
const MWF = [false, true, false, true, false, true, false];

function habit(id: string, name: string, extra: Partial<Habit> = {}): Habit {
  return { id, name, weeklyGoal: 7, identityId: 'general', createdAt: '', days: [true, true, true, true, true, true, true], order: 1, ...extra };
}

function state(overrides: Partial<AppState>): AppState {
  return {
    theme: 'light', sfxEnabled: true, hapticsEnabled: true, notificationsEnabled: false,
    notificationTime: { hour: 9, minute: 0 }, identities: [], currentIdentityFilter: 'all',
    habits: [], logs: {}, marks: {}, dayPlanTimes: {}, dayPlanSchedules: {}, notes: {},
    routineStepLogs: {}, hasCompletedOnboarding: true, hasSeenSwipeHint: true,
    petSpecies: 'hawk', petHat: 'none', activeFasts: {}, ...overrides,
  };
}

describe('buildWidgetProps', () => {
  it('counts only habits active today and puts undone first', () => {
    const s = state({
      habits: [habit('a', 'Meditate', { order: 1 }), habit('b', 'Read', { order: 2 }), habit('c', 'Gym', { days: MWF, order: 3 })],
      logs: { [dateStr(TODAY)]: ['a'] },
    });
    const p = buildWidgetProps(s, themes.ladyhawke, TODAY);
    expect(p.total).toBe(2); // Gym is MWF, today is Thursday
    expect(p.done).toBe(1);
    expect(p.habits.map((h) => h.name)).toEqual(['Read', 'Meditate']);
    expect(p.date).toBe('2026-01-15');
  });

  it('carries the theme colours and the pet mood', () => {
    const s = state({ habits: [habit('a', 'A'), habit('b', 'B')], logs: { [dateStr(TODAY)]: ['a', 'b'] } });
    const p = buildWidgetProps(s, themes.ladyhawke, TODAY);
    expect(p.accent).toBe(themes.ladyhawke.accent);
    expect(p.bg).toBe(themes.ladyhawke.bg);
    expect(p.mood).toBe('thrilled');
  });

  it('reports the best current streak across habits', () => {
    const logs: Record<string, string[]> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(TODAY); d.setDate(d.getDate() - i);
      logs[dateStr(d)] = i < 3 ? ['a', 'b'] : ['a'];
    }
    const p = buildWidgetProps(state({ habits: [habit('a', 'A'), habit('b', 'B')], logs }), themes.light, TODAY);
    expect(p.bestStreak).toBe(12);
  });

  it('is empty-safe', () => {
    const p = buildWidgetProps(state({}), themes.light, TODAY);
    expect(p.total).toBe(0);
    expect(p.done).toBe(0);
    expect(p.habits).toEqual([]);
    expect(p.mood).toBe('waiting for you');
  });

  it("tomorrow's entry shows tomorrow's schedule at zero done", () => {
    const s = state({ habits: [habit('gym', 'Gym', { days: MWF })], logs: { [dateStr(TODAY)]: ['gym'] } });
    const tomorrow = nextMidnight(TODAY); // Friday 00:00
    const p = buildWidgetProps(s, themes.light, tomorrow);
    expect(p.date).toBe('2026-01-16');
    expect(p.total).toBe(1);
    expect(p.done).toBe(0);
  });
});

describe('nextMidnight', () => {
  it('is 00:00 local of the following day, across DST', () => {
    const m = nextMidnight(local(2026, 3, 7, 23)); // US DST starts Mar 8 2026
    expect(dateStr(m)).toBe('2026-03-08');
    expect(m.getHours()).toBe(0);
  });
});

describe('buildWeek', () => {
  it('returns Mon..Sun with today flagged and future days empty', () => {
    const s = state({ habits: [habit('a', 'A'), habit('b', 'B')], logs: { '2026-01-12': ['a', 'b'], '2026-01-14': ['a'], '2026-01-17': ['a'] } });
    const w = buildWeek(s, TODAY); // Thu Jan 15
    expect(w.map((d) => d.label).join('')).toBe('MTWTFSS');
    expect(w[0].pct).toBe(1); // Mon
    expect(w[2].pct).toBe(0.5); // Wed
    expect(w[3].isToday).toBe(true); // Thu
    expect(w[5].isFuture).toBe(true); // Sat — a log exists but it's in the future, so hidden
    expect(w[5].pct).toBe(0);
  });

  it('includes the pet image when provided', () => {
    const p = buildWidgetProps(state({}), themes.light, TODAY, 'file:///group/pet-hawk-none-idle.png');
    expect(p.petImage).toBe('file:///group/pet-hawk-none-idle.png');
    expect(buildWidgetProps(state({}), themes.light, TODAY).petImage).toBe('');
  });
});

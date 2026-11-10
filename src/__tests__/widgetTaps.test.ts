import { applyHabitDoneChanges, collectWidgetTaps, planWidgetTaps, WidgetTap } from '../utils/widgetTaps';
import { buildWidgetProps } from '../utils/widgetSync';
import { themes } from '../theme/colors';
import { AppState, Habit } from '../types';

const NOW = new Date(2026, 10, 12, 9); // Thu 12 Nov 2026, 9am local
const TODAY = '2026-11-12';
const YESTERDAY = '2026-11-11';

function habit(id: string, extra: Partial<Habit> = {}): Habit {
  return { id, name: id, weeklyGoal: 7, identityId: 'g', createdAt: '', days: [true, true, true, true, true, true, true], order: 1, ...extra };
}

function state(overrides: Partial<AppState> = {}): AppState {
  return {
    theme: 'light', sfxEnabled: true, hapticsEnabled: true, notificationsEnabled: false,
    notificationTime: { hour: 9, minute: 0 }, identities: [], currentIdentityFilter: 'all',
    habits: [habit('a'), habit('b')], logs: {}, marks: {}, dayPlanSchedules: {}, notes: {},
    routineStepLogs: {}, hasCompletedOnboarding: true, hasSeenSwipeHint: true,
    petSpecies: 'hawk', petHat: 'none', activeFasts: {}, petStageSeen: 0, ...overrides,
  };
}

const tap = (id: string, date: string, done: boolean, ts: number): WidgetTap => ({ id, date, done, ts });

describe('collectWidgetTaps', () => {
  it('gathers taps from every timeline entry, oldest first', () => {
    const taps = collectWidgetTaps([
      { props: { taps: [tap('a', TODAY, true, 30)] } },
      { props: { taps: [tap('b', TODAY, true, 10)] } },
    ]);
    expect(taps.map((t) => t.ts)).toEqual([10, 30]);
  });

  it('ignores entries without taps and malformed records', () => {
    const taps = collectWidgetTaps([
      { props: {} },
      {},
      { props: { taps: [{ id: 'a' }, { id: '', date: TODAY, done: true, ts: 1 }, { id: 'a', date: 'today', done: true, ts: 1 }, tap('a', TODAY, true, 2)] } },
    ] as any);
    expect(taps).toEqual([tap('a', TODAY, true, 2)]);
  });
});

describe('planWidgetTaps', () => {
  it('applies a tick made on the widget', () => {
    expect(planWidgetTaps(state(), [tap('a', TODAY, true, 1)], NOW)).toEqual([{ habitId: 'a', date: TODAY, done: true }]);
  });

  it('last tap wins per habit and day (tick then untick = nothing to do)', () => {
    const taps = [tap('a', TODAY, true, 1), tap('a', TODAY, false, 2)];
    expect(planWidgetTaps(state(), taps, NOW)).toEqual([]);
  });

  it('skips taps that already match the app', () => {
    const s = state({ logs: { [TODAY]: ['a'] } });
    expect(planWidgetTaps(s, [tap('a', TODAY, true, 1)], NOW)).toEqual([]);
  });

  it('keeps last night\'s taps but drops stale and future ones', () => {
    const taps = [tap('a', YESTERDAY, true, 1), tap('a', '2026-11-01', true, 2), tap('b', '2026-11-13', true, 3)];
    expect(planWidgetTaps(state(), taps, NOW)).toEqual([{ habitId: 'a', date: YESTERDAY, done: true }]);
  });

  it('drops taps for deleted or archived habits', () => {
    const s = state({ habits: [habit('a', { archivedAt: TODAY })] });
    expect(planWidgetTaps(s, [tap('a', TODAY, true, 1), tap('gone', TODAY, true, 2)], NOW)).toEqual([]);
  });
});

describe('applyHabitDoneChanges', () => {
  it('sets (not toggles) completion and clears skip/fail marks', () => {
    const s = state({ logs: { [TODAY]: ['b'] }, marks: { [TODAY]: { skip: ['a'], fail: [] } } });
    const once = applyHabitDoneChanges(s, [{ habitId: 'a', date: TODAY, done: true }]);
    const twice = applyHabitDoneChanges(once, [{ habitId: 'a', date: TODAY, done: true }]);
    expect(twice.logs[TODAY].sort()).toEqual(['a', 'b']);
    expect(twice.marks[TODAY].skip).toEqual([]);
    const undone = applyHabitDoneChanges(twice, [{ habitId: 'b', date: TODAY, done: false }]);
    expect(undone.logs[TODAY]).toEqual(['a']);
  });
});

describe('widget props', () => {
  it('carry habit ids and an empty tap queue', () => {
    const p = buildWidgetProps(state(), themes.light, NOW);
    expect(p.habits.map((h) => h.id)).toEqual(['a', 'b']);
    expect(p.taps).toEqual([]);
  });
});

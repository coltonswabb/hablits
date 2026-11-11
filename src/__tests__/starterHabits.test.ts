import { addStarterHabits, availableStarterKeys, STARTER_GROUPS } from '../utils/starterHabits';
import { AppState } from '../types';

const base = {
  identities: [{ id: 'general', name: 'General', color: '#3ddc97' }],
  habits: [],
} as unknown as AppState;

const idMaker = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe('starter habits', () => {
  it('has unique keys and names', () => {
    const all = STARTER_GROUPS.flatMap((g) => g.habits);
    expect(new Set(all.map((h) => h.key)).size).toBe(all.length);
    expect(new Set(all.map((h) => h.name.toLowerCase())).size).toBe(all.length);
    all.forEach((h) => {
      expect(h.weeklyGoal).toBeGreaterThanOrEqual(1);
      expect(h.weeklyGoal).toBeLessThanOrEqual(7);
    });
  });

  it('adds the chosen habits under an identity named after the group', () => {
    const next = addStarterHabits(base, ['water', 'read'], idMaker());
    expect(next.habits.map((h) => h.name)).toEqual(['Drink water', 'Read']);
    const health = next.identities.find((i) => i.name === 'Health');
    const mind = next.identities.find((i) => i.name === 'Mind');
    expect(next.habits[0].identityId).toBe(health?.id);
    expect(next.habits[1].identityId).toBe(mind?.id);
    expect(next.habits[0].target).toEqual({ amount: 8, unit: 'glasses' });
    expect(next.habits.map((h) => h.order)).toEqual([1, 2]);
    expect(next.habits[0].days).toHaveLength(7);
  });

  it('reuses an identity that already has the group name', () => {
    const withHealth = { ...base, identities: [...base.identities, { id: 'h1', name: 'health', color: '#000000' }] } as AppState;
    const next = addStarterHabits(withHealth, ['stretch'], idMaker());
    expect(next.identities).toHaveLength(2);
    expect(next.habits[0].identityId).toBe('h1');
  });

  it('skips habits the user already has, and unknown keys', () => {
    const once = addStarterHabits(base, ['water'], idMaker());
    const twice = addStarterHabits(once, ['water', 'nope'], idMaker());
    expect(twice).toBe(once);
    expect(availableStarterKeys(once).has('water')).toBe(false);
    expect(availableStarterKeys(once).has('walk')).toBe(true);
  });

  it('offers a starter again once the matching habit is archived', () => {
    const once = addStarterHabits(base, ['water'], idMaker());
    const archived = { ...once, habits: once.habits.map((h) => ({ ...h, archivedAt: '2026-11-01' })) } as AppState;
    expect(availableStarterKeys(archived).has('water')).toBe(true);
  });

  it('adds quit starters as quit habits under Health', () => {
    const next = addStarterHabits(base, ['quit-soda'], idMaker(), new Date(2026, 10, 11));
    const soda = next.habits[0];
    expect(soda.name).toBe('No soda');
    expect(soda.quit).toEqual({ since: '2026-11-11', best: 0, slips: [] });
    expect(next.identities.find((i) => i.id === soda.identityId)?.name).toBe('Health');
  });

  it('files Health and Quit starters under one Health identity', () => {
    const next = addStarterHabits(base, ['workout', 'quit-soda'], idMaker());
    expect(next.identities.filter((i) => i.name === 'Health')).toHaveLength(1);
    expect(new Set(next.habits.map((h) => h.identityId)).size).toBe(1);
  });

  it('returns the same state when nothing is chosen', () => {
    expect(addStarterHabits(base, [], idMaker())).toBe(base);
  });
});

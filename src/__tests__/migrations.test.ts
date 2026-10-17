import { migrateState, SCHEMA_VERSION } from '../state/migrations';
import { AppState } from '../types';

const defaults: AppState = {
  theme: 'light',
  sfxEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: false,
  notificationTime: { hour: 9, minute: 0 },
  identities: [{ id: 'general', name: 'General', color: '#3ddc97' }],
  currentIdentityFilter: 'all',
  habits: [],
  logs: {},
  marks: {},
  dayPlanSchedules: {},
  notes: {},
  routineStepLogs: {},
  hasCompletedOnboarding: false,
  hasSeenSwipeHint: false,
  petSpecies: 'blob',
  petHat: 'none',
  activeFasts: {},
  petStageSeen: 0,
};

describe('migrateState', () => {
  it('upgrades a 1.0 blob (no schemaVersion) and preserves user data', () => {
    const v0 = {
      theme: 'ladyhawke',
      habits: [{ id: 'h1', name: 'Read', steps: [{ id: 's1', name: 'Open book', order: 1 }] }],
      logs: { '2026-01-10': ['h1'] },
      identities: [{ id: 'i1', name: 'Writer', color: '#fff' }],
      petSpecies: 'hawk',
    };
    const out = migrateState(v0, defaults);

    // data kept
    expect(out.logs).toEqual({ '2026-01-10': ['h1'] });
    expect(out.identities[0].name).toBe('Writer');
    expect(out.petSpecies).toBe('hawk');
    // routine flag backfilled
    expect(out.habits[0].isRoutine).toBe(true);
    // user with habits skips onboarding
    expect(out.hasCompletedOnboarding).toBe(true);
    // missing containers filled
    expect(out.notes).toEqual({});
    expect(out.activeFasts).toEqual({});
    expect(out.hapticsEnabled).toBe(true);
    expect(out.petHat).toBe('none');
    // version marker is not leaked into app state
    expect((out as any).schemaVersion).toBeUndefined();
  });

  it('is a no-op for a current-version blob', () => {
    const current = { ...defaults, theme: 'cosmic', schemaVersion: SCHEMA_VERSION };
    const out = migrateState(current, defaults);
    expect(out.theme).toBe('cosmic');
    expect(out).toEqual({ ...defaults, theme: 'cosmic' });
  });

  it('never returns a partial state, even from garbage', () => {
    for (const junk of [null, undefined, 42, 'x', [], {}]) {
      const out = migrateState(junk, defaults);
      expect(Object.keys(out).sort()).toEqual(Object.keys(defaults).sort());
    }
  });

  it('a brand-new user with no habits still sees onboarding', () => {
    expect(migrateState({ habits: [] }, defaults).hasCompletedOnboarding).toBe(false);
  });
});

describe('migrateState hardening', () => {
  it('drops null habit entries and never lets null override a default', () => {
    const out = migrateState({ schemaVersion: 3, habits: [null, { id: 'h', name: 'x' }], logs: null, identities: [] } as any, defaults);
    expect(out.habits).toHaveLength(1);
    expect(out.logs).toEqual({});
    expect(out.identities.length).toBeGreaterThan(0);
  });
});

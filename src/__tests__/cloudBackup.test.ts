jest.mock('../../modules/icloud-backup', () => ({
  isICloudAvailable: jest.fn(async () => true),
  writeICloudFile: jest.fn(async () => 'file://x'),
  readICloudFile: jest.fn(async () => null),
  iCloudFileModifiedAt: jest.fn(async () => null),
}));

import { makeEnvelope, parseEnvelope, shouldBackup, cloudHasMore } from '../utils/cloudBackup';
import { SCHEMA_VERSION } from '../state/migrations';
import { AppState } from '../types';

function state(o: Partial<AppState> = {}): AppState {
  return {
    theme: 'light', sfxEnabled: true, hapticsEnabled: true, notificationsEnabled: false, notificationTime: { hour: 9, minute: 0 },
    identities: [], currentIdentityFilter: 'all', habits: [], logs: {}, marks: {}, dayPlanSchedules: {}, notes: {}, routineStepLogs: {},
    hasCompletedOnboarding: true, hasSeenSwipeHint: true, petSpecies: 'blob', petHat: 'none', activeFasts: {}, petStageSeen: 0, ...o,
  };
}
const habit = { id: 'a', name: 'A', weeklyGoal: 7, identityId: 'g', createdAt: '', days: [true, true, true, true, true, true, true], order: 1 };

describe('cloud backup envelope', () => {
  it('round-trips and carries the schema version', () => {
    const env = makeEnvelope(state({ habits: [habit] }), new Date('2026-06-01T10:00:00Z'), '1.3.0');
    expect(env.schemaVersion).toBe(SCHEMA_VERSION);
    const back = parseEnvelope(JSON.stringify(env))!;
    expect(back.data.habits).toHaveLength(1);
    expect(back.exportedAt).toBe('2026-06-01T10:00:00.000Z');
  });
  it('rejects garbage', () => {
    expect(parseEnvelope(null)).toBeNull();
    expect(parseEnvelope('not json')).toBeNull();
    expect(parseEnvelope('{"data":{"nope":1}}')).toBeNull();
  });
});

describe('shouldBackup', () => {
  const now = new Date('2026-06-01T12:00:00Z');
  it('skips when there is nothing to protect', () => {
    expect(shouldBackup(state(), undefined, now)).toBe(false);
  });
  it('backs up when never done, and at most every 6h', () => {
    const s = state({ habits: [habit] });
    expect(shouldBackup(s, undefined, now)).toBe(true);
    expect(shouldBackup(s, '2026-06-01T09:00:00Z', now)).toBe(false);
    expect(shouldBackup(s, '2026-06-01T05:00:00Z', now)).toBe(true);
    expect(shouldBackup(s, 'garbage', now)).toBe(true);
  });
});

describe('cloudHasMore', () => {
  it('is only true for an empty local state with a non-empty cloud', () => {
    const cloud = makeEnvelope(state({ habits: [habit], logs: { '2026-05-01': ['a'] } }));
    expect(cloudHasMore(state(), cloud)).toBe(true);
    expect(cloudHasMore(state({ habits: [habit] }), cloud)).toBe(false);
    expect(cloudHasMore(state(), makeEnvelope(state()))).toBe(false);
  });
});

describe('mayOverwriteCloud (two-device guard)', () => {
  const { mayOverwriteCloud } = require('../utils/cloudBackup');
  const big = makeEnvelope(state({ habits: [habit, { ...habit, id: 'b' }], logs: { '2026-05-01': ['a'], '2026-05-02': ['a'] } }), new Date('2026-06-01T10:00:00Z'));
  it('allows when there is no cloud copy', () => {
    expect(mayOverwriteCloud(state({ habits: [habit] }), null, undefined)).toBe(true);
  });
  it('allows overwriting our own earlier write', () => {
    expect(mayOverwriteCloud(state({ habits: [habit] }), big, '2026-06-01T10:00:00Z')).toBe(true);
  });
  it('refuses when another device wrote a newer, larger backup', () => {
    expect(mayOverwriteCloud(state({ habits: [habit] }), big, '2026-05-30T10:00:00Z')).toBe(false);
    expect(mayOverwriteCloud(state({ habits: [habit] }), big, undefined)).toBe(false);
  });
  it('allows when ours is at least as big', () => {
    const mine = state({ habits: [habit, { ...habit, id: 'b' }, { ...habit, id: 'c' }], logs: { '2026-05-01': ['a'] } });
    expect(mayOverwriteCloud(mine, big, undefined)).toBe(true);
  });
});

// ============================================
// STATE MIGRATIONS
// ============================================
// Every saved blob carries a `schemaVersion`. When the shape of AppState
// changes, bump SCHEMA_VERSION and add a step to `migrations` that upgrades
// from the previous version. Steps run in order, so a very old blob walks
// through every step until it's current.
//
// Version history:
//   0 — anything saved before versioning existed (1.0 App Store build)
//   1 — adds schemaVersion; folds in all the ad-hoc 1.0 backfills
//   2 — adds petStageSeen (pet evolution)
//   3 — folds legacy dayPlanTimes into dayPlanSchedules and drops it
// ============================================

import { AppState } from '../types';

export const SCHEMA_VERSION = 3;

type AnyState = Record<string, any>;

/** Upgrade from version N to N+1. Index = the version being upgraded FROM. */
const migrations: Array<(s: AnyState) => AnyState> = [
  // 0 -> 1: the backfills that used to live inline in LOAD_STATE / loadState
  (s) => {
    const habits = Array.isArray(s.habits)
      ? s.habits.filter((h: any) => h && typeof h === 'object').map((habit: any) => {
          // A habit with steps is a routine even if the flag was never set
          if (Array.isArray(habit.steps) && habit.steps.length > 0 && !habit.isRoutine) {
            return { ...habit, isRoutine: true };
          }
          return habit;
        })
      : [];

    return {
      ...s,
      habits,
      notes: s.notes || {},
      dayPlanSchedules: s.dayPlanSchedules || {},
      routineStepLogs: s.routineStepLogs || {},
      activeFasts: s.activeFasts || {},
      hapticsEnabled: s.hapticsEnabled !== undefined ? s.hapticsEnabled : true,
      hasSeenSwipeHint: s.hasSeenSwipeHint !== undefined ? s.hasSeenSwipeHint : false,
      // Existing users with habits have obviously already used the app
      hasCompletedOnboarding:
        s.hasCompletedOnboarding !== undefined
          ? s.hasCompletedOnboarding
          : Array.isArray(s.habits) && s.habits.length > 0,
      petSpecies: s.petSpecies || 'blob',
      petHat: s.petHat || 'none',
    };
  },
  // 1 -> 2: pet evolution. Existing users start at 0 so they get congratulated
  // once for whatever stage their history has already earned.
  (s) => ({ ...s, petStageSeen: typeof s.petStageSeen === 'number' ? s.petStageSeen : 0 }),
  // 2 -> 3: dayPlanTimes ({habitId: "HH:MM"}) predates dayPlanSchedules. Any
  // time that has no schedule yet becomes a 30-minute daily schedule.
  (s) => {
    const { dayPlanTimes, ...rest } = s;
    const dayPlanSchedules = { ...(rest.dayPlanSchedules || {}) };
    if (dayPlanTimes && typeof dayPlanTimes === 'object') {
      for (const [habitId, time] of Object.entries(dayPlanTimes as Record<string, unknown>)) {
        if (typeof time === 'string' && !dayPlanSchedules[habitId]) {
          dayPlanSchedules[habitId] = { time, duration: 30, recurring: 'daily' };
        }
      }
    }
    return { ...rest, dayPlanSchedules };
  },
];

/**
 * Bring a parsed storage blob up to the current schema and fill any gaps
 * from `defaults`, so the reducer always receives a complete AppState.
 */
export function migrateState(parsed: unknown, defaults: AppState): AppState {
  let s: AnyState =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? { ...(parsed as AnyState) } : {};

  let version = typeof s.schemaVersion === 'number' ? s.schemaVersion : 0;

  while (version < SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) break; // shouldn't happen; stops an infinite loop if versions get out of sync
    s = step(s);
    version++;
  }

  // Strip the version marker — it's a storage concern, not app state —
  // and backfill anything still missing with defaults.
  const { schemaVersion: _ignored, ...rest } = s;
  // Per-key backfill: an explicit null (hand-edited backup) must not override a default
  const out: AnyState = { ...defaults };
  for (const [k, v] of Object.entries(rest)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  // Record-typed fields must be objects or the reducer will throw on Object.entries
  for (const k of ['logs', 'marks', 'notes', 'dayPlanSchedules', 'routineStepLogs', 'activeFasts'] as const) {
    if (typeof out[k] !== 'object' || Array.isArray(out[k])) out[k] = {};
  }
  out.habits = Array.isArray(out.habits) ? out.habits.filter((h: any) => h && typeof h === 'object' && typeof h.id === 'string') : [];
  if (!Array.isArray(out.identities) || out.identities.length === 0) out.identities = defaults.identities;
  return out as AppState;
}

// ============================================
// STARTER HABITS
// ============================================
// A short list of ready-made habits a new user can pick from, so the first
// screen is not an empty list. Everything here is local data; adding a
// starter habit creates an ordinary habit the user can edit or archive.
// ============================================

import { AppState, Habit, HabitTarget, Identity } from '../types';
import { newQuitTracker } from './smartHabits';

export type StarterGroup = {
  /** Heading shown in the picker */
  name: string;
  /** One line under the heading, for groups that need explaining */
  hint?: string;
  /** The identity these habits are filed under; created if the user has none of this name */
  identity: string;
  color: string;
  habits: StarterHabit[];
};

export type StarterHabit = {
  /** Stable id for selection; never shown */
  key: string;
  name: string;
  emoji: string;
  weeklyGoal: number;
  target?: HabitTarget;
  /** A quit habit: no daily tick, it counts the days since the last slip */
  quit?: boolean;
};

export const STARTER_GROUPS: StarterGroup[] = [
  {
    name: 'Health',
    identity: 'Health',
    color: '#3ddc97',
    habits: [
      { key: 'workout', name: 'Workout', emoji: '💪', weeklyGoal: 4 },
      { key: 'water', name: 'Drink water', emoji: '💧', weeklyGoal: 7, target: { amount: 8, unit: 'glasses' } },
      { key: 'fiber', name: 'Hit fiber goal', emoji: '🥦', weeklyGoal: 7, target: { amount: 30, unit: 'g' } },
      { key: 'walk', name: 'Walk', emoji: '🚶', weeklyGoal: 5, target: { amount: 20, unit: 'min' } },
      { key: 'stretch', name: 'Stretch', emoji: '🧘', weeklyGoal: 5 },
      { key: 'wake', name: 'Wake up on time', emoji: '⏰', weeklyGoal: 7 },
      { key: 'sleep', name: 'In bed by 11', emoji: '🌙', weeklyGoal: 7 },
    ],
  },
  {
    name: 'Mind',
    identity: 'Mind',
    color: '#6c8cff',
    habits: [
      { key: 'meditate', name: 'Meditate', emoji: '🫧', weeklyGoal: 7, target: { amount: 5, unit: 'min' } },
      { key: 'read', name: 'Read', emoji: '📖', weeklyGoal: 5, target: { amount: 10, unit: 'pages' } },
      { key: 'journal', name: 'Journal', emoji: '✍️', weeklyGoal: 5 },
      { key: 'no-phone', name: 'No phone in bed', emoji: '📵', weeklyGoal: 7 },
    ],
  },
  {
    name: 'Home',
    identity: 'Home',
    color: '#f59e0b',
    habits: [
      { key: 'bed', name: 'Make the bed', emoji: '🛏️', weeklyGoal: 7 },
      { key: 'tidy', name: 'Tidy up', emoji: '🧹', weeklyGoal: 5, target: { amount: 10, unit: 'min' } },
      { key: 'cook', name: 'Cook at home', emoji: '🍳', weeklyGoal: 4 },
      { key: 'call', name: 'Call someone you love', emoji: '📞', weeklyGoal: 1 },
    ],
  },
  {
    name: 'Quit',
    hint: 'Things to stay away from. No daily tick: these count the days since your last slip.',
    identity: 'Health',
    color: '#ef4444',
    habits: [
      { key: 'quit-soda', name: 'No soda', emoji: '🥤', weeklyGoal: 7, quit: true },
      { key: 'quit-alcohol', name: 'No alcohol', emoji: '🍺', weeklyGoal: 7, quit: true },
      { key: 'quit-vaping', name: 'No vaping', emoji: '💨', weeklyGoal: 7, quit: true },
    ],
  },
];

const EVERY_DAY = [true, true, true, true, true, true, true];

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Starter habits the user does not already have (matched by name, ignoring archived ones). */
export function availableStarterKeys(state: AppState): Set<string> {
  const live = state.habits.filter((h) => !h.archivedAt);
  const keys = new Set<string>();
  for (const group of STARTER_GROUPS) {
    for (const starter of group.habits) {
      if (!live.some((h) => sameName(h.name, starter.name))) keys.add(starter.key);
    }
  }
  return keys;
}

/**
 * Adds the chosen starter habits. Each goes under its group's identity,
 * reusing one of that name if it exists. Habits the user already has
 * (by name) are skipped, so picking the same one twice is harmless.
 */
export function addStarterHabits(
  state: AppState,
  keys: string[],
  makeId: () => string,
  now: Date = new Date()
): AppState {
  const wanted = new Set(keys);
  const stillNeeded = availableStarterKeys(state);
  const identities: Identity[] = [...state.identities];
  const habits: Habit[] = [...state.habits];

  for (const group of STARTER_GROUPS) {
    const chosen = group.habits.filter((s) => wanted.has(s.key) && stillNeeded.has(s.key));
    if (chosen.length === 0) continue;

    let identity = identities.find((i) => sameName(i.name, group.identity));
    if (!identity) {
      // Two groups can share an identity; it takes the colour of whichever is added first
      identity = { id: makeId(), name: group.identity, color: group.color };
      identities.push(identity);
    }

    for (const starter of chosen) {
      habits.push({
        id: makeId(),
        name: starter.name,
        weeklyGoal: starter.weeklyGoal,
        identityId: identity.id,
        createdAt: now.toISOString(),
        days: [...EVERY_DAY],
        order: habits.length + 1,
        ...(starter.target ? { target: { ...starter.target } } : {}),
        ...(starter.quit ? { quit: newQuitTracker(now) } : {}),
      });
    }
  }

  if (habits.length === state.habits.length) return state;
  return { ...state, identities, habits };
}

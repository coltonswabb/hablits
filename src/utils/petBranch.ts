// ============================================
// PET BRANCH
// ============================================
// Decides which way a pet evolves when it reaches the adult stage, from the
// kind of habits its owner has actually been completing.
//
// Habits are sorted by the identity they belong to: an identity whose name
// sounds like fitness or health counts toward 'body', one that sounds like
// learning or calm counts toward 'mind'. If neither makes up at least half of
// recent completions, the pet takes the balanced 'heart' path.
// ============================================

import { AppState } from '../types';
import { PetBranch } from '../pets/forms';
import { dateStr } from './dates';

/** How far back to look */
export const BRANCH_WINDOW_DAYS = 30;
/** A branch needs at least this share of recent completions to win */
export const BRANCH_MAJORITY = 0.5;

const BODY_WORDS = ['health', 'fit', 'body', 'athlet', 'gym', 'run', 'sport', 'strength', 'workout', 'exercise', 'move', 'diet', 'nutrition', 'sleep'];
const MIND_WORDS = ['mind', 'read', 'learn', 'study', 'student', 'writ', 'creat', 'art', 'music', 'meditat', 'focus', 'calm', 'think', 'code', 'language'];

/** Which branch an identity counts toward, or null if it is neutral. */
export function branchForIdentity(name: string): PetBranch | null {
  const lower = name.toLowerCase();
  if (BODY_WORDS.some((word) => lower.includes(word))) return 'body';
  if (MIND_WORDS.some((word) => lower.includes(word))) return 'mind';
  return null;
}

/** Completions per branch over the last BRANCH_WINDOW_DAYS days. */
export function branchTally(state: AppState, now: Date = new Date()): { body: number; mind: number; total: number } {
  const identityBranch = new Map(state.identities.map((i) => [i.id, branchForIdentity(i.name)]));
  const habitBranch = new Map(state.habits.map((h) => [h.id, identityBranch.get(h.identityId) ?? null]));

  const tally = { body: 0, mind: 0, total: 0 };
  const day = new Date(now);
  for (let i = 0; i < BRANCH_WINDOW_DAYS; i++) {
    for (const habitId of state.logs[dateStr(day)] || []) {
      tally.total += 1;
      const branch = habitBranch.get(habitId);
      if (branch === 'body') tally.body += 1;
      else if (branch === 'mind') tally.mind += 1;
    }
    day.setDate(day.getDate() - 1);
  }
  return tally;
}

/** The branch a pet should take, given what its owner has been doing lately. */
export function decideBranch(state: AppState, now: Date = new Date()): PetBranch {
  const { body, mind, total } = branchTally(state, now);
  if (total === 0) return 'heart';
  if (body / total >= BRANCH_MAJORITY && body > mind) return 'body';
  if (mind / total >= BRANCH_MAJORITY && mind > body) return 'mind';
  return 'heart';
}

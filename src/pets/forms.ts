// ============================================
// PET FORMS
// ============================================
// Which drawing a pet uses at each stage of its life.
//
// A pet grows through four stages (see utils/evolution: 1, 3 and 7-day
// streaks). From the adult stage on, a pet with an evolution line splits into
// branches, and which branch it takes depends on the kind of habits its owner
// has been keeping (see utils/petBranch).
//
// Every pet has a pixel sprite and changes form as it grows: a baby, a child,
// then an adult and a final form on one of three paths.
// ============================================

import { PetSpecies } from '../types';
import { SPRITES, SpriteDef } from './sprites';
import type { EvolutionLine, PetBranch } from './line';
import { LINES_A } from './linesA';
import { LINES_B } from './linesB';
import { LINES_C } from './linesC';
import { LINES_D } from './linesD';

export type { PetBranch } from './line';
export const PET_BRANCHES: PetBranch[] = ['body', 'mind', 'heart'];

/** The stage at which a pet's branch is decided, and from which it shows */
export const BRANCH_STAGE = 2;

const LINES: Partial<Record<PetSpecies, EvolutionLine>> = {
  blob: {
    baby: SPRITES.pip,
    child: SPRITES.blob,
    adult: { body: SPRITES.stout, mind: SPRITES.wisp, heart: SPRITES.bloom },
    final: { body: SPRITES.bulwark, mind: SPRITES.lumen, heart: SPRITES.evergrow },
  },
  ...LINES_A,
  ...LINES_B,
  ...LINES_C,
  ...LINES_D,
};

/** Every form of every pet, for checks that have to cover all of them */
export function allForms(): SpriteDef[] {
  return Object.values(LINES).flatMap((line) => [
    line.baby,
    line.child,
    ...Object.values(line.adult),
    ...Object.values(line.final),
  ]);
}

/** True if this pet changes form as it grows. */
export function hasEvolutionLine(species: PetSpecies): boolean {
  return species in LINES;
}

/**
 * The drawing for a pet at a stage, or null if it has no pixel sprite yet.
 * Before a branch has been decided, the adult and final stages show the
 * 'heart' form.
 */
export function petForm(species: PetSpecies, stage: number, branch?: PetBranch | null): SpriteDef | null {
  const line = LINES[species];
  if (!line) return null;
  if (stage <= 0) return line.baby;
  if (stage === 1) return line.child;
  const path = branch ?? 'heart';
  return stage === 2 ? line.adult[path] : line.final[path];
}

/** What each path is called, and what it does to a pet, for the pickers. */
export const BRANCH_LABEL: Record<PetBranch, string> = { body: 'Body', mind: 'Mind', heart: 'Heart' };
export const BRANCH_HINT: Record<PetBranch, string> = {
  body: 'Bigger and tougher',
  mind: 'Bright and clever',
  heart: 'Kind and blooming',
};

/** What each branch means, for the evolution screen. */
export const BRANCH_REASON: Record<PetBranch, string> = {
  body: 'Most of what you kept up was for your body, so it grew strong.',
  mind: 'Most of what you kept up was for your mind, so it grew bright.',
  heart: 'You kept a balance of habits, so it grew kind.',
};

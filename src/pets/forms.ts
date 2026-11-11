// ============================================
// PET FORMS
// ============================================
// Which drawing a pet uses at each stage of its life.
//
// A pet grows through four stages (see utils/evolution: 7, 30 and 100-day
// streaks). From the adult stage on, a pet with an evolution line splits into
// branches, and which branch it takes depends on the kind of habits its owner
// has been keeping (see utils/petBranch).
//
// Every pet has a pixel sprite. Only pets with an entry in LINES change form
// as they grow; the rest keep one form for now.
// ============================================

import { PetSpecies } from '../types';
import { SPRITES, SpriteDef } from './sprites';

/** The path a pet takes from the adult stage on */
export type PetBranch = 'body' | 'mind' | 'heart';
export const PET_BRANCHES: PetBranch[] = ['body', 'mind', 'heart'];

/** The stage at which a pet's branch is decided, and from which it shows */
export const BRANCH_STAGE = 2;

type EvolutionLine = {
  baby: SpriteDef;
  child: SpriteDef;
  adult: Record<PetBranch, SpriteDef>;
  final: Record<PetBranch, SpriteDef>;
};

const LINES: Partial<Record<PetSpecies, EvolutionLine>> = {
  blob: {
    baby: SPRITES.pip,
    child: SPRITES.blob,
    adult: { body: SPRITES.stout, mind: SPRITES.wisp, heart: SPRITES.bloom },
    final: { body: SPRITES.bulwark, mind: SPRITES.lumen, heart: SPRITES.evergrow },
  },
};

// Pets with a single form for now
const SINGLE_FORMS: Partial<Record<PetSpecies, SpriteDef>> = {
  pixel: SPRITES.pixel,
  dragon: SPRITES.dragon,
  paper: SPRITES.paper,
  robot: SPRITES.robot,
  droplet: SPRITES.droplet,
  slime: SPRITES.slime,
  carmech: SPRITES.carmech,
  navi: SPRITES.navi,
  fish: SPRITES.fish,
  butterfly: SPRITES.butterfly,
  star: SPRITES.star,
  deer: SPRITES.deer,
  tiger: SPRITES.tiger,
  lion: SPRITES.lion,
  hawk: SPRITES.hawk,
};

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
  if (!line) return SINGLE_FORMS[species] ?? null;
  if (stage <= 0) return line.baby;
  if (stage === 1) return line.child;
  const path = branch ?? 'heart';
  return stage === 2 ? line.adult[path] : line.final[path];
}

/** What each branch means, for the evolution screen. */
export const BRANCH_REASON: Record<PetBranch, string> = {
  body: 'Most of what you kept up was for your body, so it grew strong.',
  mind: 'Most of what you kept up was for your mind, so it grew bright.',
  heart: 'You kept a balance of habits, so it grew kind.',
};

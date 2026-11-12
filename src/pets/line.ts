// ============================================
// EVOLUTION LINES: SHARED TYPES
// ============================================
// A pet grows through four stages. The first two have one form each; at the
// adult stage it takes one of three paths, and its final form follows that path.
// ============================================

import type { SpriteDef } from './sprites';

/** The path a pet takes from the adult stage on */
export type PetBranch = 'body' | 'mind' | 'heart';

export type EvolutionLine = {
  baby: SpriteDef;
  child: SpriteDef;
  adult: Record<PetBranch, SpriteDef>;
  final: Record<PetBranch, SpriteDef>;
};

/**
 * A new form of a pet. It keeps the face, colours, idle motion and hat fit of
 * the form it grows from unless told otherwise, so most forms are only a
 * name and a drawing.
 */
export function form(base: SpriteDef, name: string, grid: string[], changes: Partial<SpriteDef> = {}): SpriteDef {
  return { ...base, name, grid, ...changes };
}

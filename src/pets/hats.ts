// ============================================
// PET HATS
// ============================================
// Pixel-art hats, drawn on the same grid and with the same letters as the
// pets (see ./sprites), so a hat's pixels line up with the pet under it.
//
// Every hat comes in two sizes: `m` for most pets and `s` for the ones with
// a small or pointed head. A hat is placed by its bottom row: each sprite
// says which row of its head that lands on.
// ============================================

import type { HatType } from '../types';
import { SPRITE_SIZE, type SpriteDef, type SpritePalette } from './sprites';

export type HatSize = 's' | 'm';

export type HatDef = {
  palette: Partial<SpritePalette>;
  m: string[];
  s: string[];
  /** A halo hovers over whatever is on the pet's head instead of sitting on it */
  floats?: boolean;
};

const INK = '#1B1B22';

export const HATS: Partial<Record<HatType, HatDef>> = {
  cap: {
    palette: { O: INK, B: '#2F8FEA', H: '#7CC0FF', S: '#1F6FC4', A: '#174F8F' },
    m: [
      '...OOOOOO...',
      '..OHHBBBBO..',
      '.OHBBBBBBBO.',
      '.OBBBBBBBBOO',
      '.OSSSSSSAAAO',
    ],
    s: [
      '..OOOO..',
      '.OHBBBO.',
      '.OBBBBOO',
      '.OSSSAAO',
    ],
  },
  beanie: {
    palette: { O: INK, B: '#E5484D', H: '#FF8A8E', S: '#B4282D', A: '#F7F3EA', W: '#FFFFFF' },
    m: [
      '....OO....',
      '...OWWO...',
      '..OOOOOO..',
      '.OHBBBBBO.',
      '.OBBBBBBO.',
      'OASASASASO',
    ],
    s: [
      '...OO...',
      '..OWWO..',
      '..OOOO..',
      '.OHBBBO.',
      'OASASASO',
    ],
  },
  party: {
    palette: { O: INK, B: '#F0509A', H: '#FF9CC8', S: '#C22D74', A: '#FFD84A', W: '#FFD84A' },
    m: [
      '...WW...',
      '..OHBO..',
      '..OAAO..',
      '.OHBBBO.',
      '.OAAAAO.',
      'OHBBBBBO',
      'OSSSSSSO',
    ],
    s: [
      '..WW..',
      '.OHBO.',
      '.OAAO.',
      'OHBBBO',
      'OSSSSO',
    ],
  },
  tophat: {
    palette: { O: '#0E0E12', B: '#3A3A46', H: '#6A6A7A', S: '#26262E', A: '#E5484D' },
    m: [
      '..OOOOOOOO..',
      '..OHBBBBBO..',
      '..OHBBBBBO..',
      '..OAAAAAAO..',
      'OOOBBBBBBOOO',
      'OHBBBBBBBBSO',
    ],
    s: [
      '.OOOOOO.',
      '.OHBBBO.',
      '.OAAAAO.',
      'OOBBBBOO',
      'OHBBBBSO',
    ],
  },
  wizard: {
    palette: { O: INK, B: '#6B45C9', H: '#A58BEF', S: '#4A2C99', A: '#FFD84A' },
    m: [
      '......OO....',
      '.....OBBO...',
      '....OHBAO...',
      '...OHBBBBO..',
      '...OBABBBO..',
      '..OHBBBBABO.',
      'OOOBBBBBBOOO',
      'OSSSSSSSSSSO',
    ],
    s: [
      '....OO..',
      '...OBBO.',
      '..OHBAO.',
      '.OHABBO.',
      'OOBBBBOO',
      'OSSSSSSO',
    ],
  },
  crown: {
    palette: { O: '#7A4A00', B: '#FFC928', H: '#FFE98A', S: '#E09A10', A: '#E5484D', W: '#3FA7F5' },
    m: [
      '.O..OO..O.',
      'OHOOHBOOBO',
      'OHABWWBASO',
      'OSSSSSSSSO',
    ],
    s: [
      'O.OO.O',
      'OHBBBO',
      'OABWAO',
      'OSSSSO',
    ],
  },
  halo: {
    floats: true,
    palette: { O: '#B97A00', B: '#FFD84A', H: '#FFF3B0', S: '#F0A91A' },
    m: [
      '.OOOOOOOO.',
      'OHHBBBBBSO',
      '.OOOOOOOO.',
    ],
    s: [
      '.OOOO.',
      'OHBBSO',
      '.OOOO.',
    ],
  },
  laurel: {
    palette: { O: '#143D1F', B: '#3FA34D', H: '#B7EB8F', S: '#2E7D32', A: '#FFD84A' },
    m: [
      '.O.O.OO.O.O.',
      'OHOHOAAOHOHO',
      'OBSBSBBSBSBO',
    ],
    s: [
      '.O.OO.O.',
      'OHOAAOHO',
      'OBSBBSBO',
    ],
  },
  sombrero: {
    palette: { O: '#5A3410', B: '#F2C14E', H: '#FFE39A', S: '#C98A2B', A: '#E5484D', W: '#3DAA5C' },
    m: [
      '.....OOOO.....',
      '....OHBBBO....',
      '....OAWAWO....',
      '.OOOOBBBBOOOO.',
      'OHBABWBBAWBASO',
      '.OOOOOOOOOOOO.',
    ],
    s: [
      '...OOOO...',
      '..OHAWBO..',
      'OOOBBBBOOO',
      'OHBAWBAWSO',
      '.OOOOOOOO.',
    ],
  },
  viking: {
    palette: { O: INK, B: '#A9B4C0', H: '#DDE3EA', S: '#7C8894', A: '#E0A82E', W: '#FFF4D6' },
    m: [
      'OO..........OO',
      'OWO..OOOO..OWO',
      'OWWOOHBBBOOWWO',
      '.OWOHBBBBBOWO.',
      '..OAAAAAAAAO..',
    ],
    s: [
      'O........O',
      'OWO.OO.OWO',
      '.OWOHBOWO.',
      '..OAAAAO..',
    ],
  },
  astronaut: {
    palette: { O: INK, B: '#EEF2F6', H: '#FFFFFF', S: '#AEBBC6', A: '#FF6B3D', W: '#3D7BD9' },
    m: [
      '.....AA.....',
      '.....OO.....',
      '...OOOOOO...',
      '..OHBBBBBO..',
      '.OHBWWWWBSO.',
      '.OBWHWWWWSO.',
    ],
    s: [
      '...AA...',
      '..OOOO..',
      '.OHBBSO.',
      '.OBWWSO.',
    ],
  },
};

export type PlacedHat = {
  grid: string[];
  palette: Partial<SpritePalette>;
  /** Column of the hat's left edge and row of its top edge, in sprite cells. The top can be above the grid. */
  left: number;
  top: number;
};

/** First row of the sprite with anything drawn in the given columns */
function topOfSprite(sprite: SpriteDef, from: number, to: number): number {
  const row = sprite.grid.findIndex((line) => [...line.slice(from, to)].some((cell) => cell !== '.'));
  return row === -1 ? 0 : row;
}

/** Where a hat goes on a sprite, or null for no hat (or one with no pixel drawing) */
export function placeHat(sprite: SpriteDef, hat: HatType): PlacedHat | null {
  const def = HATS[hat];
  if (!def) return null;
  const { row, x = SPRITE_SIZE / 2, size = 'm' } = sprite.hat;
  const grid = def[size];
  const width = grid[0].length;
  const left = x - width / 2;
  // A floating hat keeps one clear row between it and the top of the pet
  const bottom = def.floats ? topOfSprite(sprite, left, left + width) - 2 : row;
  return { grid, palette: def.palette, left, top: bottom - grid.length + 1 };
}

/**
 * The sprite as it is drawn under a hat: whatever sprouts from the middle of
 * the head (a flame, an antenna, a pointed tip) is tucked away so it does not
 * stick out around the hat.
 */
export function gridUnderHat(sprite: SpriteDef, hat: HatType): string[] {
  const def = HATS[hat];
  const tuck = sprite.hat.tuck;
  if (!def || def.floats || !tuck) return sprite.grid;
  const [from, to] = tuck;
  return sprite.grid.map((line, y) =>
    y < sprite.hat.row ? line.slice(0, from) + '.'.repeat(to - from + 1) + line.slice(to + 1) : line
  );
}

/**
 * How much the pet has to shrink (about its feet) for a hat that reaches
 * above the grid to stay in the picture. 1 when the hat already fits.
 */
export function scaleToFitHat(placed: PlacedHat | null): number {
  if (!placed || placed.top >= 0) return 1;
  return SPRITE_SIZE / (SPRITE_SIZE - placed.top);
}

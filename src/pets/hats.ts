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
import { SPRITE_SIZE, type HatFit, type SpriteDef, type SpritePalette } from './sprites';

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
  bow: {
    palette: { O: INK, B: '#FF7EB6', H: '#FFC2DD', S: '#D94F8C', A: '#D94F8C' },
    m: [
      '.OO....OO.',
      'OHBOOOOBBO',
      'OBBOAAOBSO',
      '.OO.OO.OO.',
    ],
    s: [
      'OO..OO',
      'OHAABO',
      'OO..OO',
    ],
  },
  beret: {
    palette: { O: INK, B: '#2B3A67', H: '#5B6FA8', S: '#1C2747' },
    m: [
      '.....O....',
      '..OOOOOO..',
      '.OHHBBBBO.',
      'OHBBBBBBSO',
      '.OSSSSSSO.',
    ],
    s: [
      '....O...',
      '.OOOOOO.',
      'OHBBBBSO',
      '.OSSSSO.',
    ],
  },
  propeller: {
    palette: { O: INK, B: '#2F8FEA', H: '#7CC0FF', S: '#1F6FC4', A: '#FFD84A', W: '#E5484D' },
    m: [
      'OWWWOOAAAO',
      '....OO....',
      '..OOOOOO..',
      '.OHBAABBO.',
      'OHBBAABBSO',
      'OSSSSSSSSO',
    ],
    s: [
      'OWWOOAAO',
      '...OO...',
      '.OOOOOO.',
      'OHBAABSO',
      'OSSSSSSO',
    ],
  },
  cowboy: {
    palette: { O: '#3B2209', B: '#A8703A', H: '#D29B62', S: '#7E5226', A: '#F2DFA0' },
    m: [
      '....OOOOOO....',
      '...OHBOOBBO...',
      '...OBBBBBBO...',
      'OO.OAAAAAAO.OO',
      'OHOOBBBBBBOOSO',
      '.OSSSSSSSSSSO.',
    ],
    s: [
      '..OOOOOO..',
      '..OHBBBO..',
      'O.OAAAAO.O',
      'OHSSSSSSSO',
    ],
  },
  chef: {
    palette: { O: INK, B: '#F4F4F4', H: '#FFFFFF', S: '#C9D1DA' },
    m: [
      '.OOOOOOOO.',
      'OHHBBHBBSO',
      'OHBBBBBBSO',
      '.OBBSBSBO.',
      '.OBBSBSBO.',
      '.OSSSSSSO.',
    ],
    s: [
      '.OOOOOO.',
      'OHBBHBSO',
      'OHBBBBSO',
      '.OBSBSO.',
      '.OSSSSO.',
    ],
  },
  flower: {
    palette: { O: '#143D1F', B: '#3FA34D', H: '#FFD84A', S: '#2E7D32', A: '#FF7EB6', W: '#8FB8FF' },
    m: [
      '.AA..WW..AA.',
      'AHHAWHHWAHHA',
      'BAABBWWBBAAB',
    ],
    s: [
      'AA.WW.AA',
      'HABHHBAH',
      'AABWWBAA',
    ],
  },
  headphones: {
    palette: { O: INK, B: '#3A3A46', H: '#6A6A7A', S: '#3A3A46', A: '#E5484D' },
    m: [
      '...OOOOOOOO...',
      '.OOSSSSSSSSOO.',
      'OAAO......OAAO',
      'OAAO......OAAO',
    ],
    s: [
      '..OOOOOO..',
      'OOSSSSSSOO',
      'OAO....OAO',
    ],
  },
  straw: {
    palette: { O: '#5A4410', B: '#F2DFA0', H: '#FFF3C4', S: '#C9A85A', A: '#E5484D' },
    m: [
      '...OOOOOO...',
      '...OHBBBO...',
      '...OAAAAO...',
      'OOOOBBBBOOOO',
      'OHBBBBBBBBSO',
    ],
    s: [
      '.OOOOOO.',
      '.OAAAAO.',
      'OOBBBBOO',
      'OHBBBBSO',
    ],
  },
  pirate: {
    palette: { O: '#0E0E12', B: '#2A2A34', H: '#55556A', S: '#1A1A22', A: '#E0A82E', W: '#FFFFFF' },
    m: [
      '....OOOO....',
      '..OOBBBBOO..',
      '.OBBBWWBBBO.',
      'OHBBBWWBBBSO',
      'OAAAAAAAAAAO',
    ],
    s: [
      '..OOOO..',
      '.OBWWBO.',
      'OHBWWBSO',
      'OAAAAAAO',
    ],
  },
  grad: {
    palette: { O: '#0E0E12', B: '#2A2A34', H: '#55556A', S: '#1A1A22', A: '#FFD84A' },
    m: [
      'OOOOOOOOOOOO',
      'OHBBBBBBBBSO',
      'OOOOOOOOOAOO',
      '..OHBBBBSOA.',
      '..OSSSSSSOA.',
    ],
    s: [
      'OOOOOOOO',
      'OHBBBBSO',
      'OOOOOOAO',
      '.OSSSSOA',
    ],
  },
  jester: {
    palette: { O: INK, B: '#2BB3A3', H: '#7FE0D4', S: '#1C8A7D', A: '#FFD84A', W: '#E5484D' },
    m: [
      'A..........A',
      'OWO......OBO',
      'OWWO.OO.OBBO',
      '.OWWOWBOBBO.',
      '.OWWWWBBBBO.',
      '.OAAAAAAAAO.',
    ],
    s: [
      'A......A',
      'OWO..OBO',
      'OWWOOBBO',
      '.OAAAAO.',
    ],
  },
  tiara: {
    palette: { O: '#6B7785', B: '#DDE3EA', H: '#FFFFFF', S: '#AEBBC6', A: '#FF5FA2', W: '#7CC0FF' },
    m: [
      '....OO....',
      '.O.OAAO.O.',
      'OWOHAAHOWO',
      'OBBBBBBBBO',
    ],
    s: [
      '..OO..',
      'OOAAOO',
      'OBBBBO',
    ],
  },
  bunny: {
    palette: { O: INK, B: '#EEF2F6', H: '#FFFFFF', S: '#AEBBC6', A: '#FF9CC8' },
    m: [
      '.OO....OO.',
      'OHAO..OAHO',
      'OHAO..OAHO',
      'OHAO..OAHO',
      'OBBOOOOBBO',
    ],
    s: [
      'OO..OO',
      'OAOOAO',
      'OAOOAO',
      'OBBBBO',
    ],
  },
  santa: {
    palette: { O: INK, B: '#E5484D', H: '#FF8A8E', S: '#B4282D', W: '#FFFFFF' },
    m: [
      '.......OOWW.',
      '.....OOBBWW.',
      '....OHBBBO..',
      '...OHBBBBO..',
      '.OOOOOOOOOO.',
      'OWWWWWWWWWWO',
    ],
    s: [
      '....OWW.',
      '..OOBWW.',
      '.OHBBBO.',
      'OWWWWWWO',
    ],
  },
};

/**
 * Every hat in the closet and how many completed habits unlock it, in the
 * order they are earned. Close together early on, so a new owner gets one
 * most days of their first weeks.
 */
export const HAT_UNLOCKS: [HatType, number][] = [
  ['none', 0],
  ['cap', 1],
  ['bow', 2],
  ['beanie', 3],
  ['party', 5],
  ['beret', 6],
  ['tophat', 7],
  ['propeller', 9],
  ['wizard', 10],
  ['cowboy', 12],
  ['crown', 14],
  ['chef', 17],
  ['halo', 21],
  ['flower', 25],
  ['laurel', 30],
  ['headphones', 35],
  ['straw', 40],
  ['sombrero', 45],
  ['pirate', 52],
  ['viking', 60],
  ['grad', 70],
  ['jester', 80],
  ['tiara', 90],
  ['astronaut', 100],
  ['bunny', 125],
  ['santa', 150],
];

/** The hats earned by a given number of completed habits, oldest first */
export function unlockedHats(totalCompletions: number): HatType[] {
  return HAT_UNLOCKS.filter(([, needed]) => totalCompletions >= needed).map(([hat]) => hat);
}

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

/** How a sprite wears one particular hat */
function fitFor(sprite: SpriteDef, hat: HatType): HatFit {
  return { ...sprite.hat, ...sprite.hat.per?.[hat] };
}

/** Where a hat goes on a sprite, or null for no hat (or one with no pixel drawing) */
export function placeHat(sprite: SpriteDef, hat: HatType): PlacedHat | null {
  const def = HATS[hat];
  if (!def) return null;
  const { row, x = SPRITE_SIZE / 2, size = 'm' } = fitFor(sprite, hat);
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
    y < fitFor(sprite, hat).row ? line.slice(0, from) + '.'.repeat(to - from + 1) + line.slice(to + 1) : line
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

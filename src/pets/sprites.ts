// ============================================
// PET SPRITES
// ============================================
// Pixel-art pets, drawn on a 16x16 grid. Each row is 16 characters:
//
//   .  empty        O  outline      B  body        H  highlight
//   S  shadow       A  accent       W  light part  C  cheek
//
// Eyes and mouths are not drawn into the grid. Each sprite says where they
// go, and the renderer draws them for the pet's current expression, so one
// drawing covers every mood.
// ============================================

import type { PetMotion } from './motions';

export type SpriteCell = '.' | 'O' | 'B' | 'H' | 'S' | 'A' | 'W' | 'C';
export type SpritePalette = Record<Exclude<SpriteCell, '.'>, string>;

/** Where a hat sits on a pet */
export type HatFit = {
  /** The row of the head that the bottom of the hat lands on */
  row: number;
  /** The column the hat is centred on, when the head is off-centre. Left out, the middle. */
  x?: number;
  /** Small hats for small or pointed heads. Left out, medium. */
  size?: 's' | 'm';
  /** Columns of whatever sprouts above the head (a flame, an antenna) that a hat hides */
  tuck?: [number, number];
};

export type SpriteDef = {
  /** The form's name, shown when the pet evolves */
  name: string;
  grid: string[];
  palette: SpritePalette;
  /** Top-left cell of each eye */
  eyes: [number, number][];
  /** Eyes are 2 cells wide on most pets, 1 on the smallest */
  eyeSize: 1 | 2;
  /** Left cell of the mouth */
  mouth: [number, number];
  /** How a hat fits this pet (see ./hats) */
  hat: HatFit;
  /** Eyes get a white glint unless this is false (it would vanish on a white body) */
  eyeShine?: boolean;
  /** Colour of the eyes and mouth, for pets whose face is not drawn in dark ink (a robot's lit display) */
  ink?: string;
  /** How the pet moves when idle (see ./motions). Left out, it breathes. */
  motion?: PetMotion;
};

export const SPRITE_SIZE = 16;

// Colours follow each pet's original drawing (see the palettes in components/Pet.tsx)
const BLOB: SpritePalette = { O: '#1F5A2E', B: '#7ED67E', H: '#A8E6A8', S: '#5CB85C', A: '#4CAF50', W: '#FFFFFF', C: '#FFB6C1' };

// SPRITES-START
export const SPRITES = {
  // ---------- Blob line ----------
  pip: {
    name: 'Pip',
    palette: BLOB,
    eyes: [[6, 8], [9, 8]],
    eyeSize: 1,
    mouth: [7, 10],
    hat: { row: 7, size: 's' },
    grid: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '.......OO.......',
      '......OHBO......',
      '.....OHBBBO.....',
      '....OHBBBBBO....',
      '....OBBBBBBO....',
      '....OBBBBBBO....',
      '....OSBBBBSO....',
      '.....OSSSSO.....',
      '......OOOO......',
      '................',
      '................',
    ],
  },
  blob: {
    name: 'Blob',
    palette: BLOB,
    eyes: [[4, 7], [10, 7]],
    eyeSize: 2,
    mouth: [7, 10],
    hat: { row: 3 },
    grid: [
      '................',
      '................',
      '.....OOOOOO.....',
      '...OOHHBBBBOO...',
      '..OHHBBBBBBBBO..',
      '..OHBBBBBBBBBO..',
      '.OBBBBBBBBBBBBO.',
      '.OBBBBBBBBBBBBO.',
      '.OBBBBBBBBBBBBO.',
      '.OBBBBBBBBBBBBO.',
      '.OBCBBBBBBBBCBO.',
      '.OSBBBBBBBBBBSO.',
      '..OSSBBBBBBSSO..',
      '...OOSSSSSSOO...',
      '.....OOOOOO.....',
      '................',
    ],
  },
  stout: {
    name: 'Stout',
    palette: { ...BLOB, A: '#C68B3C' },
    eyes: [[4, 7], [10, 7]],
    eyeSize: 2,
    mouth: [7, 10],
    hat: { row: 3 },
    grid: [
      '................',
      '...OO......OO...',
      '..OAAO....OAAO..',
      '..OABOOOOOOBAO..',
      '..OBHHBBBBBBBO..',
      '.OBHBBBBBBBBBBO.',
      '.OBBBBBBBBBBBBO.',
      'OOBBBBBBBBBBBBOO',
      'OBBBBBBBBBBBBBBO',
      'OBBBBBBBBBBBBBBO',
      'OBOBBBBBBBBBBOBO',
      'OOOBBBBBBBBBBOOO',
      '..OSBBBBBBBBSO..',
      '..OSSSBBBBSSSO..',
      '...OOOOOOOOOO...',
      '................',
    ],
  },
  wisp: {
    name: 'Wisp',
    palette: { ...BLOB, A: '#6CC8FF', H: '#E8FBFF' },
    eyes: [[4, 8], [10, 8]],
    eyeSize: 2,
    mouth: [7, 11],
    hat: { row: 5, tuck: [5, 10] },
    grid: [
      '.......OO.......',
      '......OAAO......',
      '.....OAHAO......',
      '.....OAAAOO.....',
      '....OOBBBBBO....',
      '...OHHBBBBBBO...',
      '..OHBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OSBBBBBBBBSO..',
      '...OSBBBBBBSO...',
      '....OSSSSSSO....',
      '.....OOOOOO.....',
      '................',
    ],
  },
  bloom: {
    name: 'Bloom',
    palette: { ...BLOB, A: '#5CC46A' },
    eyes: [[4, 8], [10, 8]],
    eyeSize: 2,
    mouth: [7, 10],
    hat: { row: 5, tuck: [4, 11] },
    grid: [
      '.....OO..OO.....',
      '....OAAOOAAO....',
      '....OAAAAAAO....',
      '.....OOAAOO.....',
      '....OOOBBOOO....',
      '..OOHHBBBBBBOO..',
      '.OHHBBBBBBBBBBO.',
      '.OHBBBBBBBBBBBO.',
      '.OBBBBBBBBBBBBO.',
      '.OBBBBBBBBBBBBO.',
      '.OBCBBBBBBBBCBO.',
      '.OSBBBBBBBBBBSO.',
      '..OSSBBBBBBSSO..',
      '...OOSSSSSSOO...',
      '.....OOOOOO.....',
      '................',
    ],
  },
  bulwark: {
    name: 'Bulwark',
    palette: { ...BLOB, A: '#D89A3A' },
    eyes: [[4, 6], [10, 6]],
    eyeSize: 2,
    mouth: [7, 9],
    hat: { row: 3 },
    grid: [
      '.OO..........OO.',
      'OAAO........OAAO',
      'OAAAO......OAAAO',
      '.OAABOOOOOOBAAO.',
      '.OBBHHBBBBBBBBO.',
      'OOBHBBBBBBBBBBOO',
      'OABBBBBBBBBBBBAO',
      'OABBBBBBBBBBBBAO',
      'OOBBBBBBBBBBBBOO',
      'OBBBBBBBBBBBBBBO',
      'OBOBBBBBBBBBBOBO',
      'OOOBBBBBBBBBBOOO',
      '..OSAAAAAAAASO..',
      '.OSSSOBBBBOSSSO.',
      '.OOOOOOOOOOOOOO.',
      '................',
    ],
  },
  lumen: {
    name: 'Lumen',
    palette: { ...BLOB, A: '#6CC8FF', H: '#F2FDFF' },
    eyes: [[4, 8], [10, 8]],
    eyeSize: 2,
    mouth: [7, 10],
    hat: { row: 6, tuck: [0, 15] },
    grid: [
      '...O...OO...O...',
      '..OHO.OAAO.OHO..',
      '...O.OAHHAO.O...',
      '....OAAHHAAO....',
      '....OAAAAAAO....',
      '...OOOBBBBOOO...',
      '..OHHBBBBBBBBO..',
      '.OHBBBBBBBBBBBO.',
      '.OBBBBBBBBBBBBO.',
      '.OBBBBBBBBBBBBO.',
      '.OBBBBBBBBBBBBO.',
      '.OSBBBBBBBBBBSO.',
      '..OSBBBBBBBBSO..',
      '...OSSSSSSSSO...',
      '....OOOOOOOO....',
      '................',
    ],
  },
  evergrow: {
    name: 'Evergrow',
    palette: { ...BLOB, A: '#FF8FB1', W: '#FFE27A' },
    eyes: [[4, 8], [10, 8]],
    eyeSize: 2,
    mouth: [7, 10],
    hat: { row: 5, tuck: [3, 12] },
    grid: [
      '....OO.OO.OO....',
      '...OAAOAAOAAO...',
      '...OAAAWWAAAO...',
      '....OAAWWAAO....',
      '.OO..OOAAOO..OO.',
      'OAAOOHHBBBBOOAAO',
      'OAAOHBBBBBBBOAAO',
      '.OOBBBBBBBBBBOO.',
      '.OBBBBBBBBBBBBO.',
      '.OBBBBBBBBBBBBO.',
      '.OBCBBBBBBBBCBO.',
      '.OSBBBBBBBBBBSO.',
      '..OSSBBBBBBSSO..',
      '...OOSSSSSSOO...',
      '.....OOOOOO.....',
      '................',
    ],
  },

  // ---------- Style tests: one form each for now ----------
  // Blue and blocky, with square ears and a pale belly, like the original
  pixel: {
    name: 'Pixel',
    motion: 'step',
    palette: { O: '#1F3F66', B: '#5B9BD5', H: '#A9D3F5', S: '#3D7AB8', A: '#2196F3', W: '#CFE6FA', C: '#FFB6C1' },
    eyes: [[4, 6], [10, 6]],
    eyeSize: 2,
    mouth: [7, 8],
    hat: { row: 3 },
    grid: [
      '................',
      '...OO......OO...',
      '..OBBO....OBBO..',
      '..OBHOOOOOOHBO..',
      '..OBBBBBBBBBBO..',
      '..OBHHBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBCBBBBBBCBO..',
      '..OBBBBBBBBBBO..',
      '..OBBWWWWWWBBO..',
      '..OBBWWWWWWBBO..',
      '..OSBWWWWWWBSO..',
      '..OSSBBBBBBSSO..',
      '...OOOOOOOOOO...',
      '................',
    ],
  },
  // Teal and upright, with gold horns and whiskers, small wings and a tail
  dragon: {
    name: 'Dragon',
    motion: 'drift',
    palette: { O: '#17473B', B: '#48C9A5', H: '#A8F0DC', S: '#2A9D7F', A: '#FFD700', W: '#C9F5E6', C: '#FFD700' },
    eyes: [[4, 5], [10, 5]],
    eyeSize: 2,
    mouth: [7, 8],
    hat: { row: 3 },
    grid: [
      '...OO......OO...',
      '..OAAO....OAAO..',
      '..OAAOOOOOOAAO..',
      '...OBHHBBBBBO...',
      '..OBHBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '.AOBBBBBBBBBBOA.',
      '..OOBBBBBBBBOO..',
      '.OSOOBWWWWBOOSO.',
      'OSSSOBWWWWBOSSSO',
      '.OSOOBWWWWBOOSO.',
      '..O.OBWWWWBO.O..',
      '....OBBBBBBOAO..',
      '....OOO..OOOOO..',
      '................',
    ],
  },
  // ---------- The rest of the pets: one form each for now ----------
  // A folded sheet with a dog-eared corner and crease lines
  paper: {
    name: 'Paper',
    motion: 'sway',
    eyeShine: false,
    palette: { O: '#6E6E6A', B: '#F5F5F0', H: '#FFFFFF', S: '#D6D6CC', A: '#9E9E9E', W: '#FFFFFF', C: '#FFCDD2' },
    eyes: [[4, 6], [10, 6]],
    eyeSize: 2,
    mouth: [7, 8],
    hat: { row: 3, x: 7 },
    grid: [
      '................',
      '..OOOOOOOOO.....',
      '..OHHHHHHHSO....',
      '..OHBBBBBBSSO...',
      '..OBBBBBBBOOOO..',
      '..OBBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBCBBBBBBCBO..',
      '..OBBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBBBSBBBBBBO..',
      '..OBBSBBBBBBBO..',
      '..OSSBBBBBBSSO..',
      '..OOOOOOOOOOOO..',
      '................',
    ],
  },
  // Boxy and grey, with an antenna, ear bolts and a lit face on a dark visor
  robot: {
    name: 'Robot',
    motion: 'tick',
    eyeShine: false,
    ink: '#4FC3F7',
    palette: { O: '#37474F', B: '#78909C', H: '#B0BEC5', S: '#263238', A: '#FFAB40', W: '#4FC3F7', C: '#FFAB91' },
    eyes: [[5, 6], [9, 6]],
    eyeSize: 2,
    mouth: [7, 8],
    hat: { row: 3, tuck: [6, 9] },
    grid: [
      '.......OO.......',
      '.......AA.......',
      '.......OO.......',
      '..OOOOOOOOOOOO..',
      '..OHHBBBBBBBBO..',
      '..OHSSSSSSSSBO..',
      '.AOBSSSSSSSSBOA.',
      '.AOBSSSSSSSSBOA.',
      '..OBSSSSSSSSBO..',
      '..OBBBBBBBBBBO..',
      '..OOOOOOOOOOOO..',
      '...OBBBBBBBBO...',
      '..OOBBWWWWBBOO..',
      '..OSOBWWWWBOSO..',
      '..OO.OOOOOO.OO..',
      '................',
    ],
  },
  // A teardrop with a pointed top
  droplet: {
    name: 'Droplet',
    motion: 'stretch',
    palette: { O: '#00707F', B: '#4DD0E1', H: '#B2EBF2', S: '#26A5B5', A: '#00BCD4', W: '#FFFFFF', C: '#F8BBD9' },
    eyes: [[4, 8], [10, 8]],
    eyeSize: 2,
    mouth: [7, 10],
    hat: { row: 4, size: 's', tuck: [6, 9] },
    grid: [
      '.......OO.......',
      '......OHBO......',
      '......OHBO......',
      '.....OHBBBO.....',
      '.....OHBBBO.....',
      '....OHBBBBBO....',
      '...OHBBBBBBBO...',
      '..OHBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBCBBBBBBCBO..',
      '..OBBBBBBBBBBO..',
      '..OSBBBBBBBBSO..',
      '...OSSBBBBSSO...',
      '....OOOOOOOO....',
      '................',
    ],
  },
  // A low, wide puddle with a dripping edge
  slime: {
    name: 'Slime',
    motion: 'jiggle',
    palette: { O: '#4E7A1E', B: '#AED581', H: '#DCEDC8', S: '#8BC34A', A: '#689F38', W: '#FFFFFF', C: '#FFCC80' },
    eyes: [[4, 8], [10, 8]],
    eyeSize: 2,
    mouth: [7, 10],
    hat: { row: 5 },
    grid: [
      '................',
      '................',
      '................',
      '................',
      '.....OOOOOO.....',
      '...OOHHBBBBOO...',
      '..OHHBBBBBBBBO..',
      '.OHBBBBBBBBBBBO.',
      '.OBBBBBBBBBBBBO.',
      'OBBBBBBBBBBBBBBO',
      'OBCBBBBBBBBBBCBO',
      'OBBBBBBBBBBBBBBO',
      'OSBBBBBBBBBBBBSO',
      'OSSBBSSBBSSBBSSO',
      '.OOOOOOOOOOOOOO.',
      '................',
    ],
  },
  // A red car: eyes in the windscreen, yellow headlights, dark wheels
  carmech: {
    name: 'Car Mech',
    motion: 'rumble',
    palette: { O: '#5B0F0F', B: '#EF5350', H: '#FFCDD2', S: '#3A3A3A', A: '#FFEB3B', W: '#BBDEFB', C: '#FFAB91' },
    eyes: [[4, 4], [10, 4]],
    eyeSize: 2,
    mouth: [7, 9],
    hat: { row: 3 },
    grid: [
      '................',
      '................',
      '....OOOOOOOO....',
      '...OWWWWWWWWO...',
      '..OWWWWWWWWWWO..',
      '..OWWWWWWWWWWO..',
      '.OOOOOOOOOOOOOO.',
      'OBHHBBBBBBBBBBBO',
      'OBBBBBBBBBBBBBBO',
      'OABBBBBBBBBBBBAO',
      'OBBBBBBBBBBBBBBO',
      'OSSSSSSSSSSSSSSO',
      '.OOSOOOOOOOOSOO.',
      '..OSSO....OSSO..',
      '...OO......OO...',
      '................',
    ],
  },
  // A floating purple orb with pale wings and a sparkle trail
  navi: {
    name: 'Navi',
    motion: 'hover',
    palette: { O: '#3B1F7A', B: '#9575CD', H: '#D1C4E9', S: '#7E57C2', A: '#E1BEE7', W: '#FFFFFF', C: '#F48FB1' },
    eyes: [[5, 5], [9, 5]],
    eyeSize: 2,
    mouth: [7, 7],
    hat: { row: 3 },
    grid: [
      '................',
      '................',
      '.....OOOOOO.....',
      '....OHHBBBBO....',
      '.AAOHBBBBBBBOAA.',
      'AWWOBBBBBBBBOWWA',
      'AWWOBBBBBBBBOWWA',
      '.AAOBCBBBBCBOAA.',
      '...OBBBBBBBBO...',
      '....OSBBBBSO....',
      '.....OOOOOO.....',
      '................',
      '.......AA.......',
      '......A..A......',
      '................',
      '................',
    ],
  },
  // An orange fish seen from the side, with teal fins and tail
  fish: {
    name: 'Fish',
    motion: 'swim',
    palette: { O: '#8A3B0E', B: '#FF9A56', H: '#FFD0AE', S: '#FF7F3F', A: '#16C0D6', W: '#FFFFFF', C: '#FF6B9D' },
    eyes: [[3, 6]],
    eyeSize: 2,
    mouth: [2, 8],
    hat: { row: 4, x: 7, tuck: [5, 9] },
    grid: [
      '................',
      '................',
      '......OOO.......',
      '.....OAAAO......',
      '...OOOOOOOOO....',
      '..OHHBBBBBBBO.OO',
      '.OHBBBBBBBBBBOAO',
      '.OBBBBBBBBBBBAAO',
      '.OBBBBBBBBBBBAAO',
      '.OBCBBBBBBBBBOAO',
      '..OSBBBBBBBSO.OO',
      '...OOOSSOOOO....',
      '.....OAAO.......',
      '......OO........',
      '................',
      '................',
    ],
  },
  // Pink wings with yellow spots around a small pale body
  butterfly: {
    name: 'Butterfly',
    motion: 'flutter',
    eyeShine: false,
    palette: { O: '#8A2550', B: '#FF6B9D', H: '#FFB3D1', S: '#E6578A', A: '#FFBE0B', W: '#FFE3EE', C: '#FFBE0B' },
    eyes: [[6, 4], [9, 4]],
    eyeSize: 1,
    mouth: [7, 6],
    hat: { row: 3, size: 's', tuck: [4, 11] },
    grid: [
      '....O......O....',
      '.....O....O.....',
      '.OOO..OOOO..OOO.',
      'OBBBOOWWWWOOBBBO',
      'OBAABOWWWWOBAABO',
      'OBAABOWWWWOBAABO',
      'OBBBBOWWWWOBBBBO',
      '.OBBBOOWWOOBBBO.',
      '..OOOOOWWOOOOO..',
      '.OSSSSOWWOSSSSO.',
      'OSSAASOWWOSAASSO',
      'OSSSSSOWWOSSSSSO',
      '.OOOOO.OO.OOOOO.',
      '................',
      '................',
      '................',
    ],
  },
  // A pale five-pointed star with a violet edge
  star: {
    name: 'Star',
    motion: 'twinkle',
    eyeShine: false,
    palette: { O: '#6A4FB0', B: '#E0E0FF', H: '#FFFFFF', S: '#B388FF', A: '#00F5FF', W: '#FFFFFF', C: '#8E44AD' },
    eyes: [[5, 6], [9, 6]],
    eyeSize: 2,
    mouth: [7, 8],
    hat: { row: 3, size: 's', tuck: [6, 9] },
    grid: [
      '.......OO.......',
      '......OHHO......',
      '......OHBO......',
      '.....OHBBBO.....',
      'OOOOOOBBBBOOOOOO',
      'OHBBBBBBBBBBBBSO',
      '.OBBBBBBBBBBBSO.',
      '..OBBBBBBBBBSO..',
      '...OBBBBBBBSO...',
      '...OBBBBBBBBO...',
      '..OBBBBBBBBBBO..',
      '..OBBBSOOSBBBO..',
      '.OBBSOO..OOSBBO.',
      '.OSOO......OOSO.',
      '.OO..........OO.',
      '................',
    ],
  },
  // Brown, with pale antlers, wide ears and a cream muzzle and belly
  deer: {
    name: 'Deer',
    motion: 'nod',
    palette: { O: '#4A3220', B: '#A67C52', H: '#D9BC96', S: '#8B6239', A: '#E8D5B0', W: '#F0E0C8', C: '#D4A574' },
    eyes: [[4, 6], [10, 6]],
    eyeSize: 2,
    mouth: [7, 9],
    hat: { row: 3 },
    grid: [
      '..O.O......O.O..',
      '..OAO......OAO..',
      '...OAO....OAO...',
      '.OOOOAOOOOAOOOO.',
      'OBBOOHHBBBBOOBBO',
      '.OBOHBBBBBBBOBO.',
      '..OBBBBBBBBBBO..',
      '..OBBBBBBBBBBO..',
      '..OBBWWWWWWBBO..',
      '...OBWWWWWWBO...',
      '...OOBWWWWBOO...',
      '..OBBBBBBBBBBO..',
      '..OBBWWWWWWBBO..',
      '..OSBOOOOOOBSO..',
      '..OSSO....OSSO..',
      '...OO......OO...',
    ],
  },
  // Orange with black stripes, round ears and a white muzzle
  tiger: {
    name: 'Tiger',
    motion: 'prowl',
    palette: { O: '#3A2010', B: '#FF8C42', H: '#FFC79A', S: '#1A1410', A: '#D97530', W: '#FFFFFF', C: '#FF9FB0' },
    eyes: [[4, 6], [10, 6]],
    eyeSize: 2,
    mouth: [7, 9],
    hat: { row: 3 },
    grid: [
      '................',
      '..OO........OO..',
      '.OBBO......OBBO.',
      '.OBCBOOOOOOBCBO.',
      '.OBBHHBSSBBBBBO.',
      '.OSBBBBSSBBBBSO.',
      '.OBBBBBBBBBBBBO.',
      '.OSBBBBBBBBBBSO.',
      '.OBBBWWWWWWBBBO.',
      '..OBWWWWWWWWBO..',
      '..OBBWWWWWWBBO..',
      '.OSBBBBBBBBBBSO.',
      '.OBBSBBBBBBSBBO.',
      '.OBBOOOOOOOOBBO.',
      '..OO........OO..',
      '................',
    ],
  },
  // Pale blue face inside a big, spiky, darker blue mane
  lion: {
    name: 'Lion',
    motion: 'puff',
    palette: { O: '#1F3F7A', B: '#B3D4FF', H: '#E3F0FF', S: '#4A90E2', A: '#91C7FF', W: '#FFFFFF', C: '#5EB3FF' },
    eyes: [[4, 6], [10, 6]],
    eyeSize: 2,
    mouth: [7, 9],
    hat: { row: 3 },
    grid: [
      '..O..O.OO.O..O..',
      '.OSOOSOSSOSOOSO.',
      'OSSSSSSSSSSSSSSO',
      'OSSSOOOOOOOOSSSO',
      'OSSOHHBBBBBBOSSO',
      'OSOHBBBBBBBBBOSO',
      'OSOBBBBBBBBBBOSO',
      'OSOBBBBBBBBBBOSO',
      'OSOBBBWWWWBBBOSO',
      'OSSOBWWWWWWBOSSO',
      'OSSSOBWWWWBOSSSO',
      '.OSSSOOOOOOSSSO.',
      '..OSSSSSSSSSSO..',
      '..OBBOOOOOOBBO..',
      '..OOO......OOO..',
      '................',
    ],
  },
  // Brown, with a dark crown, a yellow hooked beak, a white neck band and a speckled chest
  hawk: {
    name: 'Hawk',
    motion: 'bob',
    palette: { O: '#33261A', B: '#8B6F47', H: '#D9C29A', S: '#5D4A2F', A: '#FFC107', W: '#FFFFFF', C: '#D4A574' },
    eyes: [[4, 4], [10, 4]],
    eyeSize: 2,
    mouth: [7, 7],
    hat: { row: 2 },
    grid: [
      '................',
      '.....OOOOOO.....',
      '....OSSSSSSO....',
      '...OSBBBBBBSO...',
      '...OBBBBBBBBO...',
      '...OBBBBBBBBO...',
      '...OBBBAABBBO...',
      '..OOWWWAAWWWOO..',
      '.OSOHHHHHHHHOSO.',
      'OSSOHBHHHHBHOSSO',
      'OSSOHHHBBHHHOSSO',
      'OSSOHBHHHHBHOSSO',
      '.OSOOHHHHHHOOSO.',
      '..OO.OOOOOO.OO..',
      '.....AA..AA.....',
      '................',
    ],
  },
} satisfies Record<string, SpriteDef>;
// SPRITES-END

export type SpriteId = keyof typeof SPRITES;

// ---------- Faces ----------

export type SpriteExpression = 'idle' | 'happy' | 'excited' | 'sleepy';

const INK = '#1B1B22';
const TONGUE = '#E5484D';
const GLINT = '#FFFFFF';

export type FaceCell = { x: number; y: number; color: string };

/**
 * The eye and mouth pixels for a sprite in a given expression. They come back
 * separately so the eyes can blink on their own.
 */
export function spriteFace(
  sprite: SpriteDef,
  expression: SpriteExpression,
  ink: string = sprite.ink ?? INK
): { eyes: FaceCell[]; mouth: FaceCell[] } {
  const eyes: FaceCell[] = [];
  const mouth: FaceCell[] = [];
  let cells = eyes;
  const put = (x: number, y: number, color: string = ink) => cells.push({ x, y, color });

  for (const [x, y] of sprite.eyes) {
    const columns = sprite.eyeSize === 1 ? [x] : [x, x + 1];
    if (expression === 'happy') {
      // Closed, smiling eyes: a single line
      columns.forEach((cx) => put(cx, y));
    } else if (expression === 'sleepy') {
      columns.forEach((cx) => put(cx, y + 1));
    } else {
      columns.forEach((cx) => {
        put(cx, y);
        put(cx, y + 1);
      });
      if (sprite.eyeSize === 2 && sprite.eyeShine !== false) put(x, y, GLINT);
    }
  }

  cells = mouth;
  const [mx, my] = sprite.mouth;
  if (expression === 'happy') {
    put(mx - 1, my);
    put(mx + 2, my);
    put(mx, my + 1);
    put(mx + 1, my + 1);
  } else if (expression === 'excited') {
    put(mx, my);
    put(mx + 1, my);
    put(mx, my + 1, TONGUE);
    put(mx + 1, my + 1, TONGUE);
  } else {
    put(mx, my);
    put(mx + 1, my);
  }
  return { eyes, mouth };
}

// ============================================
// EVOLUTION LINE: Delilah
// ============================================
// A black, grey and brown cattle dog with a speckled coat, a white blaze down
// her forehead, tan eyebrows, one ear that flops, and a green harness.
// See ./linesA for how a line is laid out.
//
// Here the letters mean: B black coat, H the grey of her face, S nose, A brown,
// W white, C harness (or whatever she is wearing on that path).
// ============================================

import type { SpriteDef } from './sprites';
import { form, type EvolutionLine } from './line';

const coat = { O: '#101016', B: '#2B2C36', H: '#74747C', S: '#101016', A: '#A0714A', W: '#F4F4F4', C: '#3E8F5E' };
const ranger = { ...coat, C: '#E5484D' };
const scout = { ...coat, B: '#34415F', H: '#9FB4E0', C: '#3DE0F5' };
const sweetie = { ...coat, C: '#FF7FA8' };

const delilah: SpriteDef = {
  name: 'Delilah',
  motion: 'wag',
  palette: coat,
  eyes: [[4, 6], [10, 6]],
  eyeSize: 2,
  mouth: [7, 9],
  hat: { row: 3 },
  grid: [
    '.OO..........OOO',
    'OBBO........OBBO',
    'OBABO......OABBO',
    'OBABOOOOOOOOABO.',
    '.OBBBBHWWHBBBBO.',
    '.OBHAHHWWHHAHBO.',
    '.OBHHHHWWHHHHBO.',
    '.OBHHHHHHHHHHBO.',
    '.OBAAAASSAAAABO.',
    '..OAAAAAAAAAAO..',
    '..OOAAAAAAAAOO..',
    '..OCCCCCCCCCCO..',
    '..OBHBWWWWBHBO..',
    '..OABOOOOOOBAO..',
    '..OAAO....OAAO..',
    '...OO......OO...',
  ],
};

const DELILAH: EvolutionLine = {
  baby: form(
    delilah,
    'Pup',
    [
      '................',
      '................',
      '................',
      '................',
      '.....OOOOOO.....',
      '..OOOBHWWHBOOO..',
      '..OBOHAWWAHOBO..',
      '..OBOHHHHHHOBO..',
      '..OOOHHHHHHOOO..',
      '....OHHAAHHO....',
      '....OAASSAAO....',
      '....OAAAAAAO....',
      '.....OAAAAO.....',
      '......OOOO......',
      '................',
      '................',
    ],
    { eyes: [[6, 8], [9, 8]], eyeSize: 1, mouth: [7, 11], hat: { row: 5, size: 's' } }
  ),
  child: delilah,
  adult: {
    body: form(
      delilah,
      'Ranger',
      [
        '.OO..........OO.',
        'OBBO........OBBO',
        'OBABO......OBABO',
        'OBABOOOOOOOOBABO',
        '.OBBBBHWWHBBBBO.',
        '.OBHAHHWWHHAHBO.',
        '.OBHHHHWWHHHHBO.',
        '.OBHHHHHHHHHHBO.',
        '.OBAAAASSAAAABO.',
        '..OAAAAAAAAAAO..',
        '.OOOAAAAAAAAOOO.',
        'OBOCCCCCCCCCCOBO',
        'OBOBHCCCCCCHBOBO',
        'OOOABBOCCOBBAOOO',
        '..OAAO....OAAO..',
        '...OO......OO...',
      ],
      { palette: ranger }
    ),
    mind: form(
      delilah,
      'Scout',
      [
        '.OO....CC....OO.',
        'OBBO...CC...OBBO',
        'OBABO......OBABO',
        'OBABOOOOOOOOBABO',
        '.OBBBBHWWHBBBBO.',
        '.OBHAHHWWHHAHBO.',
        '.OBHHHHWWHHHHBO.',
        '.OBHHHHHHHHHHBO.',
        '.OBAAAASSAAAABO.',
        '..OAAAAAAAAAAO..',
        '..OOAAAAAAAAOO..',
        '..OCCCCCCCCCCO..',
        '..OBHBWCCWBHBO..',
        '..OABOOCCOOBAO..',
        '..OAAO....OAAO..',
        '...OO......OO...',
      ],
      { palette: scout, hat: { row: 3, tuck: [5, 10] } }
    ),
    heart: form(
      delilah,
      'Sweetie',
      [
        '.OO...C..C...OOO',
        'OBBO..CCCC..OBBO',
        'OBABO..CC..OABBO',
        'OBABOOOOOOOOABO.',
        '.OBBBBHWWHBBBBO.',
        '.OBHAHHWWHHAHBO.',
        '.OBHHHHWWHHHHBO.',
        '.OBCHHHHHHHHCBO.',
        '.OBAAAASSAAAABO.',
        '..OAAAAAAAAAAO..',
        '..OOAAAAAAAAOO..',
        '..OCCCCCCCCCCO..',
        '..OBHBCBBCBHBO..',
        '..OABOOCCOOBAO..',
        '..OAAO....OAAO..',
        '...OO......OO...',
      ],
      { palette: sweetie, hat: { row: 3, tuck: [5, 10] } }
    ),
  },
  final: {
    body: form(
      delilah,
      'Trailblazer',
      [
        '.OO..........OO.',
        'OBBO........OBBO',
        'OBABO......OBABO',
        'OBABOOOOOOOOBABO',
        '.OBBBBHWWHBBBBO.',
        '.OBHAHHWWHHAHBO.',
        '.OBHHHHWWHHHHBO.',
        '.OBHHHHHHHHHHBO.',
        'OOBAAAASSAAAABOO',
        'OCOAAAAAAAAAAOCO',
        'OCOOAAAAAAAAOOCO',
        'OCCCCCCCCCCCCCCO',
        'OCOBHCCWWCCHBOCO',
        'OCOABBOCCOBBAOCO',
        'OOOAAO....OAAOOO',
        '...OO......OO...',
      ],
      { palette: ranger }
    ),
    mind: form(
      delilah,
      'Stargazer',
      [
        'COO....CC....OOC',
        'OBBO..CWWC..OBBO',
        'OBABO..CC..OBABO',
        'OBABOOOOOOOOBABO',
        '.OBBBBHCCHBBBBO.',
        '.OBHAHHWWHHAHBO.',
        'COBHHHHWWHHHHBOC',
        '.OBHHHHHHHHHHBO.',
        '.OBAAAASSAAAABO.',
        'C.OAAAAAAAAAAO.C',
        '..OOAAAAAAAAOO..',
        '..OCCCCCCCCCCO..',
        '.COBHBWCCWBHBOC.',
        '..OABOOCCOOBAO..',
        '..OAAO....OAAO..',
        '...OO......OO...',
      ],
      { palette: scout, hat: { row: 3, tuck: [5, 10] } }
    ),
    heart: form(
      delilah,
      'Darling',
      [
        '.OO.CC.CC.CC.OO.',
        'OBBOCCWCCWCCOBBO',
        'OBABOCCCCCCOBABO',
        'OBABOOOOOOOOBABO',
        '.OBBBBHWWHBBBBO.',
        '.OBHAHHWWHHAHBO.',
        '.OBHHHHWWHHHHBO.',
        '.OBCHHHHHHHHCBO.',
        '.OBAAAASSAAAABO.',
        'C.OAAAAAAAAAAO.C',
        '.COOAAAAAAAAOOC.',
        '..OCCCCCCCCCCO..',
        '.COBHBCBBCBHBOC.',
        '..OABOOCCOOBAO..',
        '..OAAO....OAAO..',
        '...OO......OO...',
      ],
      { palette: sweetie, hat: { row: 3, tuck: [4, 11] } }
    ),
  },
};

export const LINES_D = { delilah: DELILAH };

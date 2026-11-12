import { HATS, HatDef, gridUnderHat, placeHat, scaleToFitHat } from '../pets/hats';
import { SPRITES, SPRITE_SIZE, SpriteDef } from '../pets/sprites';
import { allForms } from '../pets/forms';
import type { HatType } from '../types';

const hats = Object.entries(HATS) as [HatType, HatDef][];
const sprites: [string, SpriteDef][] = allForms().map((sprite) => [sprite.name, sprite]);

describe('pet hats', () => {
  it('has a pixel drawing for every hat that can be unlocked', () => {
    // The hats in the closet (see getUnlockedHats in components/Pet)
    const unlockable: HatType[] = ['cap', 'beanie', 'party', 'tophat', 'wizard', 'crown', 'halo', 'laurel', 'sombrero', 'viking', 'astronaut'];
    unlockable.forEach((hat) => expect(HATS).toHaveProperty(hat));
  });

  it.each(hats)('%s is an even-width grid using only its palette, in both sizes', (_id, hat) => {
    [hat.m, hat.s].forEach((grid) => {
      const width = grid[0].length;
      // Even, so it can be centred on a head that is an even number of cells wide
      expect(width % 2).toBe(0);
      grid.forEach((row) => {
        expect(row).toHaveLength(width);
        [...row].forEach((cell) => {
          if (cell !== '.') expect(hat.palette).toHaveProperty(cell);
        });
      });
    });
    expect(hat.s[0].length).toBeLessThan(hat.m[0].length);
  });

  it.each(sprites)('every hat fits on %s without covering its eyes', (_id, sprite) => {
    const eyeRow = Math.min(...sprite.eyes.map(([, y]) => y));
    hats.forEach(([id]) => {
      const placed = placeHat(sprite, id)!;
      expect(placed.left).toBeGreaterThanOrEqual(0);
      expect(placed.left + placed.grid[0].length).toBeLessThanOrEqual(SPRITE_SIZE);
      expect(placed.top + placed.grid.length - 1).toBeLessThan(eyeRow);
      // Shrinking to fit never makes the pet tiny
      expect(scaleToFitHat(placed)).toBeGreaterThan(0.7);
    });
  });

  it('has no hat to place for "none"', () => {
    expect(placeHat(SPRITES.blob, 'none')).toBeNull();
    expect(scaleToFitHat(null)).toBe(1);
    expect(gridUnderHat(SPRITES.wisp, 'none')).toBe(SPRITES.wisp.grid);
  });

  it('tucks a flame under a hat but leaves it alone under a halo', () => {
    // Cells drawn above the hat row, in the columns the flame grows from
    const flameRows = (grid: string[]) =>
      grid.slice(0, SPRITES.wisp.hat.row).map((row) => row.slice(5, 11)).join('').replace(/\./g, '').length;
    expect(flameRows(SPRITES.wisp.grid)).toBeGreaterThan(0);
    expect(flameRows(gridUnderHat(SPRITES.wisp, 'cap'))).toBe(0);
    expect(gridUnderHat(SPRITES.wisp, 'halo')).toBe(SPRITES.wisp.grid);
  });

  it('floats a halo clear of the top of the pet', () => {
    const halo = placeHat(SPRITES.blob, 'halo')!;
    const top = SPRITES.blob.grid.findIndex((row) => row.replace(/\./g, '') !== '');
    expect(halo.top + halo.grid.length - 1).toBe(top - 2);
  });
});

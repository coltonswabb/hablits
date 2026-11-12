import { SPRITES, SPRITE_SIZE, spriteFace, SpriteDef } from '../pets/sprites';
import { allForms, petForm, PET_BRANCHES } from '../pets/forms';
import type { PetSpecies } from '../types';

describe('pet sprites', () => {
  // The original sprites by id, then every form of every evolution line by name
  const all: [string, SpriteDef][] = [
    ...(Object.entries(SPRITES) as [string, SpriteDef][]),
    ...allForms().map((sprite): [string, SpriteDef] => [`form ${sprite.name}`, sprite]),
  ];

  it.each(all)('%s is a full 16x16 grid using only its palette', (_id, sprite) => {
    expect(sprite.grid).toHaveLength(SPRITE_SIZE);
    sprite.grid.forEach((row) => {
      expect(row).toHaveLength(SPRITE_SIZE);
      [...row].forEach((cell) => {
        if (cell !== '.') expect(sprite.palette).toHaveProperty(cell);
      });
    });
  });

  it.each(all)('%s has a face that lands on its body in every expression', (_id, sprite) => {
    (['idle', 'happy', 'excited', 'sleepy'] as const).forEach((expression) => {
      const face = spriteFace(sprite, expression);
      expect(face.eyes.length).toBeGreaterThan(0);
      expect(face.mouth.length).toBeGreaterThan(0);
      const cells = [...face.eyes, ...face.mouth];
      cells.forEach(({ x, y }) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(SPRITE_SIZE);
        // Every face pixel sits on a drawn cell, not on empty space
        expect(sprite.grid[y][x]).not.toBe('.');
      });
    });
  });

  const species: PetSpecies[] = ['blob', 'pixel', 'paper', 'robot', 'droplet', 'slime', 'carmech', 'navi', 'fish', 'butterfly', 'star', 'deer', 'tiger', 'lion', 'hawk', 'dragon', 'delilah'];

  it.each(species)('%s has a form at every stage and on every path', (id) => {
    for (let stage = 0; stage <= 3; stage++) {
      [undefined, ...PET_BRANCHES].forEach((branch) => expect(petForm(id, stage, branch)).not.toBeNull());
    }
  });

  it.each(species)('%s changes form at every stage, and differs by path once grown', (id) => {
    const grids = (forms: (SpriteDef | null)[]) => new Set(forms.map((form) => form!.grid.join('')));
    expect(grids([0, 1, 2, 3].map((stage) => petForm(id, stage, 'body'))).size).toBe(4);
    [2, 3].forEach((stage) => expect(grids(PET_BRANCHES.map((branch) => petForm(id, stage, branch))).size).toBe(3));
  });

  it('gives every form its own name', () => {
    const names = allForms().map((form) => form.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toHaveLength(17 * 8);
  });
});

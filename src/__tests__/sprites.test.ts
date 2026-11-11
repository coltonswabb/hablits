import { SPRITES, SPRITE_SIZE, spriteFace, SpriteDef } from '../pets/sprites';

describe('pet sprites', () => {
  const all = Object.entries(SPRITES) as [string, SpriteDef][];

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
});

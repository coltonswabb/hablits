import { autoScrollSpeed, AUTO_SCROLL_EDGE, AUTO_SCROLL_MAX_SPEED } from '../utils/autoScroll';

describe('autoScrollSpeed', () => {
  const top = 100;
  const bottom = 700;

  it('does nothing in the middle', () => {
    expect(autoScrollSpeed(400, top, bottom)).toBe(0);
    expect(autoScrollSpeed(top + AUTO_SCROLL_EDGE, top, bottom)).toBe(0);
    expect(autoScrollSpeed(bottom - AUTO_SCROLL_EDGE, top, bottom)).toBe(0);
  });

  it('scrolls up near the top and down near the bottom', () => {
    expect(autoScrollSpeed(top + 10, top, bottom)).toBeLessThan(0);
    expect(autoScrollSpeed(bottom - 10, top, bottom)).toBeGreaterThan(0);
  });

  it('gets faster toward the edge and tops out past it', () => {
    const slow = autoScrollSpeed(bottom - 50, top, bottom);
    const fast = autoScrollSpeed(bottom - 5, top, bottom);
    expect(fast).toBeGreaterThan(slow);
    expect(autoScrollSpeed(bottom + 200, top, bottom)).toBe(AUTO_SCROLL_MAX_SPEED);
    expect(autoScrollSpeed(top - 200, top, bottom)).toBe(-AUTO_SCROLL_MAX_SPEED);
  });

  it('stays off when the viewport is too short to have a middle', () => {
    expect(autoScrollSpeed(10, 0, AUTO_SCROLL_EDGE)).toBe(0);
  });
});

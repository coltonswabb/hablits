import { swipeDirection as direction, swipeThreshold } from '../utils/swipe';

const THRESHOLD = swipeThreshold(400);
const swipeDirection = (distance: number, velocity: number) => direction(distance, velocity, THRESHOLD);

describe('swipeThreshold', () => {
  it('is a quarter of the screen width', () => {
    expect(swipeThreshold(400)).toBe(100);
  });

  it('never drops to zero when the width is unknown', () => {
    expect(swipeThreshold(0)).toBeGreaterThan(0);
  });
});

describe('swipeDirection', () => {
  it('snaps back on a small, slow drag', () => {
    expect(swipeDirection(20, 30)).toBe(0);
    expect(swipeDirection(-20, -30)).toBe(0);
  });

  it('commits a slow drag past the distance threshold', () => {
    expect(swipeDirection(THRESHOLD + 1, 0)).toBe(1);
    expect(swipeDirection(-THRESHOLD - 1, 0)).toBe(-1);
  });

  it('commits a short flick in the direction of travel', () => {
    expect(swipeDirection(15, 900)).toBe(1);
    expect(swipeDirection(-15, -900)).toBe(-1);
  });

  it('does not complete when a left drag is released drifting right', () => {
    expect(swipeDirection(-THRESHOLD - 40, 5)).toBe(-1);
    expect(swipeDirection(-20, 5)).toBe(0);
  });

  it('snaps back when a long drag is flicked back', () => {
    expect(swipeDirection(THRESHOLD + 40, -900)).toBe(0);
    expect(swipeDirection(-THRESHOLD - 40, 900)).toBe(0);
  });
});

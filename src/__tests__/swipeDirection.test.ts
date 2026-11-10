import { swipeDirection, SWIPE_THRESHOLD as THRESHOLD } from '../utils/swipe';

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

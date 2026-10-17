// ============================================
// CELEBRATE — one orchestrated completion event
// ============================================
// Haptics, sound and confetti used to fire from three different places
// with no shared timing (and the all-done sound played twice). Everything
// now goes through here so a completion FEELS like one event:
//
//   complete:  haptic ─40ms─▶ chime ─120ms─▶ mini confetti pop
//   allDone:   success haptic ─60ms─▶ fanfare ─150ms─▶ confetti ─350ms─▶ taps ─▶ 2nd burst
//   skip/fail: haptic + tone together
//
// Confetti is passed in as a callback because it lives in a component.
// ============================================

import { playSound, playCelebrationSequence } from './sounds';
import { mediumTap, warningTap, errorTap, successTap, celebrationTaps } from './haptics';
import { isReduceMotion } from './motion';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type CompletionKind = 'complete' | 'skip' | 'fail' | 'clear';

/** Immediate feedback for a single habit state change (haptic + sound). */
export async function completionFeedback(kind: CompletionKind): Promise<void> {
  switch (kind) {
    case 'complete':
      mediumTap();
      await wait(40);
      playSound('complete');
      return;
    case 'skip':
      warningTap();
      playSound('skip');
      return;
    case 'fail':
      errorTap();
      playSound('fail');
      return;
    case 'clear':
      mediumTap();
      return;
  }
}

/** The little burst next to a card after `completionFeedback('complete')`. */
export async function miniCelebration(onConfetti: () => void): Promise<void> {
  await wait(120);
  if (!isReduceMotion()) {
    playSound('pop');
    onConfetti();
  }
}

/** The whole day is done. */
export async function allDoneCelebration(onConfetti: () => void): Promise<void> {
  successTap();
  await wait(60);
  playCelebrationSequence();
  await wait(150);
  onConfetti();
  await wait(350);
  celebrationTaps();
  if (!isReduceMotion()) {
    await wait(150);
    onConfetti();
  }
}

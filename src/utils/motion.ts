// ============================================
// REDUCE MOTION
// ============================================
// Respects the iOS/Android "Reduce Motion" accessibility setting. The pet
// never stops moving by default; for people who find that uncomfortable
// (vestibular disorders, ADHD, or just preference) we keep the pet still
// and skip screen slide/scale transitions. Blinking is kept — it's subtle
// and makes the pet feel alive without motion.
// ============================================

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

let cached: boolean | null = null;
const listeners = new Set<(v: boolean) => void>();

function setValue(v: boolean) {
  cached = v;
  listeners.forEach((l) => l(v));
}

// Keep one subscription for the whole app
let started = false;
function ensureStarted() {
  if (started) return;
  started = true;
  AccessibilityInfo.isReduceMotionEnabled()
    .then(setValue)
    .catch(() => setValue(false));
  AccessibilityInfo.addEventListener('reduceMotionChanged', setValue);
}

/** True when the OS Reduce Motion setting is on. Updates live. */
export function useReduceMotion(): boolean {
  const [value, set] = useState<boolean>(cached ?? false);
  useEffect(() => {
    ensureStarted();
    if (cached !== null) set(cached);
    listeners.add(set);
    return () => {
      listeners.delete(set);
    };
  }, []);
  return value;
}

/** Non-hook read for code outside components (e.g. the confetti helper). */
export function isReduceMotion(): boolean {
  ensureStarted();
  return cached ?? false;
}

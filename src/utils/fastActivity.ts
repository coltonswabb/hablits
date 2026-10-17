// ============================================
// FAST LIVE ACTIVITY SYNC
// ============================================
// Keeps one Live Activity per active fast. Called whenever activeFasts (or
// the theme) changes. Idempotent: starting is skipped if we already run one
// for that habit with the same target; ending happens when the fast ends.
// ============================================

import { Platform } from 'react-native';
import { AppState } from '../types';
import { ThemeColors } from '../theme/colors';
import type { FastActivityProps } from '../widgets/FastLiveActivity';

type Tracked = { key: string; id: string; end: () => Promise<void>; update: (p: FastActivityProps) => Promise<void> };
const tracked = new Map<string, Tracked>(); // habitId -> activity
let bootstrapped = false;

export function buildFastProps(state: AppState, habitId: string, colors: ThemeColors): FastActivityProps | null {
  const fast = state.activeFasts[habitId];
  if (!fast) return null;
  const habit = state.habits.find((h) => h.id === habitId);
  const startMs = Date.parse(fast.startTime);
  const targetMs = Date.parse(fast.targetTime);
  if (!Number.isFinite(startMs) || !Number.isFinite(targetMs)) return null;
  return {
    habitName: habit?.name ?? 'Fast',
    startMs,
    targetMs,
    durationHours: fast.duration,
    accent: colors.accent,
    text: colors.text,
    muted: colors.muted,
  };
}

export async function syncFastActivities(state: AppState, colors: ThemeColors): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const { default: Fast } = await import('../widgets/FastLiveActivity');

    // First run after launch: any activities left over from a previous
    // process are ours but untracked — end them and start clean.
    if (!bootstrapped) {
      bootstrapped = true;
      for (const inst of Fast.getInstances()) {
        try {
          await inst.end('immediate');
        } catch {}
      }
    }

    const activeIds = new Set(Object.keys(state.activeFasts));

    // iOS ends a Live Activity ~8h after it starts (fasts run 12–36h). Anything
    // we track that the system no longer lists must be restarted.
    const live = new Set(Fast.getInstances().map((i) => i.getId()));
    for (const [habitId, t] of [...tracked.entries()]) {
      if (!live.has(t.id)) tracked.delete(habitId);
    }

    // End activities whose fast is gone
    for (const [habitId, t] of [...tracked.entries()]) {
      if (!activeIds.has(habitId)) {
        tracked.delete(habitId);
        try {
          await t.end();
        } catch {}
      }
    }

    // Start or update the rest
    for (const habitId of activeIds) {
      const props = buildFastProps(state, habitId, colors);
      if (!props) continue;
      const key = `${props.startMs}-${props.targetMs}-${props.accent}`;
      const existing = tracked.get(habitId);
      if (existing && existing.key === key) continue;
      if (existing) {
        existing.key = key;
        await existing.update(props);
        continue;
      }
      const activity = Fast.start(props, 'hablits://today', new Date(props.targetMs + 60 * 60 * 1000));
      tracked.set(habitId, {
        key,
        id: activity.getId(),
        end: () => activity.end('default', props),
        update: (p) => activity.update(p),
      });
    }
  } catch (error) {
    console.warn('Live Activity sync failed:', error);
  }
}

// ============================================
// ROUTINE LIVE ACTIVITY SYNC
// ============================================
// One Live Activity while the routine runner is open. The runner calls
// showRoutineStep() whenever the step or pause state changes and
// endRoutineActivity() when it closes or finishes. Calls are serialized so
// a quick step-step-close can't leave a stray activity behind.
// ============================================

import { Platform } from 'react-native';
import type { RoutineActivityProps } from '../widgets/RoutineLiveActivity';

type Running = { update: (p: RoutineActivityProps) => Promise<void>; end: () => Promise<void> };
let running: Running | null = null;
let cleaned = false;
let chain: Promise<void> = Promise.resolve();

function enqueue(job: () => Promise<void>): Promise<void> {
  chain = chain.then(job).catch((error) => console.warn('Routine Live Activity failed:', error));
  return chain;
}

export function showRoutineStep(props: RoutineActivityProps): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.resolve();
  return enqueue(async () => {
    const { default: Routine } = await import('../widgets/RoutineLiveActivity');
    // Activities left over from a previous process are ours but untracked
    if (!cleaned) {
      cleaned = true;
      for (const inst of Routine.getInstances()) {
        try {
          await inst.end('immediate');
        } catch {}
      }
    }
    if (running) {
      await running.update(props);
      return;
    }
    // Stale an hour after the step's time is up (or two hours in, for open-ended steps)
    const stale = new Date((props.endMs || props.startMs + 60 * 60 * 1000) + 60 * 60 * 1000);
    const activity = Routine.start(props, 'hablits://today', stale);
    running = { update: (p) => activity.update(p), end: () => activity.end('immediate') };
  });
}

export function endRoutineActivity(): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.resolve();
  return enqueue(async () => {
    const r = running;
    running = null;
    if (r) await r.end();
  });
}

// ============================================
// STREAK-AT-RISK NUDGE
// ============================================
// One quiet notification in the evening, and only when it matters: a streak
// of a week or more that today would break. Written in the pet's voice.
//
// Planned for today and tomorrow each time the app's data changes, so a
// nudge still arrives on a day the app is never opened. Ticking the habit
// re-plans and the nudge disappears.
// ============================================

import * as Notifications from 'expo-notifications';
import { AppState } from '../types';
import { dateStr } from './dates';
import { calculateStreak, isHabitActiveOn, isWeeklyGoalCovered, liveHabits, setStreakExemptions } from './habits';
import { isOnVacation } from './smartHabits';

export const NUDGE_HOUR = 20; // 8pm local
const MIN_STREAK = 7;
const NUDGE_TYPE = 'streak-nudge';

export type StreakNudge = { id: string; at: Date; title: string; body: string };

function atRisk(state: AppState, day: Date, now: Date): { name: string; streak: number }[] {
  const ds = dateStr(day);
  return liveHabits(state.habits)
    .filter((h) => isHabitActiveOn(h, day) && !(state.logs[ds] || []).includes(h.id))
    // "3 times a week" habits aren't at risk on a day they can still skip
    .filter((h) => !isWeeklyGoalCovered(state.logs, h, day, now))
    .map((h) => ({ name: h.name, streak: calculateStreak(state.logs, h.id, h, now) }))
    .filter((x) => x.streak >= MIN_STREAK)
    .sort((a, b) => b.streak - a.streak);
}

/** Pure planner: the nudges that should be scheduled right now. Exported for tests. */
export function planStreakNudges(state: AppState, now: Date = new Date()): StreakNudge[] {
  if (!state.notificationsEnabled || isOnVacation(state, now)) return [];
  setStreakExemptions(state);

  const pet = (state.petName || '').trim();
  const nudges: StreakNudge[] = [];

  for (const offset of [0, 1]) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    const at = new Date(day);
    at.setHours(NUDGE_HOUR, 0, 0, 0);
    if (at.getTime() <= now.getTime()) continue;

    const risky = atRisk(state, day, now);
    if (risky.length === 0) continue;

    const top = risky[0];
    const others = risky.length - 1;
    const body =
      others === 0
        ? `Your ${top.streak}-day ${top.name} streak is still open today. There's time.`
        : `${top.name} (${top.streak} days) and ${others} more streak${others === 1 ? '' : 's'} are still open today. There's time.`;
    nudges.push({
      id: `${NUDGE_TYPE}-${dateStr(day)}`,
      at,
      title: pet ? `${pet} is keeping your streak warm` : 'Your streak is still open',
      body,
    });
  }
  return nudges;
}

let chain: Promise<void> = Promise.resolve();

/** Make the OS match the plan. Never asks for permission by itself. */
export function syncStreakNudges(state: AppState): Promise<void> {
  chain = chain
    .then(async () => {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(
        scheduled
          .filter((n) => n.content.data?.type === NUDGE_TYPE)
          .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
      );
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;
      for (const n of planStreakNudges(state)) {
        await Notifications.scheduleNotificationAsync({
          identifier: n.id,
          content: { title: n.title, body: n.body, sound: true, data: { type: NUDGE_TYPE } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at, channelId: 'habits' },
        });
      }
    })
    .catch((error) => console.warn('Streak nudge sync failed:', error));
  return chain;
}

// ============================================
// PET VOICE
// ============================================
// What the pet says when you tap it, and how it greets you after time away.
// Pure functions of app state, so the lines always match what's on screen.
// Tone: warm, short, never guilt.
// ============================================

import { AppState } from '../types';
import { dateStr } from './dates';
import { calculateStreak, getActiveHabits, liveHabits } from './habits';
import { isOnVacation } from './smartHabits';

/** Days since the user last completed anything, or null with no history. Today counts as 0. */
export function daysSinceLastCompletion(state: Pick<AppState, 'logs'>, now: Date = new Date()): number | null {
  const today = dateStr(now);
  const last = Object.keys(state.logs)
    .filter((d) => d <= today && (state.logs[d] || []).length > 0)
    .sort()
    .pop();
  if (!last) return null;
  const ms = new Date(today + 'T12:00:00').getTime() - new Date(last + 'T12:00:00').getTime();
  return Math.round(ms / 86400000);
}

/** A welcome-back line after two or more days away; null otherwise. Goes away once something is done today. */
export function comebackLine(state: AppState, now: Date = new Date()): string | null {
  if (isOnVacation(state, now)) return null;
  const away = daysSinceLastCompletion(state, now);
  if (away === null || away < 3) return null;
  const who = (state.petName || '').trim() || 'Your pet';
  return away >= 14
    ? `${who} kept your spot. No catching up needed. One small thing today is plenty.`
    : `${who} missed you! Pick one easy habit and you're back.`;
}

/** The pet gets one treat for every habit ever completed. */
export function totalTreats(state: AppState): number {
  return Object.values(state.logs).reduce((count, ids) => count + ids.length, 0);
}

/**
 * The line for a tap on the pet. `tap` rotates through the options that fit
 * right now, so repeated taps say different things.
 */
export function petTapLine(state: AppState, tap: number, now: Date = new Date()): string {
  const today = dateStr(now);
  const active = getActiveHabits(state.habits, now, 'all');
  const doneIds = state.logs[today] || [];
  const left = active.filter((h) => !doneIds.includes(h.id));
  const best = liveHabits(state.habits).reduce((b, h) => Math.max(b, calculateStreak(state.logs, h.id, h, now)), 0);
  const hour = now.getHours();
  const snacks = state.snacks ?? 0;
  const treats = totalTreats(state);

  const lines: string[] = [];

  if (isOnVacation(state, now)) {
    lines.push('Enjoy the break. Your streaks are safe with me.', "I'm on vacation too. See you when you're back!");
  } else if (active.length === 0) {
    lines.push('Nothing on the list today. A free day!', 'Want to add a habit? Tap the + down there.');
  } else if (left.length === 0) {
    lines.push('All done! That was a good day.', "Everything's ticked. I'm so proud of us.", 'Nothing left today. Rest up.');
  } else {
    if (left.length === 1) lines.push(`Just ${left[0].name} left. So close!`);
    else lines.push(`${left.length} to go. Want to start with ${left[0].name}?`);
    if (doneIds.length === 0) lines.push(hour < 12 ? 'Good morning! Ready when you are.' : 'One small one gets us going.');
    else lines.push(`${doneIds.length} down already. Nice.`);
    if (hour >= 20) lines.push("It's getting late, but there's still time.");
  }

  if (best >= 7) lines.push(`${best} days in a row on your best streak. I'm counting!`);
  if (snacks > 0) lines.push(`I've got ${snacks} snack${snacks === 1 ? '' : 's'} saved in case you ever miss a day.`);
  if (treats > 0) lines.push(`I've had ${treats} treat${treats === 1 ? '' : 's'} so far. One for every habit you finish. Yum.`);
  lines.push('That tickles!');

  return lines[Math.abs(tap) % lines.length];
}

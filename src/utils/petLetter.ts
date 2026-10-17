// ============================================
// THE SUNDAY LETTER
// ============================================
// Once a week the pet writes a short note about the week that just ended.
// It's built from the same data as Stats, but it's not a dashboard — it's
// one specific observation and a bit of character.
//
// Shown Monday & Tuesday for the previous Mon–Sun, dismissible, and
// deterministic for a given week so it doesn't change under the reader.
// ============================================

import { AppState, PetMood } from '../types';
import { dateStr, startOfWeek } from './dates';
import { getActiveHabits, calculateStreak } from './habits';
import { PetStage, STAGE_NAMES } from './evolution';

export type WeeklyRecap = {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // Sunday
  scheduled: number;
  completed: number;
  pct: number; // 0..1
  perfectDays: number;
  bestDay: { label: string; pct: number } | null;
  topHabit: { name: string; done: number; scheduled: number } | null;
  strugglingHabit: { name: string; done: number; scheduled: number } | null;
  deltaVsLastWeek: number | null; // completed − last week's completed, null if no history
  longestStreakNow: number;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function summarizeWeek(state: AppState, monday: Date) {
  const days = weekDays(monday);
  let scheduled = 0;
  let completed = 0;
  let perfectDays = 0;
  let bestDay: WeeklyRecap['bestDay'] = null;
  const perHabit = new Map<string, { name: string; done: number; scheduled: number }>();

  for (const d of days) {
    const active = getActiveHabits(state.habits, d, 'all');
    if (active.length === 0) continue;
    const done = new Set(state.logs[dateStr(d)] || []);
    let dayDone = 0;
    for (const h of active) {
      const entry = perHabit.get(h.id) || { name: h.name, done: 0, scheduled: 0 };
      entry.scheduled++;
      if (done.has(h.id)) {
        entry.done++;
        dayDone++;
      }
      perHabit.set(h.id, entry);
    }
    scheduled += active.length;
    completed += dayDone;
    const pct = dayDone / active.length;
    if (pct === 1) perfectDays++;
    if (!bestDay || pct > bestDay.pct) bestDay = { label: DAY_NAMES[d.getDay()], pct };
  }
  return { scheduled, completed, perfectDays, bestDay, perHabit };
}

/** Recap of the Mon–Sun week BEFORE the one containing `today`. */
export function buildWeeklyRecap(state: AppState, today: Date = new Date()): WeeklyRecap | null {
  const thisMonday = startOfWeek(today);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);

  const week = summarizeWeek(state, lastMonday);
  if (week.scheduled === 0) return null;

  const prevMonday = new Date(lastMonday);
  prevMonday.setDate(lastMonday.getDate() - 7);
  const prev = summarizeWeek(state, prevMonday);

  const habits = [...week.perHabit.values()].filter((h) => h.scheduled > 0);
  const byRate = (a: typeof habits[number], b: typeof habits[number]) => b.done / b.scheduled - a.done / a.scheduled || b.done - a.done;
  const sorted = [...habits].sort(byRate);
  const topHabit = sorted[0] && sorted[0].done > 0 ? sorted[0] : null;
  const worst = sorted[sorted.length - 1];
  const strugglingHabit = worst && habits.length > 1 && worst.done / worst.scheduled < 0.5 && worst !== topHabit ? worst : null;

  const longestStreakNow = state.habits.reduce((b, h) => Math.max(b, calculateStreak(state.logs, h.id, h, today)), 0);

  return {
    weekStart: dateStr(lastMonday),
    weekEnd: dateStr(lastSunday),
    scheduled: week.scheduled,
    completed: week.completed,
    pct: week.completed / week.scheduled,
    perfectDays: week.perfectDays,
    bestDay: week.bestDay,
    topHabit,
    strugglingHabit,
    deltaVsLastWeek: prev.scheduled > 0 ? week.completed - prev.completed : null,
    longestStreakNow,
  };
}

/** The letter is shown on Monday and Tuesday. */
export function isLetterSeason(today: Date = new Date()): boolean {
  const d = today.getDay();
  return d === 1 || d === 2;
}

export type PetLetter = {
  weekStart: string;
  greeting: string;
  paragraphs: string[];
  signoff: string;
  mood: PetMood;
};

// Small deterministic picker so the same week always gets the same lines
function pick<T>(options: T[], seed: string, salt: number): T {
  let h = salt;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return options[h % options.length];
}

export function composeLetter(recap: WeeklyRecap, stage: PetStage): PetLetter {
  const seed = recap.weekStart;
  const p = Math.round(recap.pct * 100);
  const paragraphs: string[] = [];
  let mood: PetMood = 'happy';

  const greeting = pick(['Hey.', 'So, last week.', 'Quick note from me.', 'Okay, week in review.'], seed, 1);

  // 1. The headline, by tier
  if (recap.pct >= 0.85) {
    mood = 'celebrate';
    paragraphs.push(
      pick(
        [
          `${recap.completed} of ${recap.scheduled}. That's ${p}%. I don't want to make it weird, but I was kind of strutting.`,
          `${p}% of everything you set out to do. I've been in a very good mood and now you know why.`,
          `You did ${recap.completed} things you said you'd do. Out of ${recap.scheduled}. I counted twice.`,
        ],
        seed,
        2
      )
    );
  } else if (recap.pct >= 0.6) {
    mood = 'excited';
    paragraphs.push(
      pick(
        [
          `${recap.completed} out of ${recap.scheduled} — a solid week. Not perfect. Perfect is boring and also not the point.`,
          `${p}%. I'll take it. Most weeks that look like this are the ones that quietly add up.`,
          `Good week. ${recap.completed} of ${recap.scheduled} done, and the ones you missed didn't turn into a slide.`,
        ],
        seed,
        2
      )
    );
  } else if (recap.pct >= 0.3) {
    mood = 'curious';
    paragraphs.push(
      pick(
        [
          `${recap.completed} of ${recap.scheduled}. A mixed week. I'm not worried — you came back, and that's the whole trick.`,
          `${p}% this week. Some weeks are like that. The habits are still here and so am I.`,
          `Rougher week — ${recap.completed} out of ${recap.scheduled}. For what it's worth, the days you showed up, you really showed up.`,
        ],
        seed,
        2
      )
    );
  } else {
    mood = 'idle';
    paragraphs.push(
      pick(
        [
          `Quiet week. ${recap.completed} of ${recap.scheduled}. I'm not going to pretend otherwise, and I'm also not going anywhere.`,
          `Hard week, by the numbers. Here's the thing though: you opened the app. That counts for more than it feels like.`,
          `${recap.completed} this week. If something's in the way, it might be worth making the list smaller instead of trying harder.`,
        ],
        seed,
        2
      )
    );
  }

  // 2. One specific observation
  const obs: string[] = [];
  if (recap.perfectDays >= 3) obs.push(`${recap.perfectDays} days where you cleared everything. Those are my favourite days.`);
  if (recap.topHabit && recap.topHabit.done === recap.topHabit.scheduled && recap.topHabit.scheduled >= 3)
    obs.push(`"${recap.topHabit.name}" — every single time. That one's becoming part of you.`);
  else if (recap.topHabit) obs.push(`"${recap.topHabit.name}" was your steadiest — ${recap.topHabit.done} of ${recap.topHabit.scheduled}.`);
  if (recap.strugglingHabit)
    obs.push(
      `"${recap.strugglingHabit.name}" got ${recap.strugglingHabit.done} of ${recap.strugglingHabit.scheduled}. Not a judgment — maybe it wants a different time of day, or a smaller version.`
    );
  if (recap.bestDay && recap.pct < 0.85) obs.push(`${recap.bestDay.label} was your best day. Worth noticing what was different about it.`);
  if (recap.deltaVsLastWeek !== null && recap.deltaVsLastWeek >= 3) obs.push(`Up ${recap.deltaVsLastWeek} on the week before. Momentum is a real thing.`);
  if (recap.deltaVsLastWeek !== null && recap.deltaVsLastWeek <= -3 && recap.pct >= 0.3) obs.push(`Down ${-recap.deltaVsLastWeek} from the week before. Dips happen. Watch for two in a row.`);
  if (obs.length) paragraphs.push(pick(obs, seed, 3));
  if (obs.length > 1) {
    const second = pick(obs.filter((o) => o !== paragraphs[paragraphs.length - 1]), seed, 4);
    if (second) paragraphs.push(second);
  }

  // 3. Streak line
  if (recap.longestStreakNow >= 7) paragraphs.push(`Current streak: ${recap.longestStreakNow} days. I'm keeping count so you don't have to.`);

  const signoffs: Record<PetStage, string[]> = {
    0: ['See you tomorrow.', 'Same time tomorrow?', '— your pet (still new here)'],
    1: ['See you tomorrow. I know you\'ll be there.', '— your Companion', 'Proud of you. Tomorrow, then.'],
    2: ['Thirty days taught me you come back. Tomorrow.', '— your Veteran', 'Steady as ever. See you tomorrow.'],
    3: ['A Legend doesn\'t need a pep talk. But here\'s one anyway: tomorrow.', '— your Legend', 'Hundred-day pets don\'t worry. See you tomorrow.'],
  };
  const signoff = pick(signoffs[stage], seed, 5);

  return { weekStart: recap.weekStart, greeting, paragraphs, signoff, mood };
}

/** Convenience for the UI: the letter to show right now, or null. */
export function currentLetter(state: AppState, stage: PetStage, today: Date = new Date()): PetLetter | null {
  if (!isLetterSeason(today)) return null;
  const recap = buildWeeklyRecap(state, today);
  if (!recap) return null;
  if (state.lastLetterDismissed === recap.weekStart) return null;
  return composeLetter(recap, stage);
}

export { STAGE_NAMES };

// ============================================
// NOTIFICATION UTILITIES
// ============================================
// Schedule notifications for fasting completion and daily habit reminders
// ============================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ActiveFast, Habit, AppState, HabitSchedule } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  // Configure notification channels for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('fasting', {
      name: 'Fasting Timers',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF8C42',
    });

    await Notifications.setNotificationChannelAsync('habits', {
      name: 'Daily Habit Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#60a5fa',
    });
  }

  return true;
}

/**
 * Schedule a notification for when a fast completes
 */
export async function scheduleFastCompletionNotification(
  fast: ActiveFast,
  habitName: string
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const targetTime = new Date(fast.targetTime);
    const now = new Date();

    // Calculate seconds until notification
    const secondsUntilTarget = Math.floor((targetTime.getTime() - now.getTime()) / 1000);

    if (secondsUntilTarget <= 0) {
      // Fast is already complete
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${habitName} Complete! 🎉`,
        body: `Your ${fast.duration}-hour fast is complete. Great job!`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTarget,
        channelId: 'fasting',
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelFastNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all fasting-related notifications
 */
export async function cancelAllFastingNotifications(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.title?.includes('Fast')) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

// iOS keeps at most 64 pending local notifications per app. Leave headroom
// for fasting timers and the general reminder.
const MAX_HABIT_TRIGGERS = 56;

export type ReminderPlan = {
  /** One entry per scheduled notification */
  triggers: Array<{
    habitId: string | null; // null = the general "time for your habits" reminder
    title: string;
    body: string;
    hour: number;
    minute: number;
    weekday: number | null; // 1 = Sunday … 7 = Saturday, null = daily
  }>;
  /** Habits that have no time of their own and fall under the general reminder */
  generalHabitNames: string[];
};

function parseTime(t: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

/** Days a scheduled habit should fire on, as [Sun..Sat] booleans. */
function reminderDays(habit: Habit, schedule: HabitSchedule): boolean[] {
  const active = Array.isArray(habit.days) && habit.days.length === 7 ? habit.days : [true, true, true, true, true, true, true];
  if (schedule.recurring === 'custom' && Array.isArray(schedule.recurringDays) && schedule.recurringDays.length === 7) {
    return active.map((a, i) => a && schedule.recurringDays![i]);
  }
  return active;
}

/**
 * Pure planner: which notifications should exist for this state.
 *  - a habit with a Day Plan time gets its own reminder at that time, on the
 *    days it's scheduled (daily trigger if every day, else one per weekday)
 *  - habits without a time share the general reminder at notificationTime
 * Exported for tests.
 */
export function planHabitReminders(state: AppState): ReminderPlan {
  const plan: ReminderPlan = { triggers: [], generalHabitNames: [] };
  if (!state.notificationsEnabled) return plan;

  const habits = [...state.habits].sort((a, b) => (a.order || 999) - (b.order || 999));
  const perHabit: ReminderPlan['triggers'] = [];

  for (const habit of habits) {
    const schedule = state.dayPlanSchedules?.[habit.id];
    const time = schedule?.time ? parseTime(schedule.time) : null;
    if (!schedule || !time) {
      plan.generalHabitNames.push(habit.name);
      continue;
    }
    const days = reminderDays(habit, schedule);
    const stepNote = habit.isRoutine && habit.steps?.length ? ` · ${habit.steps.length} steps` : '';
    const base = { habitId: habit.id, title: habit.name, body: `Time for ${habit.name}${stepNote}`, ...time };

    if (days.every(Boolean)) {
      perHabit.push({ ...base, weekday: null });
    } else if (days.some(Boolean)) {
      days.forEach((on, i) => on && perHabit.push({ ...base, weekday: i + 1 }));
    }
  }

  // Stay under the OS cap: collapse weekly triggers to daily if we'd overflow.
  if (perHabit.length > MAX_HABIT_TRIGGERS) {
    const seen = new Set<string>();
    const collapsed: ReminderPlan['triggers'] = [];
    for (const t of perHabit) {
      if (t.habitId && seen.has(t.habitId)) continue;
      if (t.habitId) seen.add(t.habitId);
      collapsed.push({ ...t, weekday: null });
    }
    plan.triggers.push(...collapsed.slice(0, MAX_HABIT_TRIGGERS));
  } else {
    plan.triggers.push(...perHabit);
  }

  if (plan.generalHabitNames.length > 0) {
    const names = plan.generalHabitNames.slice(0, 3).join(', ');
    const more = plan.generalHabitNames.length > 3 ? ` and ${plan.generalHabitNames.length - 3} more` : '';
    plan.triggers.push({
      habitId: null,
      title: 'Time for your habits! 💪',
      body: `Don't forget: ${names}${more}`,
      hour: state.notificationTime.hour,
      minute: state.notificationTime.minute,
      weekday: null,
    });
  }
  return plan;
}

/**
 * Make the OS match the plan: cancel every habit reminder and schedule the
 * current set. Safe to call often — the planner is cheap and the OS calls
 * are batched.
 */
export async function syncHabitReminders(state: AppState): Promise<void> {
  try {
    await cancelAllHabitReminders();
    if (!state.notificationsEnabled) return;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const { triggers } = planHabitReminders(state);
    await Promise.all(
      triggers.map((t) =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: t.title,
            body: t.body,
            sound: true,
            data: { type: 'habit-reminder', habitId: t.habitId },
          },
          trigger:
            t.weekday === null
              ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: t.hour, minute: t.minute, channelId: 'habits' }
              : { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: t.weekday, hour: t.hour, minute: t.minute, channelId: 'habits' },
        })
      )
    );
  } catch (error) {
    console.error('Error syncing habit reminders:', error);
  }
}

/** @deprecated use syncHabitReminders(state) */
export async function scheduleDailyHabitReminders(habits: Habit[], hour: number, minute: number): Promise<void> {
  await syncHabitReminders({
    habits,
    notificationsEnabled: true,
    notificationTime: { hour, minute },
    dayPlanSchedules: {},
  } as unknown as AppState);
}

/**
 * Cancel all habit reminder notifications
 */
export async function cancelAllHabitReminders(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'habit-reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling habit reminders:', error);
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

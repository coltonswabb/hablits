// ============================================
// NOTIFICATION UTILITIES
// ============================================
// Schedule notifications for fasting completion and daily habit reminders
// ============================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ActiveFast, Habit } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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

/**
 * Schedule daily habit reminders at a specific time
 * @param habits - List of habits to remind about
 * @param hour - Hour of day (0-23)
 * @param minute - Minute of hour (0-59)
 */
export async function scheduleDailyHabitReminders(
  habits: Habit[],
  hour: number,
  minute: number
): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Cancel existing habit reminders first
    await cancelAllHabitReminders();

    // Don't schedule if no habits
    if (habits.length === 0) return;

    // Schedule a daily repeating notification
    const habitCount = habits.length;
    const habitNames = habits.slice(0, 3).map(h => h.name).join(', ');
    const moreCount = habitCount > 3 ? ` and ${habitCount - 3} more` : '';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for your habits! 💪`,
        body: `Don't forget: ${habitNames}${moreCount}`,
        sound: true,
        data: { type: 'habit-reminder' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
        channelId: 'habits',
      },
    });
  } catch (error) {
    console.error('Error scheduling habit reminders:', error);
  }
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

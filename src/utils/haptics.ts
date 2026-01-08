// ============================================
// HAPTIC FEEDBACK UTILITY
// ============================================
// Provides tactile feedback for user interactions
// Works on iOS and Android (not on web)
// ============================================

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let hapticsEnabled = true;

// Enable/disable haptics
export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = enabled;
};

// Light tap - for button presses, selections
export const lightTap = async () => {
  if (!hapticsEnabled || Platform.OS === 'web') return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.warn('Haptics error:', error);
  }
};

// Medium impact - for habit completion
export const mediumTap = async () => {
  if (!hapticsEnabled || Platform.OS === 'web') return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.warn('Haptics error:', error);
  }
};

// Heavy impact - for celebrations, important actions
export const heavyTap = async () => {
  if (!hapticsEnabled || Platform.OS === 'web') return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.warn('Haptics error:', error);
  }
};

// Success notification - for achievements
export const successTap = async () => {
  if (!hapticsEnabled || Platform.OS === 'web') return;

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.warn('Haptics error:', error);
  }
};

// Warning notification - for skips or fails
export const warningTap = async () => {
  if (!hapticsEnabled || Platform.OS === 'web') return;

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.warn('Haptics error:', error);
  }
};

// Error notification - for failures
export const errorTap = async () => {
  if (!hapticsEnabled || Platform.OS === 'web') return;

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.warn('Haptics error:', error);
  }
};

// Selection change - for scrolling through options
export const selectionTap = async () => {
  if (!hapticsEnabled || Platform.OS === 'web') return;

  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.warn('Haptics error:', error);
  }
};

// Celebration sequence - multiple taps for big achievements
export const celebrationTaps = async () => {
  if (!hapticsEnabled || Platform.OS === 'web') return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);
  } catch (error) {
    console.warn('Haptics error:', error);
  }
};

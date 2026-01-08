// ============================================
// SOUND EFFECTS UTILITY
// ============================================
// Provides simple sound effects using expo-av
// Uses programmatic tones (no audio files needed)
// ============================================

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Cache for sound objects
let soundsEnabled = true;

// Initialize audio mode (required for iOS)
export const initializeAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch (error) {
    console.warn('Failed to initialize audio:', error);
  }
};

// Enable/disable sounds
export const setSoundsEnabled = (enabled: boolean) => {
  soundsEnabled = enabled;
};

// Play a simple beep tone
// Note: For web and basic implementation, we'll use a simple approach
// For production, you'd want actual sound files in an assets folder
export const playSound = async (type: 'complete' | 'skip' | 'fail' | 'celebrate' | 'pop') => {
  if (!soundsEnabled) return;

  try {
    // Different frequencies for different actions
    const frequencies: Record<typeof type, number> = {
      complete: 800,  // Happy ding
      skip: 400,      // Neutral tone
      fail: 200,      // Low tone
      celebrate: 1000, // High celebration
      pop: 600,       // Confetti pop
    };

    // For web, we can use the Web Audio API
    if (Platform.OS === 'web') {
      playWebTone(frequencies[type], 0.1);
    } else {
      // For native, we'll need sound files
      // For now, just log (you can add actual .mp3/.wav files later)
      console.log(`Playing ${type} sound at ${frequencies[type]}Hz`);
      // TODO: Load actual sound files from assets
    }
  } catch (error) {
    console.warn('Failed to play sound:', error);
  }
};

// Web Audio API implementation
const playWebTone = (frequency: number, duration: number) => {
  if (typeof window === 'undefined' || !window.AudioContext) return;

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Envelope for smoother sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn('Web audio error:', error);
  }
};

// Play a quick multi-tone celebration
export const playCelebrationSequence = async () => {
  if (!soundsEnabled) return;

  // Quick ascending tone sequence
  const tones = [600, 750, 900, 1200];
  for (let i = 0; i < tones.length; i++) {
    setTimeout(() => {
      if (Platform.OS === 'web') {
        playWebTone(tones[i], 0.08);
      }
    }, i * 80);
  }
};

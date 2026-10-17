// ============================================
// SOUND EFFECTS
// ============================================
// Short synthesized chimes in assets/sfx, played with expo-audio on native.
// On web we fall back to Web Audio tones (no files needed).
//
// All playback goes through playSound()/playCelebrationSequence() and is
// gated by setSoundsEnabled(), which App keeps in sync with the Settings
// toggle. Players are created once and reused; a sound that's already
// playing is restarted from 0 so rapid taps don't pile up.
// ============================================

import { Platform } from 'react-native';
import type { AudioPlayer } from 'expo-audio';

export type SoundName = 'complete' | 'skip' | 'fail' | 'celebrate' | 'pop' | 'allday';

const SOURCES: Record<SoundName, number> = {
  complete: require('../../assets/sfx/complete.wav'),
  skip: require('../../assets/sfx/skip.wav'),
  fail: require('../../assets/sfx/fail.wav'),
  celebrate: require('../../assets/sfx/celebrate.wav'),
  pop: require('../../assets/sfx/pop.wav'),
  allday: require('../../assets/sfx/allday.wav'),
};

const VOLUME: Record<SoundName, number> = {
  complete: 0.7,
  skip: 0.5,
  fail: 0.55,
  celebrate: 0.8,
  pop: 0.6,
  allday: 0.8,
};

let soundsEnabled = true;
let players: Partial<Record<SoundName, AudioPlayer>> | null = null;
let audioModule: typeof import('expo-audio') | null = null;

export const setSoundsEnabled = (enabled: boolean) => {
  soundsEnabled = enabled;
};

/** Configure the audio session (play even when the ringer is silenced) and preload players. */
export const initializeAudio = async () => {
  if (Platform.OS === 'web') return;
  try {
    audioModule = await import('expo-audio');
    await audioModule.setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers', // never duck the user's music for a 0.5s chime
    });
    players = {};
    (Object.keys(SOURCES) as SoundName[]).forEach((name) => {
      const p = audioModule!.createAudioPlayer(SOURCES[name]);
      p.volume = VOLUME[name];
      players![name] = p;
    });
  } catch (error) {
    console.warn('Failed to initialize audio:', error);
  }
};

async function playNative(name: SoundName) {
  if (!players || !players[name]) return;
  const p = players[name]!;
  try {
    await p.seekTo(0);
    p.play();
  } catch (error) {
    console.warn('Failed to play sound:', error);
  }
}

export const playSound = async (type: SoundName) => {
  if (!soundsEnabled) return;
  if (Platform.OS === 'web') {
    const frequencies: Record<SoundName, number> = { complete: 800, skip: 400, fail: 200, celebrate: 1000, pop: 600, allday: 900 };
    playWebTone(frequencies[type], 0.1);
    return;
  }
  await playNative(type);
};

/** Ascending flourish for finishing the whole day. */
export const playCelebrationSequence = async () => {
  if (!soundsEnabled) return;
  if (Platform.OS === 'web') {
    [600, 750, 900, 1200].forEach((f, i) => setTimeout(() => playWebTone(f, 0.08), i * 80));
    return;
  }
  await playNative('celebrate');
};

// ---- Web Audio fallback ----
const playWebTone = (frequency: number, duration: number) => {
  if (typeof window === 'undefined' || !(window as any).AudioContext) return;
  try {
    const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Web audio error:', error);
  }
};

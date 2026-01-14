// ============================================
// HABLITS TYPE DEFINITIONS
// ============================================
// These types define the "shape" of your data.
// TypeScript will warn you if you try to use
// data incorrectly anywhere in your app.
// ============================================

// A step within a routine
export interface RoutineStep {
  id: string;
  name: string;
  duration?: number;            // Optional duration in minutes
  order: number;                // Order within the routine
}

// A single habit
export interface Habit {
  id: string;
  name: string;
  weeklyGoal: number;           // 1-7 days per week
  identityId: string;           // Links to an Identity
  createdAt: string;            // ISO date string
  days: boolean[];              // [Sun, Mon, Tue, Wed, Thu, Fri, Sat] - which days it's active
  order: number;                // Display order in lists
  isRoutine?: boolean;          // Whether this is a routine habit
  steps?: RoutineStep[];        // Steps for routine habits
}

// An identity (grouping for habits)
export interface Identity {
  id: string;
  name: string;
  color: string;                // Hex color like "#3ddc97"
}

// Marks for a specific day (skip/fail status)
export interface DayMarks {
  skip: string[];               // Array of habit IDs that were skipped
  fail: string[];               // Array of habit IDs that were failed
}

// Schedule configuration for a habit
export interface HabitSchedule {
  time: string;                 // "HH:MM" format
  duration: number;             // Duration in minutes
  recurring: 'once' | 'daily' | 'custom'; // Recurrence type
  recurringDays?: boolean[];    // [Sun, Mon, Tue, Wed, Thu, Fri, Sat] - for 'custom' recurrence
}

// Active fast timer (secret feature for habits named "Fast")
export interface ActiveFast {
  habitId: string;              // Which habit is fasting
  startTime: string;            // ISO timestamp when fast started
  duration: number;             // Duration in hours (12, 16, 18, 24, or 36)
  targetTime: string;           // ISO timestamp when fast should complete
}

// The complete app state
export interface AppState {
  theme: ThemeName;
  sfxEnabled: boolean;
  hapticsEnabled: boolean;             // Whether haptic feedback is enabled
  customAccentColor?: string;          // Custom accent color for light/dark/superdark themes
  notificationsEnabled: boolean;       // Whether daily habit reminders are enabled
  notificationTime: { hour: number; minute: number }; // Time for daily reminders (default 9:00 AM)
  identities: Identity[];
  currentIdentityFilter: string; // 'all' or an identity ID
  habits: Habit[];
  logs: Record<string, string[]>;      // { "2024-01-15": ["habit-id-1", "habit-id-2"] }
  marks: Record<string, DayMarks>;     // { "2024-01-15": { skip: [], fail: [] } }
  dayPlanTimes: Record<string, string>; // DEPRECATED: Use dayPlanSchedules instead { "habit-id": "09:00" }
  dayPlanSchedules: Record<string, HabitSchedule>; // { "habit-id": { time: "09:00", duration: 30, recurring: 'daily' } }
  notes: Record<string, Record<string, string>>; // { "2024-01-15": { "habit-id": "note text" } }
  routineStepLogs: Record<string, Record<string, string[]>>; // { "2024-01-15": { "habit-id": ["step-id-1", "step-id-2"] } }
  hasCompletedOnboarding: boolean;
  petSpecies: PetSpecies;              // Selected pet species
  petHat: HatType;                     // Selected pet hat
  activeFasts: Record<string, ActiveFast>; // { "habit-id": { startTime, duration, targetTime } } - Secret fasting timers
}

// Available theme names
export type ThemeName =
  | 'light'
  | 'dark'
  | 'superdark'
  | 'retro'
  | 'chibi'
  | 'sunshine'
  | 'gameboy'
  | 'racer'
  | 'paper'
  | 'cyber'
  | 'ocean'
  | 'sunset'
  | 'cosmic'
  | 'forest'
  | 'bengal'
  | 'lion'
  | 'ladyhawke'
  | 'sakura';

// Tab names for navigation
export type TabName = 'today' | 'week' | 'calendar' | 'dayplan' | 'stats';

// Pet species (for the virtual pet feature)
export type PetSpecies =
  | 'blob'
  | 'pixel'
  | 'paper'
  | 'robot'
  | 'droplet'
  | 'slime'
  | 'carmech'
  | 'navi'
  | 'fish'
  | 'butterfly'
  | 'star'
  | 'deer'
  | 'tiger'
  | 'lion'
  | 'hawk'
  | 'dragon';

// Pet mood based on habit completion
export type PetMood = 'idle' | 'curious' | 'happy' | 'excited' | 'celebrate';

// Hat types for the pet
export type HatType =
  | 'none'
  | 'cap'
  | 'visor'
  | 'snapback'
  | 'beanie'
  | 'beret'
  | 'flatcap'
  | 'party'
  | 'jester'
  | 'cone'
  | 'tophat'
  | 'bowler'
  | 'fedora'
  | 'wizard'
  | 'sorcerer'
  | 'mage'
  | 'crown'
  | 'laurel'
  | 'tiara'
  | 'sombrero'
  | 'safari'
  | 'straw'
  | 'halo'
  | 'circlet'
  | 'sun'
  | 'viking'
  | 'astronaut';

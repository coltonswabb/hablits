// ============================================
// APP STATE CONTEXT
// ============================================
// This manages ALL the app's data:
// - Habits
// - Completion logs
// - Identities
// - Settings
//
// Uses React Context + useReducer for
// predictable state updates.
// ============================================

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Habit, Identity, DayMarks, HabitSchedule, PetSpecies, HatType } from '../types';
import { generateId, todayStr } from '../utils';

// Storage key for AsyncStorage
const STORAGE_KEY = 'hablits_state_v1';

// Default state for new users
const defaultState: AppState = {
  theme: 'light',
  sfxEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: false,
  notificationTime: { hour: 9, minute: 0 }, // 9:00 AM default
  identities: [{ id: 'general', name: 'General', color: '#3ddc97' }],
  currentIdentityFilter: 'all',
  habits: [],
  logs: {},
  marks: {},
  dayPlanTimes: {}, // Deprecated but kept for backward compatibility
  dayPlanSchedules: {},
  notes: {},
  routineStepLogs: {},
  hasCompletedOnboarding: false,
  petSpecies: 'blob',
  petHat: 'none',
  activeFasts: {}, // Secret fasting timer feature
};

// ============================================
// ACTIONS
// ============================================
// Actions describe WHAT happened.
// The reducer decides HOW state changes.

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'ADD_HABIT'; payload: Omit<Habit, 'id' | 'createdAt'> }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'REORDER_HABITS'; payload: Habit[] }
  | { type: 'TOGGLE_HABIT'; payload: { habitId: string; date: string } }
  | { type: 'SKIP_HABIT'; payload: { habitId: string; date: string } }
  | { type: 'FAIL_HABIT'; payload: { habitId: string; date: string } }
  | { type: 'CLEAR_DAY'; payload: string }
  | { type: 'ADD_IDENTITY'; payload: Omit<Identity, 'id'> }
  | { type: 'UPDATE_IDENTITY'; payload: Identity }
  | { type: 'DELETE_IDENTITY'; payload: string }
  | { type: 'SET_IDENTITY_FILTER'; payload: string }
  | { type: 'SET_DAY_PLAN_TIME'; payload: { habitId: string; time: string | null } }
  | { type: 'SET_DAY_PLAN_SCHEDULE'; payload: { habitId: string; schedule: HabitSchedule | null } }
  | { type: 'SET_SFX_ENABLED'; payload: boolean }
  | { type: 'SET_HAPTICS_ENABLED'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS_ENABLED'; payload: boolean }
  | { type: 'SET_NOTIFICATION_TIME'; payload: { hour: number; minute: number } }
  | { type: 'SET_NOTE'; payload: { habitId: string; date: string; note: string } }
  | { type: 'DELETE_NOTE'; payload: { habitId: string; date: string } }
  | { type: 'TOGGLE_ROUTINE_STEP'; payload: { habitId: string; stepId: string; date: string } }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'SET_PET_SPECIES'; payload: PetSpecies }
  | { type: 'SET_PET_HAT'; payload: HatType }
  | { type: 'START_FAST'; payload: { habitId: string; duration: number; startTime: string } }
  | { type: 'UPDATE_FAST_START_TIME'; payload: { habitId: string; startTime: string } }
  | { type: 'END_FAST'; payload: string };

// ============================================
// REDUCER
// ============================================
// Pure function that takes current state + action
// and returns NEW state (never mutates old state)

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      // Ensure routineStepLogs, activeFasts, and hapticsEnabled exist for backward compatibility
      return {
        ...action.payload,
        routineStepLogs: action.payload.routineStepLogs || {},
        activeFasts: action.payload.activeFasts || {},
        hapticsEnabled: action.payload.hapticsEnabled !== undefined ? action.payload.hapticsEnabled : true,
      };

    case 'ADD_HABIT': {
      const newHabit: Habit = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
        order: state.habits.length + 1,
      };
      return {
        ...state,
        habits: [...state.habits, newHabit],
      };
    }

    case 'UPDATE_HABIT': {
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.payload.id ? action.payload : h
        ),
      };
    }

    case 'REORDER_HABITS': {
      return {
        ...state,
        habits: action.payload.map((h, index) => ({
          ...h,
          order: index + 1,
        })),
      };
    }

    case 'DELETE_HABIT': {
      const habitId = action.payload;
      // Remove from habits
      const habits = state.habits.filter((h) => h.id !== habitId);

      // Remove from all logs
      const logs: Record<string, string[]> = {};
      for (const [day, ids] of Object.entries(state.logs)) {
        logs[day] = ids.filter((id) => id !== habitId);
      }

      // Remove from marks (skip/fail)
      const marks: Record<string, { skip: string[]; fail: string[] }> = {};
      for (const [day, dayMarks] of Object.entries(state.marks)) {
        marks[day] = {
          skip: dayMarks.skip.filter((id) => id !== habitId),
          fail: dayMarks.fail.filter((id) => id !== habitId),
        };
      }

      // Remove from notes
      const notes: Record<string, Record<string, string>> = {};
      for (const [day, dayNotes] of Object.entries(state.notes)) {
        const filteredNotes = { ...dayNotes };
        delete filteredNotes[habitId];
        notes[day] = filteredNotes;
      }

      // Remove from dayPlanTimes (deprecated)
      const dayPlanTimes = { ...state.dayPlanTimes };
      delete dayPlanTimes[habitId];

      // Remove from dayPlanSchedules
      const dayPlanSchedules = { ...state.dayPlanSchedules };
      delete dayPlanSchedules[habitId];

      return { ...state, habits, logs, marks, notes, dayPlanTimes, dayPlanSchedules };
    }

    case 'TOGGLE_HABIT': {
      const { habitId, date } = action.payload;
      const logs = { ...state.logs };
      const dayLogs = [...(logs[date] || [])];

      if (dayLogs.includes(habitId)) {
        // Remove if already done
        logs[date] = dayLogs.filter((id) => id !== habitId);
      } else {
        // Add if not done
        logs[date] = [...dayLogs, habitId];
      }

      // Clear any skip/fail marks when toggling
      const marks = { ...state.marks };
      if (marks[date]) {
        marks[date] = {
          skip: marks[date].skip.filter((id) => id !== habitId),
          fail: marks[date].fail.filter((id) => id !== habitId),
        };
      }

      return { ...state, logs, marks };
    }

    case 'SKIP_HABIT': {
      const { habitId, date } = action.payload;
      const logs = { ...state.logs };
      const marks = { ...state.marks };

      // Remove from completed
      logs[date] = (logs[date] || []).filter((id) => id !== habitId);

      // Add to skipped, remove from failed
      const dayMarks = marks[date] || { skip: [], fail: [] };
      marks[date] = {
        skip: [...dayMarks.skip.filter((id) => id !== habitId), habitId],
        fail: dayMarks.fail.filter((id) => id !== habitId),
      };

      return { ...state, logs, marks };
    }

    case 'FAIL_HABIT': {
      const { habitId, date } = action.payload;
      const logs = { ...state.logs };
      const marks = { ...state.marks };

      // Remove from completed
      logs[date] = (logs[date] || []).filter((id) => id !== habitId);

      // Add to failed, remove from skipped
      const dayMarks = marks[date] || { skip: [], fail: [] };
      marks[date] = {
        skip: dayMarks.skip.filter((id) => id !== habitId),
        fail: [...dayMarks.fail.filter((id) => id !== habitId), habitId],
      };

      return { ...state, logs, marks };
    }

    case 'CLEAR_DAY': {
      const date = action.payload;
      const logs = { ...state.logs };
      const marks = { ...state.marks };
      logs[date] = [];
      marks[date] = { skip: [], fail: [] };
      return { ...state, logs, marks };
    }

    case 'ADD_IDENTITY': {
      const newIdentity: Identity = {
        ...action.payload,
        id: generateId(),
      };
      return {
        ...state,
        identities: [...state.identities, newIdentity],
      };
    }

    case 'UPDATE_IDENTITY': {
      return {
        ...state,
        identities: state.identities.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    }

    case 'DELETE_IDENTITY': {
      // Don't delete 'general'
      if (action.payload === 'general') return state;
      
      // Move habits from deleted identity to 'general'
      const habits = state.habits.map((h) =>
        h.identityId === action.payload ? { ...h, identityId: 'general' } : h
      );
      
      return {
        ...state,
        identities: state.identities.filter((i) => i.id !== action.payload),
        habits,
        currentIdentityFilter:
          state.currentIdentityFilter === action.payload
            ? 'all'
            : state.currentIdentityFilter,
      };
    }

    case 'SET_IDENTITY_FILTER':
      return { ...state, currentIdentityFilter: action.payload };

    case 'SET_DAY_PLAN_TIME': {
      const { habitId, time } = action.payload;
      const dayPlanTimes = { ...state.dayPlanTimes };
      if (time) {
        dayPlanTimes[habitId] = time;
      } else {
        delete dayPlanTimes[habitId];
      }
      return { ...state, dayPlanTimes };
    }

    case 'SET_DAY_PLAN_SCHEDULE': {
      const { habitId, schedule } = action.payload;
      const dayPlanSchedules = { ...state.dayPlanSchedules };
      if (schedule) {
        dayPlanSchedules[habitId] = schedule;
      } else {
        delete dayPlanSchedules[habitId];
      }
      return { ...state, dayPlanSchedules };
    }

    case 'SET_SFX_ENABLED':
      return { ...state, sfxEnabled: action.payload };

    case 'SET_HAPTICS_ENABLED':
      return { ...state, hapticsEnabled: action.payload };

    case 'SET_NOTIFICATIONS_ENABLED':
      return { ...state, notificationsEnabled: action.payload };

    case 'SET_NOTIFICATION_TIME':
      return { ...state, notificationTime: action.payload };

    case 'SET_NOTE': {
      const { habitId, date, note } = action.payload;
      const notes = { ...state.notes };
      if (!notes[date]) {
        notes[date] = {};
      }
      notes[date] = { ...notes[date], [habitId]: note };
      return { ...state, notes };
    }

    case 'DELETE_NOTE': {
      const { habitId, date } = action.payload;
      const notes = { ...state.notes };
      if (notes[date]) {
        const dayNotes = { ...notes[date] };
        delete dayNotes[habitId];
        notes[date] = dayNotes;
      }
      return { ...state, notes };
    }

    case 'TOGGLE_ROUTINE_STEP': {
      const { habitId, stepId, date } = action.payload;
      const routineStepLogs = { ...state.routineStepLogs };

      if (!routineStepLogs[date]) {
        routineStepLogs[date] = {};
      }

      const habitSteps = routineStepLogs[date][habitId] || [];

      if (habitSteps.includes(stepId)) {
        // Remove if already completed
        routineStepLogs[date] = {
          ...routineStepLogs[date],
          [habitId]: habitSteps.filter((id) => id !== stepId),
        };
      } else {
        // Add if not completed
        routineStepLogs[date] = {
          ...routineStepLogs[date],
          [habitId]: [...habitSteps, stepId],
        };
      }

      return { ...state, routineStepLogs };
    }

    case 'COMPLETE_ONBOARDING':
      return { ...state, hasCompletedOnboarding: true };

    case 'SET_PET_SPECIES':
      return { ...state, petSpecies: action.payload };

    case 'SET_PET_HAT':
      return { ...state, petHat: action.payload };

    case 'START_FAST': {
      const { habitId, duration, startTime } = action.payload;
      const start = new Date(startTime);
      const target = new Date(start.getTime() + duration * 60 * 60 * 1000);
      return {
        ...state,
        activeFasts: {
          ...state.activeFasts,
          [habitId]: {
            habitId,
            startTime,
            duration,
            targetTime: target.toISOString(),
          },
        },
      };
    }

    case 'UPDATE_FAST_START_TIME': {
      const { habitId, startTime } = action.payload;
      const existingFast = state.activeFasts[habitId];
      if (!existingFast) return state;

      const start = new Date(startTime);
      const target = new Date(start.getTime() + existingFast.duration * 60 * 60 * 1000);
      return {
        ...state,
        activeFasts: {
          ...state.activeFasts,
          [habitId]: {
            ...existingFast,
            startTime,
            targetTime: target.toISOString(),
          },
        },
      };
    }

    case 'END_FAST': {
      const { [action.payload]: removed, ...remaining } = state.activeFasts;
      return { ...state, activeFasts: remaining };
    }

    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, defaultState);

  // Load saved state on mount
  useEffect(() => {
    async function loadState() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Ensure new fields exist (backward compatibility)
          if (!parsed.notes) {
            parsed.notes = {};
          }
          if (!parsed.dayPlanSchedules) {
            parsed.dayPlanSchedules = {};
          }
          if (parsed.hasCompletedOnboarding === undefined) {
            // If user has any habits, they've already used the app - skip onboarding
            parsed.hasCompletedOnboarding = parsed.habits && parsed.habits.length > 0;
          }
          if (!parsed.petSpecies) {
            parsed.petSpecies = 'blob';
          }
          if (!parsed.petHat) {
            parsed.petHat = 'none';
          }
          dispatch({ type: 'LOAD_STATE', payload: parsed });
        }
      } catch (error) {
        console.error('Failed to load state:', error);
      }
    }
    loadState();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    async function saveState() {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save state:', error);
      }
    }
    saveState();
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use app state
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

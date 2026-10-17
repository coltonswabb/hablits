// ============================================
// THEME CONTEXT
// ============================================
// React Context lets you share data (like the
// current theme) across ALL components without
// passing it through every level manually.
//
// Think of it like a "global variable" but
// done the right way in React.
// ============================================

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeName } from '../types';
import { themes, ThemeColors } from './colors';

const THEME_STORAGE_KEY = 'hablits_theme_v1';

// What the context provides
interface ThemeContextType {
  themeName: ThemeName;                      // Current theme name
  colors: ThemeColors;                       // Current theme's colors
  setTheme: (theme: ThemeName) => void;      // Function to change theme
  customAccentColor: string | undefined;     // Custom accent color override
  setCustomAccentColor: (color: string | undefined) => void; // Set custom accent
}

// Create the context (starts undefined until Provider wraps the app)
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component - wraps your app and provides theme to all children
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // State to track current theme
  const [themeName, setThemeName] = useState<ThemeName>('light');
  const [customAccentColor, setCustomAccentColor] = useState<string | undefined>(undefined);
  const loadedRef = useRef(false);

  // Restore the saved theme on launch
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.themeName && saved.themeName in themes) setThemeName(saved.themeName);
          if (typeof saved.customAccentColor === 'string') setCustomAccentColor(saved.customAccentColor);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        loadedRef.current = true;
      }
    })();
  }, []);

  // Persist whenever the user changes theme or accent (never before load — same race as AppContext)
  useEffect(() => {
    if (!loadedRef.current) return;
    AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ themeName, customAccentColor })).catch((error) =>
      console.error('Failed to save theme:', error)
    );
  }, [themeName, customAccentColor]);

  // Get the colors for current theme
  let colors = themes[themeName];

  // Apply custom accent color for light, dark, and superdark themes only
  if (customAccentColor && (themeName === 'light' || themeName === 'dark' || themeName === 'superdark')) {
    colors = {
      ...colors,
      accent: customAccentColor,
      accent2: customAccentColor, // Use same color for both accent variants
      // For superdark theme, also change text and muted colors to match accent
      ...(themeName === 'superdark' && {
        text: customAccentColor,
        muted: customAccentColor + 'aa', // Add some transparency
      }),
    };
  }

  // Function to change theme
  const setTheme = (newTheme: ThemeName) => {
    setThemeName(newTheme); // persisted by the effect above
  };

  return (
    <ThemeContext.Provider value={{ themeName, colors, setTheme, customAccentColor, setCustomAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme in any component
// Usage: const { colors, setTheme } = useTheme();
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

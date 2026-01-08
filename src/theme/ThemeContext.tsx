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

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeName } from '../types';
import { themes, ThemeColors } from './colors';

// What the context provides
interface ThemeContextType {
  themeName: ThemeName;                      // Current theme name
  colors: ThemeColors;                       // Current theme's colors
  setTheme: (theme: ThemeName) => void;      // Function to change theme
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

  // Get the colors for current theme
  const colors = themes[themeName];

  // Function to change theme
  const setTheme = (newTheme: ThemeName) => {
    setThemeName(newTheme);
    // Later: save to AsyncStorage so it persists
  };

  return (
    <ThemeContext.Provider value={{ themeName, colors, setTheme }}>
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

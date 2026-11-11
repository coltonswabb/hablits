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

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeName } from '../types';
import { themes, ThemeColors, textOn } from './colors';
import { TextStyle } from 'react-native';
import { useFonts } from 'expo-font';
import { Silkscreen_700Bold } from '@expo-google-fonts/silkscreen';
import { ZenMaruGothic_700Bold } from '@expo-google-fonts/zen-maru-gothic';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { RacingSansOne_400Regular } from '@expo-google-fonts/racing-sans-one';
import { Lora_700Bold } from '@expo-google-fonts/lora';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Comfortaa_700Bold } from '@expo-google-fonts/comfortaa';
import { Righteous_400Regular } from '@expo-google-fonts/righteous';
import { Exo2_700Bold } from '@expo-google-fonts/exo-2';
import { Bitter_700Bold } from '@expo-google-fonts/bitter';
import { ChakraPetch_700Bold } from '@expo-google-fonts/chakra-petch';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { radiiForTheme, headingFontForTheme, ThemeRadii } from './tokens';

const THEME_STORAGE_KEY = 'hablits_theme_v1';

// What the context provides
interface ThemeContextType {
  themeName: ThemeName;                      // Current theme name
  colors: ThemeColors;                       // Current theme's colors
  radius: ThemeRadii;                        // Current theme's corner radii (square for pixel themes, rounder for soft ones)
  headingFont: TextStyle;                    // Extra style for headings and numbers (a pixel font on the pixel-art themes, nothing elsewhere)
  setTheme: (theme: ThemeName) => void;      // Function to change theme
  customAccentColor: string | undefined;     // Custom accent color override
  setCustomAccentColor: (color: string | undefined) => void; // Set custom accent
  areFontsReady: boolean;                    // true once the heading fonts have loaded (or failed to)
  isThemeLoaded: boolean;                    // true once the saved theme has been read
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
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

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
        setIsThemeLoaded(true);
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
      textOnAccent: textOn(customAccentColor),
      // For superdark theme, also change text and muted colors to match accent
      ...(themeName === 'superdark' && {
        text: customAccentColor,
        muted: customAccentColor + 'aa', // Add some transparency
      }),
    };
  }

  const radius = useMemo(() => radiiForTheme(themeName), [themeName]);
  // Heading fonts for the themes that have one (see ./tokens). Text drawn
  // before a font is registered stays on the system font on iOS, so the
  // heading style is only handed out once loading has finished. If loading
  // fails, headings stay on the system font.
  const [fontsLoaded, fontError] = useFonts({
    Silkscreen_700Bold,
    ZenMaruGothic_700Bold,
    Fredoka_700Bold,
    SpaceMono_700Bold,
    Orbitron_700Bold,
    RacingSansOne_400Regular,
    Lora_700Bold,
    Cinzel_700Bold,
    Nunito_800ExtraBold,
    Comfortaa_700Bold,
    Righteous_400Regular,
    Exo2_700Bold,
    Bitter_700Bold,
    ChakraPetch_700Bold,
    PlayfairDisplay_700Bold,
  });
  const areFontsReady = fontsLoaded || fontError !== null;
  const headingFont = useMemo(() => (fontsLoaded ? headingFontForTheme(themeName) : {}), [themeName, fontsLoaded]);

  // Function to change theme
  const setTheme = (newTheme: ThemeName) => {
    setThemeName(newTheme); // persisted by the effect above
  };

  return (
    <ThemeContext.Provider value={{ themeName, colors, radius, headingFont, areFontsReady, setTheme, customAccentColor, setCustomAccentColor, isThemeLoaded }}>
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

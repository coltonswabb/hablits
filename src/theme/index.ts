// Barrel export - lets you import everything from one place
// Usage: import { useTheme, themes } from './theme';

export { ThemeProvider, useTheme } from './ThemeContext';
export { themes, themeConfetti } from './colors';
export type { ThemeColors } from './colors';
export { spacing, radii, fontSizes, radiiForTheme, headingFontForTheme } from './tokens';
export type { ThemeRadii } from './tokens';

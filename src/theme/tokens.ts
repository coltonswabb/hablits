// ============================================
// SIZE TOKENS
// ============================================
// One small scale each for spacing, corner radius and text size, so screens
// stop inventing their own numbers. Colours live in ./colors.
// ============================================

import { TextStyle } from 'react-native';
import { ThemeName } from '../types';

/** 8pt grid with a 4pt half-step */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Corner radius. `pill` is for fully rounded ends and circles. */
export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fontSizes = {
  micro: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 28,
  hero: 32,
} as const;

export type ThemeRadii = { xs: number; sm: number; md: number; lg: number; xl: number };

/**
 * How round each theme's cards, buttons and boxes are, as a multiple of the
 * base radius. Square for the pixel-art themes, extra round for the soft ones.
 * Themes not listed use 1.
 */
const themeRoundness: Partial<Record<ThemeName, number>> = {
  pixel: 0,
  gameboy: 0.25,
  retro: 0.25,
  cyber: 0.5,
  racer: 0.5,
  paper: 0.5,
  chibi: 1.5,
  sakura: 1.5,
  sunshine: 1.25,
  ocean: 1.25,
};

/** Corner radii for a theme. Never applied to circles; use `radii.pill` for those. */
export function radiiForTheme(theme: ThemeName): ThemeRadii {
  const k = themeRoundness[theme] ?? 1;
  return {
    xs: Math.round(radii.xs * k),
    sm: Math.round(radii.sm * k),
    md: Math.round(radii.md * k),
    lg: Math.round(radii.lg * k),
    xl: Math.round(radii.xl * k),
  };
}

/**
 * Heading fonts for the themes with a clear typographic character. The names
 * are the ones the fonts are registered under in App.tsx. All are from Google
 * Fonts under the SIL Open Font License. Light and Dark are deliberately left on the system font.
 */
const themeHeadingFonts: Partial<Record<ThemeName, { family: string; letterSpacing?: number }>> = {
  // Pixel art
  pixel: { family: 'Silkscreen_700Bold', letterSpacing: -0.5 },
  gameboy: { family: 'Silkscreen_700Bold', letterSpacing: -0.5 },
  retro: { family: 'Silkscreen_700Bold', letterSpacing: -0.5 },
  // Soft, rounded Japanese gothic (includes Japanese glyphs)
  sakura: { family: 'ZenMaruGothic_700Bold' },
  // Round and friendly
  chibi: { family: 'Fredoka_700Bold' },
  // Terminal
  superdark: { family: 'SpaceMono_700Bold', letterSpacing: -0.5 },
  // Sci-fi display
  cyber: { family: 'Orbitron_700Bold' },
  // Slanted racing lettering
  racer: { family: 'RacingSansOne_400Regular' },
  // Bookish serif
  paper: { family: 'Lora_700Bold' },
  // Engraved capitals
  ladyhawke: { family: 'Cinzel_700Bold' },
  // Warm and rounded
  sunshine: { family: 'Nunito_800ExtraBold' },
  // Soft, wave-like curves
  ocean: { family: 'Comfortaa_700Bold' },
  // Seventies poster lettering
  sunset: { family: 'Righteous_400Regular' },
  // Clean and spacey
  cosmic: { family: 'Exo2_700Bold' },
  // Earthy slab serif
  forest: { family: 'Bitter_700Bold' },
  // Angular, with a bite
  bengal: { family: 'ChakraPetch_700Bold' },
  // Regal high-contrast serif
  lion: { family: 'PlayfairDisplay_700Bold' },
};

/**
 * Extra text style for headings and numbers in a theme: screen titles, habit
 * names, streak counts. Empty for themes that use the system font. Body text
 * always stays on the system font.
 * A custom font file carries its own weight, so the weight is reset here.
 */
export function headingFontForTheme(theme: ThemeName): TextStyle {
  const font = themeHeadingFonts[theme];
  if (!font) return {};
  return { fontFamily: font.family, fontWeight: 'normal', letterSpacing: font.letterSpacing };
}

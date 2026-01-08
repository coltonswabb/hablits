// ============================================
// THEME DEFINITIONS
// ============================================
// Each theme defines a set of colors.
// When you switch themes, all components
// automatically use the new colors.
// ============================================

import { ThemeName } from '../types';

// The shape of a theme's colors
export interface ThemeColors {
  bg: string;         // Background color
  card: string;       // Card/container background
  text: string;       // Primary text color
  muted: string;      // Secondary/dimmed text
  accent: string;     // Primary accent (buttons, highlights)
  accent2: string;    // Secondary accent
  divider: string;    // Borders and dividers
  danger: string;     // Delete buttons, errors
  good: string;       // Success, completed states
}

// All theme definitions
export const themes: Record<ThemeName, ThemeColors> = {
  light: {
    bg: '#eef2f7',
    card: '#ffffff',
    text: '#000000',
    muted: '#4b5563',
    accent: '#2563eb',
    accent2: '#1e4fd0',
    divider: '#e5e7eb',
    danger: '#dc2626',
    good: '#16a34a',
  },

  dark: {
    bg: '#0a0e13',
    card: '#161b22',
    text: '#f0f6fc',
    muted: '#8b949e',
    accent: '#58a6ff',
    accent2: '#1f6feb',
    divider: '#21262d',
    danger: '#f85149',
    good: '#3fb950',
  },

  retro: {
    bg: '#f2efe6',
    card: '#f9f5ec',
    text: '#000000',
    muted: '#5f5f5f',
    accent: '#e4000f',
    accent2: '#b8000c',
    divider: '#e3dbcc',
    danger: '#9b111e',
    good: '#2e8b57',
  },

  chibi: {
    bg: '#E6F3FF',
    card: '#ffffff',
    text: '#000000',
    muted: '#475569',
    accent: '#00b8d4',
    accent2: '#00e6e6',
    divider: '#e6eef6',
    danger: '#ef4444',
    good: '#10b981',
  },

  sunshine: {
    bg: '#BFE8FF',
    card: '#ffffff',
    text: '#000000',
    muted: '#334155',
    accent: '#1d4ed8',
    accent2: '#fbbf24',
    divider: '#e2e8f0',
    danger: '#ef4444',
    good: '#22c55e',
  },

  gameboy: {
    bg: '#CFD8B3',
    card: '#E7EDCF',
    text: '#222222',
    muted: '#3b3b3b',
    accent: '#3A5A40',
    accent2: '#588157',
    divider: '#c3cbaa',
    danger: '#9b111e',
    good: '#4d7c0f',
  },

  fzero: {
    bg: '#0A0B1E',
    card: '#12132b',
    text: '#e5e7eb',
    muted: '#94a3b8',
    accent: '#ff2bd6',
    accent2: '#21d4fd',
    divider: '#1f2140',
    danger: '#ff5a5f',
    good: '#22c55e',
  },

  paper: {
    bg: '#F8F4EA',
    card: '#ffffff',
    text: '#111827',
    muted: '#4b5563',
    accent: '#d97706',
    accent2: '#9a3412',
    divider: '#e5e7eb',
    danger: '#b91c1c',
    good: '#15803d',
  },

  mmbn: {
    bg: '#0b1b2a',
    card: '#0f2436',
    text: '#d9f0ff',
    muted: '#9cc3e7',
    accent: '#00e5ff',
    accent2: '#00ff9a',
    divider: '#17324a',
    danger: '#ff4d6d',
    good: '#2bf39c',
  },

  ocean: {
    bg: '#0a2540',
    card: '#0f3460',
    text: '#e0f4ff',
    muted: '#7fa8c7',
    accent: '#16c0d6',
    accent2: '#ff6b9d',
    divider: '#1a3a5a',
    danger: '#ff6b6b',
    good: '#4ecdc4',
  },

  sunset: {
    bg: '#1a0e2e',
    card: '#2d1b4e',
    text: '#ffd4a3',
    muted: '#d4a5a5',
    accent: '#ff6b9d',
    accent2: '#ffbe0b',
    divider: '#3e2a5f',
    danger: '#ff006e',
    good: '#06ffa5',
  },

  cosmic: {
    bg: '#0d0221',
    card: '#1b0e3d',
    text: '#e0e0ff',
    muted: '#9b8fc7',
    accent: '#b388ff',
    accent2: '#8e44ad',
    divider: '#2d1b5e',
    danger: '#ff0080',
    good: '#00f5ff',
  },

  forest: {
    bg: '#e8f0e3',
    card: '#f5f9f3',
    text: '#2d3e2b',
    muted: '#6b7c68',
    accent: '#5a7c4f',
    accent2: '#7d9871',
    divider: '#d4e0cf',
    danger: '#a84432',
    good: '#6b9e5f',
  },
};

// Confetti colors for each theme
export const themeConfetti: Record<ThemeName, string[]> = {
  light: ['#60a5fa', '#f472b6', '#f59e0b', '#34d399'],
  dark: ['#58a6ff', '#f778ba', '#56d364', '#ffa657'],
  retro: ['#e4000f', '#0f0f0f', '#6e6e6e', '#ffffff'],
  chibi: ['#b0bec5', '#90a4ae', '#00e6e6', '#66ff66'],
  sunshine: ['#1f7aff', '#2fb6ff', '#00d9b8', '#ffd500'],
  gameboy: ['#3A5A40', '#588157', '#CFD8B3', '#222222'],
  fzero: ['#ff2bd6', '#21d4fd', '#0A0B1E', '#ffffff'],
  paper: ['#d97706', '#9a3412', '#F8F4EA', '#111827'],
  mmbn: ['#00e5ff', '#00ff9a', '#ff4d6d', '#d9f0ff'],
  ocean: ['#16c0d6', '#ff6b9d', '#4ecdc4', '#e0f4ff'],
  sunset: ['#ff6b9d', '#ffbe0b', '#ffd4a3', '#06ffa5'],
  cosmic: ['#b388ff', '#8e44ad', '#00f5ff', '#e0e0ff'],
  forest: ['#5a7c4f', '#7d9871', '#a3b899', '#6b9e5f'],
};

// ============================================
// HEADER COMPONENT
// ============================================
// Top bar with logo, identity filter, and theme selector
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme } from '../theme';
import { ThemeName, Identity } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  identities: Identity[];
  currentFilter: string;
  onChangeFilter: (id: string) => void;
  onOpenIdentityFilter: () => void;
  currentTheme: ThemeName;
  onChangeTheme: (theme: ThemeName) => void;
  onOpenThemePicker: () => void;
  onOpenSettings: () => void;
  onOpenHatCloset: () => void;
}

export function Header({
  identities,
  currentFilter,
  onChangeFilter,
  onOpenIdentityFilter,
  currentTheme,
  onChangeTheme,
  onOpenThemePicker,
  onOpenSettings,
  onOpenHatCloset,
}: HeaderProps) {
  const { colors } = useTheme();

  const themeLabels: Record<ThemeName, string> = {
    light: 'Light',
    dark: 'Dark',
    retro: 'Retro',
    chibi: 'Chibi',
    sunshine: 'Sunshine',
    gameboy: 'Game Boy',
    fzero: 'F-Zero',
    paper: 'Paper',
    mmbn: 'Mega Man',
    ocean: 'Ocean',
    sunset: 'Sunset',
    cosmic: 'Cosmic',
    forest: 'Forest',
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.divider }]}>
      {/* Logo */}
      <Pressable
        style={styles.brand}
        onPress={onOpenHatCloset}
        android_ripple={{ color: colors.divider }}
      >
        {({ pressed }) => (
          <Animated.View style={{ transform: [{ scale: pressed ? 0.96 : 1 }], flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Logo size={24} />
            <Text style={[styles.brandText, { color: colors.text }]}>Hablits</Text>
          </Animated.View>
        )}
      </Pressable>

      {/* Right side controls */}
      <View style={styles.controls}>
        {/* Identity filter button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.card,
              borderColor: colors.divider,
              transform: [{ scale: pressed ? 0.95 : 1 }]
            }
          ]}
          onPress={onOpenIdentityFilter}
          android_ripple={{ color: colors.divider }}
        >
          <View style={styles.buttonContent}>
            {/* Active filter indicator dot */}
            {currentFilter !== 'all' && (
              <View style={[styles.filterDot, { backgroundColor: colors.accent }]} />
            )}
            <Text style={[styles.buttonText, { color: colors.text }]}>Identity</Text>
          </View>
        </Pressable>

        {/* Theme button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.card,
              borderColor: colors.divider,
              transform: [{ scale: pressed ? 0.95 : 1 }]
            }
          ]}
          onPress={onOpenThemePicker}
          android_ripple={{ color: colors.divider }}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {themeLabels[currentTheme]}
          </Text>
        </Pressable>

        {/* Settings button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.card,
              borderColor: colors.divider,
              transform: [{ scale: pressed ? 0.95 : 1 }]
            }
          ]}
          onPress={onOpenSettings}
          android_ripple={{ color: colors.divider }}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>⚙</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

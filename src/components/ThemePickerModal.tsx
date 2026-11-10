// ============================================
// THEME PICKER MODAL
// ============================================
// Modal to select app theme with preview colors
// ============================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useTheme, themes, spacing, radii, fontSizes, radiiForTheme, headingFontForTheme } from '../theme';
import { textOn } from '../theme/colors';
import { ThemeName } from '../types';
import { Pet } from './Pet';
import { getDefaultPetForTheme } from '../utils/themePets';

interface ThemePickerModalProps {
  visible: boolean;
  currentTheme: ThemeName;
  onSelectTheme: (theme: ThemeName) => void;
  onClose: () => void;
}

const themeLabels: Record<ThemeName, string> = {
  light: 'Light',
  dark: 'Dark',
  superdark: 'Super Dark',
  retro: 'Retro',
  chibi: 'Chibi',
  sunshine: 'Sunshine',
  gameboy: 'Game Boy',
  racer: 'Racer',
  paper: 'Paper',
  cyber: 'Cyber',
  ocean: 'Ocean',
  sunset: 'Sunset',
  cosmic: 'Cosmic',
  forest: 'Forest',
  bengal: 'Bengal',
  lion: 'Lion',
  ladyhawke: 'Ladyhawke',
  sakura: 'Sakura',
  pixel: 'Pixel',
};

export function ThemePickerModal({
  visible,
  currentTheme,
  onSelectTheme,
  onClose,
}: ThemePickerModalProps) {
  const { colors } = useTheme();

  // Slide-up animation
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(modalTranslateY, {
          toValue: 0,
          tension: 150,
          friction: 20,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset for next opening
      backdropOpacity.setValue(0);
      modalTranslateY.setValue(300);
    }
  }, [visible]);

  const handleSelect = (theme: ThemeName) => {
    onSelectTheme(theme);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
        <Animated.View
          style={[
            styles.modal,
            { backgroundColor: colors.card },
            { transform: [{ translateY: modalTranslateY }] }
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.title, { color: colors.text }]}>Choose Theme</Text>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                { transform: [{ scale: pressed ? 0.9 : 1 }] }
              ]}
              onPress={onClose}
            >
              <Text style={[styles.closeText, { color: colors.muted }]}>×</Text>
            </Pressable>
          </View>

          {/* Each theme drawn as a small version of the Today screen */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.grid}>
            {(Object.keys(themes) as ThemeName[]).map((themeName) => {
              const t = themes[themeName];
              const r = radiiForTheme(themeName);
              const isSelected = themeName === currentTheme;

              return (
                <Pressable
                  key={themeName}
                  style={({ pressed }) => [
                    styles.preview,
                    {
                      backgroundColor: t.bg,
                      borderColor: isSelected ? colors.accent : colors.divider,
                      borderRadius: r.lg,
                    },
                    { transform: [{ scale: pressed ? 0.97 : 1 }] },
                  ]}
                  onPress={() => handleSelect(themeName)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${themeLabels[themeName]} theme`}
                >
                  <View style={styles.previewHeader}>
                    <Text style={[styles.previewName, { color: t.text }, headingFontForTheme(themeName)]} numberOfLines={1}>
                      {themeLabels[themeName]}
                    </Text>
                    <Pet
                      species={getDefaultPetForTheme(themeName)}
                      mono={themeName === 'pixel'}
                      mood="happy"
                      hat="none"
                      size={32}
                      isStatic
                    />
                  </View>

                  {/* A done habit and a not-done habit */}
                  {[true, false].map((done) => (
                    <View
                      key={String(done)}
                      style={[styles.previewCard, { backgroundColor: t.card, borderColor: t.divider, borderRadius: r.sm }]}
                    >
                      <View
                        style={[
                          styles.previewCheck,
                          {
                            backgroundColor: done ? t.good : t.bg,
                            borderColor: done ? t.good : t.divider,
                            borderRadius: r.xs,
                          },
                        ]}
                      >
                        {done && <Text style={[styles.previewTick, { color: textOn(t.good) }]}>✓</Text>}
                      </View>
                      <View style={styles.previewLines}>
                        <View style={[styles.previewLine, { backgroundColor: t.text, width: done ? '70%' : '55%' }]} />
                        <View style={[styles.previewLine, styles.previewLineShort, { backgroundColor: t.muted }]} />
                      </View>
                    </View>
                  ))}

                  <View style={[styles.previewBar, { backgroundColor: t.divider }]}>
                    <View style={[styles.previewBarFill, { backgroundColor: t.accent }]} />
                  </View>

                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.selectedTick, { color: colors.textOnAccent }]}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: fontSizes.hero,
    fontWeight: '300',
  },
  scrollView: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: spacing.xxl,
  },
  preview: {
    width: '48.5%',
    padding: spacing.sm,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  previewName: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  previewCheck: {
    width: 18,
    height: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTick: {
    fontSize: fontSizes.micro,
    fontWeight: '900',
  },
  previewLines: {
    flex: 1,
    gap: spacing.xs,
  },
  previewLine: {
    height: 5,
    borderRadius: radii.pill,
  },
  previewLineShort: {
    width: '35%',
    opacity: 0.6,
  },
  previewBar: {
    height: 4,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  previewBarFill: {
    width: '60%',
    height: '100%',
  },
  selectedBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTick: {
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
});

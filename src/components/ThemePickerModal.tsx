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
import { useTheme, themes } from '../theme';
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

          {/* Theme list */}
          <ScrollView style={styles.scrollView}>
            {(Object.keys(themes) as ThemeName[]).map((themeName) => {
              const themeColors = themes[themeName];
              const isSelected = themeName === currentTheme;

              return (
                <Pressable
                  key={themeName}
                  style={({ pressed }) => [
                    styles.themeOption,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.bg,
                      borderColor: isSelected ? colors.accent2 : colors.divider,
                    },
                    { transform: [{ scale: pressed ? 0.97 : 1 }] }
                  ]}
                  onPress={() => handleSelect(themeName)}
                >
                  {/* Single row layout */}
                  <View style={styles.themeRow}>
                    {/* Pet preview */}
                    <View style={styles.petPreview}>
                      <Pet
                        species={getDefaultPetForTheme(themeName)}
                        mood="idle"
                        hat="none"
                        size={32}
                      />
                    </View>

                    {/* Theme name */}
                    <Text
                      style={[
                        styles.themeName,
                        { color: isSelected ? '#fff' : colors.text },
                      ]}
                    >
                      {themeLabels[themeName]}
                    </Text>

                    {/* Spacer */}
                    <View style={styles.spacer} />

                    {/* Color preview */}
                    <View style={styles.colorPreview}>
                      <View
                        style={[styles.colorDot, { backgroundColor: themeColors.accent }]}
                      />
                      <View
                        style={[styles.colorDot, { backgroundColor: themeColors.good }]}
                      />
                      <View
                        style={[styles.colorDot, { backgroundColor: themeColors.danger }]}
                      />
                      <View
                        style={[styles.colorDot, { backgroundColor: themeColors.bg }]}
                      />
                    </View>

                    {/* Checkmark */}
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 32,
    fontWeight: '300',
  },
  scrollView: {
    padding: 16,
  },
  themeOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petPreview: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeName: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 80,
  },
  spacer: {
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    color: '#fff',
    marginLeft: 8,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 6,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});

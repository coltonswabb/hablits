// ============================================
// STARTER HABITS MODAL
// ============================================
// Opened from the Today screen: pick ready-made habits and add them in one go.
// ============================================

import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme, spacing, radii, fontSizes } from '../theme';
import { StarterHabitsPicker } from './StarterHabitsPicker';
import { TouchableScale } from './TouchableScale';

interface StarterHabitsModalProps {
  visible: boolean;
  /** Starters the user already has */
  alreadyAdded: Set<string>;
  onAdd: (keys: string[]) => void;
  onClose: () => void;
}

export function StarterHabitsModal({ visible, alreadyAdded, onAdd, onClose }: StarterHabitsModalProps) {
  const { colors, radius, headingFont } = useTheme();
  const [selected, setSelected] = useState<string[]>([]);

  // Start with nothing picked each time it opens
  useEffect(() => {
    if (visible) setSelected([]);
  }, [visible]);

  const toggle = (key: string) =>
    setSelected((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));

  const count = selected.length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }, headingFont]}>Starter habits</Text>
            <TouchableScale onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={[styles.close, { color: colors.muted }]}>×</Text>
            </TouchableScale>
          </View>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Pick any that fit. You can rename, change or remove them later.
          </Text>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <StarterHabitsPicker selected={selected} onToggle={toggle} alreadyAdded={alreadyAdded} />
          </ScrollView>

          <TouchableScale
            style={[styles.addButton, { backgroundColor: count ? colors.accent : colors.divider, borderRadius: radius.md }]}
            disabled={count === 0}
            onPress={() => {
              onAdd(selected);
              onClose();
            }}
            accessibilityRole="button"
          >
            <Text style={[styles.addText, { color: count ? colors.textOnAccent : colors.muted }]}>
              {count === 0 ? 'Pick a habit' : `Add ${count} habit${count === 1 ? '' : 's'}`}
            </Text>
          </TouchableScale>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
  },
  close: {
    fontSize: fontSizes.hero,
    fontWeight: '300',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  addButton: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addText: {
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
});

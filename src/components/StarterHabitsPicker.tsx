// ============================================
// STARTER HABITS PICKER
// ============================================
// Ready-made habits as tappable chips, grouped the way they will be filed
// (Health, Mind, Home). Used in onboarding and from the Today screen.
// ============================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, spacing, radii, fontSizes } from '../theme';
import { STARTER_GROUPS, StarterHabit } from '../utils/starterHabits';
import { TouchableScale } from './TouchableScale';
import { selectionTap } from '../utils/haptics';

interface StarterHabitsPickerProps {
  /** Keys of the starters currently picked */
  selected: string[];
  onToggle: (key: string) => void;
  /** Starters the user already has; shown ticked and not tappable */
  alreadyAdded?: Set<string>;
}

const describe = (habit: StarterHabit) =>
  habit.quit ? 'days since a slip' : habit.target ? `${habit.target.amount} ${habit.target.unit}` : habit.weeklyGoal === 7 ? 'daily' : `${habit.weeklyGoal}× a week`;

export function StarterHabitsPicker({ selected, onToggle, alreadyAdded }: StarterHabitsPickerProps) {
  const { colors, radius, headingFont } = useTheme();

  return (
    <View style={styles.groups}>
      {STARTER_GROUPS.map((group) => (
        <View key={group.name}>
          <View style={styles.groupHeader}>
            <View style={[styles.groupDot, { backgroundColor: group.color }]} />
            <Text style={[styles.groupName, { color: colors.muted }]}>{group.name.toUpperCase()}</Text>
          </View>
          {group.hint && <Text style={[styles.groupHint, { color: colors.muted }]}>{group.hint}</Text>}
          <View style={styles.chips}>
            {group.habits.map((habit) => {
              const owned = alreadyAdded?.has(habit.key) ?? false;
              const isSelected = selected.includes(habit.key);
              const filled = isSelected && !owned;
              return (
                <TouchableScale
                  key={habit.key}
                  style={[
                    styles.chip,
                    {
                      borderRadius: radius.md,
                      borderColor: filled ? colors.accent : colors.divider,
                      backgroundColor: filled ? colors.accent : colors.card,
                      opacity: owned ? 0.5 : 1,
                    },
                  ]}
                  disabled={owned}
                  onPress={() => {
                    selectionTap();
                    onToggle(habit.key);
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected || owned, disabled: owned }}
                  accessibilityLabel={`${habit.name}, ${describe(habit)}${owned ? ', already added' : ''}`}
                >
                  <Text style={styles.emoji}>{owned ? '✓' : habit.emoji}</Text>
                  <View>
                    <Text style={[styles.chipName, { color: filled ? colors.textOnAccent : colors.text }, headingFont]}>
                      {habit.name}
                    </Text>
                    <Text style={[styles.chipDetail, { color: filled ? colors.textOnAccent : colors.muted }]}>
                      {owned ? 'Already added' : describe(habit)}
                    </Text>
                  </View>
                </TouchableScale>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  groups: {
    gap: spacing.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  groupName: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  groupHint: {
    fontSize: fontSizes.xs,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  emoji: {
    fontSize: fontSizes.lg,
  },
  chipName: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  chipDetail: {
    fontSize: fontSizes.xs,
  },
});

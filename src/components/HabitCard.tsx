// ============================================
// HABIT CARD COMPONENT
// ============================================
// Displays a single habit with:
// - Animated checkbox to mark complete
// - Name and weekly progress
// - Streak badge
// - Animated progress ring
// ============================================

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Habit, Identity } from '../types';
import { useTheme } from '../theme';
import { calculateStreak, countThisWeek } from '../utils';
import { ProgressRing } from './ProgressRing';
import { AnimatedNumber } from './AnimatedNumber';
import { playSound } from '../utils/sounds';
import { mediumTap, warningTap, errorTap } from '../utils/haptics';

interface HabitCardProps {
  habit: Habit;
  identity: Identity;
  logs: Record<string, string[]>;
  marks: Record<string, { skip: string[]; fail: string[] }>;
  today: string;
  index?: number;
  onToggle: () => void;
  onPress: () => void;
  onNotePress?: () => void;
  hasNote?: boolean;
  isComplete?: boolean;
  isSkipped?: boolean;
}

export function HabitCard({
  habit,
  identity,
  logs,
  marks,
  today,
  index = 0,
  onToggle,
  onPress,
  onNotePress,
  hasNote = false,
  isComplete: isCompleteProp,
  isSkipped: isSkippedProp,
}: HabitCardProps) {
  const { colors } = useTheme();

  // Calculate states first to know initial animation values
  // Use prop if provided (for routines), otherwise calculate from logs
  const isComplete = isCompleteProp !== undefined ? isCompleteProp : (logs[today]?.includes(habit.id) || false);
  const isSkipped = isSkippedProp !== undefined ? isSkippedProp : (marks[today]?.skip?.includes(habit.id) || false);
  const isFailed = marks[today]?.fail?.includes(habit.id) || false;

  // Animation values - initialize with correct starting values
  const checkboxScale = useRef(new Animated.Value(1)).current;
  const checkboxRotate = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(isComplete ? 1 : 0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(1)).current;
  const flameOpacity = useRef(new Animated.Value(1)).current;

  const streak = calculateStreak(logs, habit.id);
  const thisWeek = countThisWeek(logs, habit.id);
  const progress = Math.min(1, thisWeek / habit.weeklyGoal);

  // Slide in animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate progress bar when progress changes
  useEffect(() => {
    Animated.spring(progressWidth, {
      toValue: progress,
      useNativeDriver: false, // Can't use native driver for width
      tension: 40,
      friction: 6,
    }).start();
  }, [progress]);

  // Animate flame for streaks
  useEffect(() => {
    if (streak >= 7) {
      // Continuous pulsing animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(flameScale, {
              toValue: 1.2,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(flameOpacity, {
              toValue: 0.7,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(flameScale, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(flameOpacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [streak]);

  // Bounce checkbox on toggle
  const handleToggle = () => {
    // Determine next state to provide appropriate feedback
    // Cycle: empty → complete → skip → fail → empty
    let nextState: 'complete' | 'skip' | 'fail' | 'empty';

    if (!isComplete && !isSkipped && !isFailed) {
      nextState = 'complete';
    } else if (isComplete) {
      nextState = 'skip';
    } else if (isSkipped) {
      nextState = 'fail';
    } else {
      nextState = 'empty';
    }

    // Play sound and haptic based on next state
    if (nextState === 'complete') {
      playSound('complete');
      mediumTap();
    } else if (nextState === 'skip') {
      playSound('skip');
      warningTap();
    } else if (nextState === 'fail') {
      playSound('fail');
      errorTap();
    } else {
      mediumTap(); // Just haptic for clearing
    }

    // Animate checkbox with satisfying spring and rotation
    Animated.parallel([
      Animated.sequence([
        Animated.timing(checkboxScale, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(checkboxScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
      ]),
      Animated.sequence([
        Animated.timing(checkboxRotate, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(checkboxRotate, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animate checkmark pop-in
    if (nextState === 'complete') {
      checkmarkScale.setValue(0);
      Animated.spring(checkmarkScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
        delay: 100,
      }).start();
    }

    onToggle();
  };

  // Determine checkbox display
  let checkboxBg = colors.bg;
  let checkboxBorder = colors.divider;
  let checkboxText = '';

  if (isComplete) {
    checkboxBg = colors.good;
    checkboxBorder = colors.good;
    checkboxText = '✓';
  } else if (isSkipped) {
    checkboxBg = colors.muted;
    checkboxBorder = colors.muted;
    checkboxText = '–';
  } else if (isFailed) {
    checkboxBg = colors.danger;
    checkboxBorder = colors.danger;
    checkboxText = '×';
  }

  // Helper function to add alpha to hex color
  const addAlpha = (color: string, opacity: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Handle card press for scale animation
  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.divider,
          opacity: cardOpacity,
          transform: [
            { translateY: cardTranslateY },
            { scale: cardScale },
          ],
        },
      ]}
    >
      {/* Gradient accent on left side */}
      <LinearGradient
        colors={[addAlpha(identity.color, 0.15), addAlpha(identity.color, 0)]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientAccent}
        pointerEvents="none"
      />

      {/* Checkbox */}
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityLabel={`${habit.name} checkbox`}
        accessibilityHint={isComplete ? 'Tap to mark incomplete' : 'Tap to mark complete'}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isComplete }}
      >
        <Animated.View
          style={[
            styles.checkbox,
            {
              backgroundColor: checkboxBg,
              borderColor: checkboxBorder,
              transform: [
                { scale: checkboxScale },
                {
                  rotate: checkboxRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '10deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {isComplete && (
            <Animated.Text
              style={[
                styles.checkboxText,
                {
                  transform: [{ scale: checkmarkScale }],
                },
              ]}
            >
              {checkboxText}
            </Animated.Text>
          )}
          {!isComplete && <Text style={styles.checkboxText}>{checkboxText}</Text>}
        </Animated.View>
      </TouchableOpacity>

      {/* Content */}
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityLabel={`${habit.name}, ${thisWeek} of ${habit.weeklyGoal} this week, ${streak} day streak`}
        accessibilityHint="Double tap to view details"
        accessibilityRole="button"
      >
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]}>{habit.name}</Text>
          
          {/* Streak badge */}
          <View style={[styles.streakBadge, { borderColor: colors.divider }]}>
            <AnimatedNumber
              value={streak}
              suffix="d"
              style={[styles.streakText, { color: colors.muted }]}
            />
          </View>
          
          {/* Streak emoji with animation */}
          {streak >= 30 && (
            <Animated.Text
              style={{
                transform: [{ scale: flameScale }],
                opacity: flameOpacity,
              }}
            >
              🏅
            </Animated.Text>
          )}
          {streak >= 7 && streak < 30 && (
            <Animated.Text
              style={{
                transform: [{ scale: flameScale }],
                opacity: flameOpacity,
              }}
            >
              🔥
            </Animated.Text>
          )}
        </View>

        <Text style={[styles.meta, { color: colors.muted }]}>
          Weekly goal {habit.weeklyGoal} · {thisWeek} this week
        </Text>

        <View style={styles.bottomRow}>
          <ProgressRing progress={progress} size={22} strokeWidth={3} />

          {/* Identity chip */}
          <View style={[styles.identityChip, { borderColor: colors.divider }]}>
            <View style={[styles.identityDot, { backgroundColor: identity.color }]} />
            <Text style={[styles.identityName, { color: colors.text }]}>{identity.name}</Text>
          </View>

          {/* Note button - only show when complete */}
          {isComplete && onNotePress && (
            <TouchableOpacity
              style={[styles.noteButton, { backgroundColor: hasNote ? colors.accent : colors.divider }]}
              onPress={onNotePress}
            >
              <Text style={styles.noteIcon}>{hasNote ? '📝' : '+'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.divider }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: colors.accent,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  gradientAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  checkbox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontWeight: '900',
    fontSize: 16,
  },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 12,
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  identityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  identityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  identityName: {
    fontSize: 12,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  noteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  noteIcon: {
    fontSize: 12,
  },
});

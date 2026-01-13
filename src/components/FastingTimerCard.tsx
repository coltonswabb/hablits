// ============================================
// FASTING TIMER CARD - SECRET FEATURE
// ============================================
// Special card shown for habits named "Fast"
// Displays countdown timer and allows interaction
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
  Alert,
} from 'react-native';
import { useTheme } from '../theme';
import { ActiveFast } from '../types';
import { formatRemainingTime, getRemainingTime, getFastProgress, isFastComplete } from '../utils';

interface FastingTimerCardProps {
  habitId: string;
  habitName: string;
  activeFast: ActiveFast | null;
  isComplete: boolean; // If habit is marked complete today
  onStartFast: () => void;
  onEndFast: () => void;
  onEditStartTime: () => void;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FastingTimerCard({
  habitId,
  habitName,
  activeFast,
  isComplete,
  onStartFast,
  onEndFast,
  onEditStartTime,
  onToggleComplete,
  onEdit,
  onDelete,
}: FastingTimerCardProps) {
  const { colors } = useTheme();
  const [remainingMs, setRemainingMs] = useState(
    activeFast ? getRemainingTime(activeFast) : 0
  );

  // Update countdown every second
  useEffect(() => {
    if (!activeFast || isComplete) return;

    const interval = setInterval(() => {
      const remaining = getRemainingTime(activeFast);
      setRemainingMs(remaining);

      // Auto-complete when timer reaches zero
      if (remaining === 0) {
        onEndFast();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeFast, isComplete]);

  const fastComplete = activeFast && isFastComplete(activeFast);
  const progress = activeFast ? getFastProgress(activeFast) : 0;

  // Determine card color
  const getCardColor = () => {
    if (isComplete) return colors.good; // Green when marked complete
    if (fastComplete) return colors.good; // Green when timer complete
    if (activeFast) return colors.accent; // Accent while fasting
    return colors.card; // Default
  };

  const getTextColor = () => {
    if (isComplete || fastComplete) return '#ffffff';
    if (activeFast) return colors.text;
    return colors.text;
  };

  const handleLongPress = () => {
    Alert.alert(
      habitName,
      'Choose an action',
      [
        { text: 'Edit', onPress: onEdit },
        { text: 'Delete', onPress: onDelete, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <Pressable onLongPress={handleLongPress} delayLongPress={500}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: getCardColor(),
            borderColor: activeFast ? colors.accent2 : colors.divider,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.habitName, { color: getTextColor() }]}>
            ⏱️ {habitName}
          </Text>
          {activeFast && !isComplete && (
            <Text style={[styles.duration, { color: getTextColor() }]}>
              {activeFast.duration}h fast
            </Text>
          )}
        </View>

      {/* Timer Display */}
      {activeFast && !isComplete && (
        <View style={styles.timerSection}>
          <Text style={[styles.timer, { color: getTextColor() }]}>
            {formatRemainingTime(remainingMs)}
          </Text>

          {/* Progress Bar */}
          <View style={[styles.progressBar, { backgroundColor: colors.divider }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: fastComplete ? colors.good : colors.accent2,
                },
              ]}
            />
          </View>

          <Text style={[styles.progressText, { color: getTextColor() }]}>
            {Math.round(progress)}% complete
          </Text>
        </View>
      )}

      {/* Completed State */}
      {isComplete && (
        <View style={styles.completedSection}>
          <Text style={[styles.completedText, { color: '#ffffff' }]}>
            ✓ Fast Completed!
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {!activeFast && !isComplete && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.startButton, { backgroundColor: colors.accent }]}
              onPress={onStartFast}
            >
              <Text style={styles.buttonText}>Start Fast</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.editSmallButton, { backgroundColor: colors.card, borderColor: colors.divider }]}
              onPress={onEdit}
            >
              <Text style={[styles.editButtonText, { color: colors.text }]}>Edit</Text>
            </TouchableOpacity>
          </>
        )}

        {activeFast && !isComplete && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: colors.danger }]}
              onPress={onEndFast}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.editButton, { backgroundColor: colors.card, borderColor: colors.divider }]}
              onPress={onEditStartTime}
            >
              <Text style={[styles.editButtonText, { color: colors.text }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.endButton, { backgroundColor: fastComplete ? colors.good : colors.accent2 }]}
              onPress={() => {
                onToggleComplete();
                onEndFast();
              }}
            >
              <Text style={styles.buttonText}>
                {fastComplete ? 'Complete' : 'Finish'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {isComplete && (
          <TouchableOpacity
            style={[styles.button, styles.undoButton, { backgroundColor: colors.muted }]}
            onPress={onToggleComplete}
          >
            <Text style={styles.buttonText}>Undo</Text>
          </TouchableOpacity>
        )}
      </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '700',
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timer: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completedSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  completedText: {
    fontSize: 20,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    flex: 0.7,
  },
  editSmallButton: {
    flex: 0.3,
    borderWidth: 1,
  },
  cancelButton: {
    flex: 0.3,
  },
  editButton: {
    flex: 0.3,
    borderWidth: 2,
  },
  endButton: {
    flex: 0.4,
  },
  undoButton: {
    flex: 1,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

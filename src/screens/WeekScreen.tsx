// ============================================
// WEEK SCREEN
// ============================================
// Shows a 7-day grid with all habits.
// Each cell shows completion status for that day.
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';
import { useApp } from '../state';
import { ProgressRing, EmptyState } from '../components';
import {
  getWeekDays,
  dateStr,
  sortByOrder,
  calculateStreak,
} from '../utils';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekScreen() {
  const { colors } = useTheme();
  const { state, dispatch } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);

  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(currentDate);
  const today = dateStr(new Date());

  // Filter habits by identity
  const habits =
    state.currentIdentityFilter === 'all'
      ? state.habits
      : state.habits.filter((h) => h.identityId === state.currentIdentityFilter);

  const sortedHabits = sortByOrder(habits);

  // Toggle a habit for a specific day
  const handleToggle = (habitId: string, date: Date) => {
    const ds = dateStr(date);
    dispatch({
      type: 'TOGGLE_HABIT',
      payload: { habitId, date: ds },
    });
  };

  // Get identity color for a habit
  const getIdentityColor = (identityId: string) => {
    const identity = state.identities.find((i) => i.id === identityId);
    return identity?.color || colors.accent;
  };

  // Get status for a habit on a specific day
  const getStatus = (habitId: string, date: Date) => {
    const ds = dateStr(date);
    const isDone = state.logs[ds]?.includes(habitId) || false;
    const isSkipped = state.marks[ds]?.skip?.includes(habitId) || false;
    const isFailed = state.marks[ds]?.fail?.includes(habitId) || false;
    return { isDone, isSkipped, isFailed };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Week</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {' – '}
            {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <View style={styles.weekNav}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.divider }]}
            onPress={() => setWeekOffset(weekOffset - 1)}
          >
            <Text style={[styles.navButtonText, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          {weekOffset !== 0 && (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.divider }]}
              onPress={() => setWeekOffset(0)}
            >
              <Text style={[styles.navButtonTextSmall, { color: colors.text }]}>Today</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.divider }]}
            onPress={() => setWeekOffset(weekOffset + 1)}
          >
            <Text style={[styles.navButtonText, { color: colors.text }]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Habits with progress */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sortedHabits.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No habits yet"
            message="Add habits on the Today tab to track your week!"
          />
        ) : (
          sortedHabits.map((habit) => {
            // Count completions for the displayed week
            const weekProgress = weekDays.filter(day => {
              const ds = dateStr(day);
              return state.logs[ds]?.includes(habit.id);
            }).length;
            const pct = Math.min(1, weekProgress / habit.weeklyGoal);
            const streak = calculateStreak(state.logs, habit.id);
            const goalMet = weekProgress >= habit.weeklyGoal;
            const identityColor = getIdentityColor(habit.identityId);

            return (
              <View
                key={habit.id}
                style={[styles.habitRow, { backgroundColor: colors.card, borderColor: colors.divider }]}
              >
                {/* Habit Info */}
                <View style={styles.habitInfo}>
                  <View style={styles.habitNameRow}>
                    <Text style={[styles.habitName, { color: colors.text }]}>
                      {habit.name}
                    </Text>
                    <View style={[styles.streakBadge, { borderColor: colors.divider }]}>
                      <Text style={[styles.streakText, { color: colors.muted }]}>
                        {streak}d
                      </Text>
                    </View>
                    {streak >= 30 && <Text>🏅</Text>}
                    {streak >= 7 && streak < 30 && <Text>🔥</Text>}
                  </View>
                  
                  <View style={styles.progressRow}>
                    <ProgressRing progress={pct} size={20} strokeWidth={3} />
                    <Text style={[styles.progressText, { color: colors.muted }]}>
                      {weekProgress}/{habit.weeklyGoal} {weekOffset === 0 ? 'this week' : 'that week'}
                    </Text>
                    {goalMet && (
                      <View style={[styles.goalBadge, { backgroundColor: colors.good + '22', borderColor: colors.good }]}>
                        <Text style={[styles.goalBadgeText, { color: colors.good }]}>
                          Goal met!
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Day Grid */}
                <View style={styles.dayGrid}>
                  {weekDays.map((day, index) => {
                    const { isDone, isSkipped, isFailed } = getStatus(habit.id, day);
                    const isToday = dateStr(day) === today;

                    let cellBg = 'transparent';
                    let cellBorder = colors.divider;
                    let cellText = '';
                    let textColor = colors.text;

                    if (isDone) {
                      cellBg = identityColor;
                      cellBorder = identityColor;
                      cellText = '✓';
                      textColor = '#fff';
                    } else if (isSkipped) {
                      cellBg = colors.muted + '33';
                      cellBorder = colors.muted;
                      cellText = '–';
                      textColor = colors.muted;
                    } else if (isFailed) {
                      cellBg = colors.danger;
                      cellBorder = colors.danger;
                      cellText = '×';
                      textColor = '#fff';
                    }

                    const isFuture = day > new Date();

                    return (
                      <View key={index} style={styles.dayColumn}>
                        <Text style={[styles.dayLabel, { color: colors.muted }]}>
                          {DAY_LABELS[index]}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.dayCell,
                            {
                              backgroundColor: cellBg,
                              borderColor: cellBorder,
                              borderWidth: isToday ? 2 : 1,
                              opacity: isFuture ? 0.3 : 1,
                            },
                            isToday && { borderColor: colors.accent },
                          ]}
                          onPress={() => !isFuture && handleToggle(habit.id, day)}
                          disabled={isFuture}
                        >
                          <Text style={[styles.dayCellText, { color: textColor }]}>
                            {cellText}
                          </Text>
                        </TouchableOpacity>
                        <Text style={[styles.dateLabel, { color: colors.muted }]}>
                          {day.getDate()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
  },
  weekNav: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  navButtonTextSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  habitRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  habitInfo: {
    marginBottom: 12,
  },
  habitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '800',
  },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 11,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 12,
  },
  goalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  goalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 10,
  },
});

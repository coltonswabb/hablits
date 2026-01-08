// ============================================
// HEATMAP CALENDAR COMPONENT
// ============================================
// GitHub-style contribution heatmap showing
// habit completion density over time
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { dateStr } from '../utils';

interface HeatmapCalendarProps {
  logs: Record<string, string[]>;
  habits: any[];
  daysToShow?: number; // Number of days to display (default 90)
}

export function HeatmapCalendar({ logs, habits, daysToShow = 90 }: HeatmapCalendarProps) {
  const { colors } = useTheme();

  // Generate array of dates for the past N days
  const generateDates = () => {
    const dates: Date[] = [];
    const today = new Date();

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    return dates;
  };

  const dates = generateDates();

  // Calculate completion percentage for a day
  const getCompletionLevel = (date: Date): number => {
    const ds = dateStr(date);
    const dayLogs = logs[ds] || [];

    if (habits.length === 0) return 0;

    const completed = habits.filter((h) => dayLogs.includes(h.id)).length;
    const percentage = completed / habits.length;

    // Return 0-4 representing intensity levels
    if (percentage === 0) return 0;
    if (percentage < 0.25) return 1;
    if (percentage < 0.5) return 2;
    if (percentage < 0.75) return 3;
    return 4;
  };

  // Get color for completion level
  const getLevelColor = (level: number): string => {
    const baseColor = colors.accent;

    switch (level) {
      case 0:
        return colors.divider;
      case 1:
        return baseColor + '30';
      case 2:
        return baseColor + '60';
      case 3:
        return baseColor + '90';
      case 4:
        return baseColor;
      default:
        return colors.divider;
    }
  };

  // Group dates by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  dates.forEach((date, index) => {
    currentWeek.push(date);

    if (date.getDay() === 0 || index === dates.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Fill first week with empty cells if needed
  if (weeks[0] && weeks[0].length < 7) {
    const firstWeek = weeks[0];
    const firstDay = firstWeek[0].getDay();
    const emptyCells = firstDay === 0 ? 0 : firstDay;

    for (let i = 0; i < emptyCells; i++) {
      firstWeek.unshift(null as any);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((date, dayIndex) => {
              if (!date) {
                return <View key={`empty-${dayIndex}`} style={styles.emptyCell} />;
              }

              const level = getCompletionLevel(date);
              const color = getLevelColor(level);

              return (
                <View
                  key={dateStr(date)}
                  style={[
                    styles.cell,
                    { backgroundColor: color },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.muted }]}>Less</Text>
        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[
              styles.legendCell,
              { backgroundColor: getLevelColor(level) },
            ]}
          />
        ))}
        <Text style={[styles.legendText, { color: colors.muted }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 3,
  },
  week: {
    gap: 3,
  },
  cell: {
    width: 11,
    height: 11,
    borderRadius: 2,
  },
  emptyCell: {
    width: 11,
    height: 11,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  legendCell: {
    width: 11,
    height: 11,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
});

// ============================================
// STATS SCREEN
// ============================================
// Analytics and visualizations for habit progress
// Shows: completion trends, weekly patterns, and identity breakdowns
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Rect, Line, Text as SvgText, Path } from 'react-native-svg';
import { useTheme } from '../theme';
import { useApp } from '../state';
import { dateStr, startOfWeek } from '../utils/dates';
import { getActiveHabits, getDayCompletionPercent, calculateStreak } from '../utils/habits';
import { EmptyState, HeatmapCalendar } from '../components';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 200;

type TimeRange = '7d' | '30d' | '90d';

export function StatsScreen() {
  const { colors } = useTheme();
  const { state } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Get data for the selected time range
  const getDaysData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data: { date: Date; completion: number; count: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const activeHabits = getActiveHabits(state.habits, date, 'all');
      const ds = dateStr(date);
      const dayLogs = state.logs[ds] || [];
      const completed = activeHabits.filter(h => dayLogs.includes(h.id)).length;
      const completion = activeHabits.length > 0 ? completed / activeHabits.length : 0;

      data.push({ date, completion, count: completed });
    }

    return data;
  };

  const daysData = getDaysData();

  // Calculate weekly pattern (which days of week are best)
  const getWeeklyPattern = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    Object.entries(state.logs).forEach(([day, habitIds]) => {
      const date = new Date(day + 'T00:00:00');
      const dayOfWeek = date.getDay();
      const activeHabits = getActiveHabits(state.habits, date, 'all');

      if (activeHabits.length > 0) {
        const completion = habitIds.length / activeHabits.length;
        dayTotals[dayOfWeek] += completion;
        dayCounts[dayOfWeek]++;
      }
    });

    return dayNames.map((name, i) => ({
      name,
      avg: dayCounts[i] > 0 ? dayTotals[i] / dayCounts[i] : 0,
    }));
  };

  const weeklyPattern = getWeeklyPattern();

  // Calculate identity breakdown
  const getIdentityBreakdown = () => {
    const breakdown: Record<string, { count: number; color: string; name: string }> = {};

    state.identities.forEach(identity => {
      breakdown[identity.id] = { count: 0, color: identity.color, name: identity.name };
    });

    Object.values(state.logs).forEach(habitIds => {
      habitIds.forEach(habitId => {
        const habit = state.habits.find(h => h.id === habitId);
        if (habit && breakdown[habit.identityId]) {
          breakdown[habit.identityId].count++;
        }
      });
    });

    return Object.values(breakdown).filter(b => b.count > 0);
  };

  const identityBreakdown = getIdentityBreakdown();
  const totalCompletions = identityBreakdown.reduce((sum, b) => sum + b.count, 0);

  // Calculate total stats FIRST (needed for insights)
  const totalHabits = state.habits.length;
  const allCompletions = Object.values(state.logs).reduce((sum, logs) => sum + logs.length, 0);
  const avgPerDay = daysData.length > 0
    ? daysData.reduce((sum, d) => sum + d.count, 0) / daysData.length
    : 0;
  const bestStreak = state.habits.length > 0
    ? Math.max(...state.habits.map(h => {
        let streak = 0;
        for (let i = 0; i < 365; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const ds = dateStr(d);
          if (state.logs[ds]?.includes(h.id)) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      }))
    : 0;

  // Calculate best and worst performing habits
  const getHabitPerformance = () => {
    if (state.habits.length === 0) return { best: [], worst: [] };

    const habitStats = state.habits.map(habit => {
      let totalDays = 0;
      let completedDays = 0;

      // Count completion rate over the selected time range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = dateStr(d);
        const activeHabits = getActiveHabits(state.habits, d, 'all');

        if (activeHabits.find(h => h.id === habit.id)) {
          totalDays++;
          if (state.logs[ds]?.includes(habit.id)) {
            completedDays++;
          }
        }
      }

      const rate = totalDays > 0 ? completedDays / totalDays : 0;
      const streak = calculateStreak(state.logs, habit.id);

      return {
        habit,
        rate,
        streak,
        totalDays,
        completedDays,
      };
    });

    // Sort by completion rate
    const sorted = [...habitStats].sort((a, b) => b.rate - a.rate);

    return {
      best: sorted.slice(0, 3).filter(h => h.totalDays > 0),
      worst: sorted.slice(-3).reverse().filter(h => h.totalDays > 0 && h.rate < 1),
    };
  };

  const habitPerformance = getHabitPerformance();

  // Calculate insights
  const getInsights = () => {
    const insights: string[] = [];

    // Best day of week
    const bestDay = weeklyPattern.reduce((best, day) =>
      day.avg > best.avg ? day : best
    , weeklyPattern[0]);

    if (bestDay && bestDay.avg > 0) {
      insights.push(`🌟 You're most consistent on ${bestDay.name}s (${Math.round(bestDay.avg * 100)}% completion)`);
    }

    // Current streak
    if (bestStreak > 0) {
      if (bestStreak >= 30) {
        insights.push(`🏅 Incredible! Your best streak is ${bestStreak} days`);
      } else if (bestStreak >= 7) {
        insights.push(`🔥 Great work! Your best streak is ${bestStreak} days`);
      }
    }

    // Weekly trend
    const recentWeek = daysData.slice(-7);
    const avgRecent = recentWeek.reduce((sum, d) => sum + d.completion, 0) / recentWeek.length;
    const olderWeek = daysData.slice(-14, -7);
    const avgOlder = olderWeek.length > 0 ? olderWeek.reduce((sum, d) => sum + d.completion, 0) / olderWeek.length : 0;

    if (avgRecent > avgOlder + 0.1) {
      insights.push(`📈 You're improving! Up ${Math.round((avgRecent - avgOlder) * 100)}% from last week`);
    } else if (avgRecent < avgOlder - 0.1) {
      insights.push(`📉 Completion dropped ${Math.round((avgOlder - avgRecent) * 100)}% from last week`);
    }

    // Perfect days
    const perfectDays = daysData.filter(d => d.completion === 1).length;
    if (perfectDays > 0) {
      insights.push(`✨ ${perfectDays} perfect ${perfectDays === 1 ? 'day' : 'days'} in this period`);
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>{totalHabits}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Habits</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>{allCompletions}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>All Time</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>{avgPerDay.toFixed(1)}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Avg/Day</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>{bestStreak}d</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Best Streak</Text>
          </View>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeRow}>
          {(['7d', '30d', '90d'] as TimeRange[]).map(range => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                {
                  backgroundColor: timeRange === range ? colors.accent : colors.card,
                  borderColor: colors.divider,
                }
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  { color: timeRange === range ? '#fff' : colors.text }
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Heatmap Calendar */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Activity Heatmap</Text>
          <HeatmapCalendar
            logs={state.logs}
            habits={state.habits}
            daysToShow={timeRange === '7d' ? 49 : timeRange === '30d' ? 84 : 126}
          />
        </View>

        {/* Completion Trend Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Completion Trend</Text>
          <CompletionTrendChart data={daysData} colors={colors} />
        </View>

        {/* Weekly Pattern Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Pattern</Text>
          <WeeklyPatternChart data={weeklyPattern} colors={colors} />
        </View>

        {/* Identity Breakdown */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>By Identity</Text>
          <IdentityBreakdownChart data={identityBreakdown} total={totalCompletions} colors={colors} />
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>💡 Insights</Text>
            {insights.map((insight, i) => (
              <View key={i} style={[styles.insightRow, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.insightText, { color: colors.text }]}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Best Performing Habits */}
        {habitPerformance.best.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>🏆 Top Performers</Text>
            {habitPerformance.best.map((stat, i) => (
              <View key={stat.habit.id} style={[styles.habitStatRow, { borderBottomColor: colors.divider }]}>
                <View style={styles.habitStatLeft}>
                  <Text style={[styles.habitStatRank, { color: colors.muted }]}>#{i + 1}</Text>
                  <Text style={[styles.habitStatName, { color: colors.text }]}>{stat.habit.name}</Text>
                </View>
                <View style={styles.habitStatRight}>
                  <Text style={[styles.habitStatPercent, { color: colors.good }]}>
                    {Math.round(stat.rate * 100)}%
                  </Text>
                  <Text style={[styles.habitStatDetail, { color: colors.muted }]}>
                    {stat.completedDays}/{stat.totalDays} days
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Needs Improvement */}
        {habitPerformance.worst.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>📊 Needs Attention</Text>
            {habitPerformance.worst.map((stat) => (
              <View key={stat.habit.id} style={[styles.habitStatRow, { borderBottomColor: colors.divider }]}>
                <View style={styles.habitStatLeft}>
                  <Text style={[styles.habitStatName, { color: colors.text }]}>{stat.habit.name}</Text>
                </View>
                <View style={styles.habitStatRight}>
                  <Text style={[styles.habitStatPercent, { color: colors.muted }]}>
                    {Math.round(stat.rate * 100)}%
                  </Text>
                  <Text style={[styles.habitStatDetail, { color: colors.muted }]}>
                    {stat.completedDays}/{stat.totalDays} days
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================
// COMPLETION TREND CHART (Line Chart)
// ============================================
function CompletionTrendChart({ data, colors }: { data: any[]; colors: any }) {
  if (data.length === 0) {
    return <EmptyState icon="📊" title="No data yet" message="Start completing habits to see trends" compact />;
  }

  const maxCompletion = 1;
  const padding = 20;
  const chartInnerWidth = CHART_WIDTH - padding * 2;
  const chartInnerHeight = CHART_HEIGHT - padding * 2;
  const stepX = chartInnerWidth / Math.max(data.length - 1, 1);

  // Generate path for line
  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: padding + chartInnerHeight - (d.completion * chartInnerHeight),
  }));

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(val => {
        const y = padding + chartInnerHeight - (val * chartInnerHeight);
        return (
          <Line
            key={val}
            x1={padding}
            y1={y}
            x2={CHART_WIDTH - padding}
            y2={y}
            stroke={colors.divider}
            strokeWidth={1}
          />
        );
      })}

      {/* Line */}
      <Path d={pathData} stroke={colors.accent} strokeWidth={2} fill="none" />

      {/* Points */}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.accent} />
      ))}

      {/* Labels */}
      <SvgText x={padding} y={15} fontSize={10} fill={colors.muted}>100%</SvgText>
      <SvgText x={padding} y={CHART_HEIGHT - 10} fontSize={10} fill={colors.muted}>0%</SvgText>
    </Svg>
  );
}

// ============================================
// WEEKLY PATTERN CHART (Bar Chart)
// ============================================
function WeeklyPatternChart({ data, colors }: { data: any[]; colors: any }) {
  const padding = 20;
  const chartInnerHeight = CHART_HEIGHT - padding * 2;
  const barWidth = (CHART_WIDTH - padding * 2) / data.length - 8;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {data.map((d, i) => {
        const barHeight = d.avg * chartInnerHeight;
        const x = padding + i * (barWidth + 8);
        const y = padding + chartInnerHeight - barHeight;

        return (
          <React.Fragment key={d.name}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={colors.accent}
              rx={4}
            />
            <SvgText
              x={x + barWidth / 2}
              y={CHART_HEIGHT - 5}
              fontSize={10}
              fill={colors.muted}
              textAnchor="middle"
            >
              {d.name}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ============================================
// IDENTITY BREAKDOWN CHART (Horizontal Bars)
// ============================================
function IdentityBreakdownChart({ data, total, colors }: { data: any[]; total: number; colors: any }) {
  if (data.length === 0) {
    return <EmptyState icon="🎯" title="No completions yet" message="Complete some habits to see breakdown" compact />;
  }

  const barHeight = 32;
  const chartHeight = data.length * (barHeight + 12) + 20;
  const maxWidth = CHART_WIDTH - 140;

  return (
    <Svg width={CHART_WIDTH} height={chartHeight}>
      {data.map((d, i) => {
        const percent = d.count / total;
        const barWidth = percent * maxWidth;
        const y = 10 + i * (barHeight + 12);

        return (
          <React.Fragment key={d.name}>
            {/* Bar background */}
            <Rect
              x={100}
              y={y}
              width={maxWidth}
              height={barHeight}
              fill={colors.divider}
              rx={4}
            />
            {/* Bar fill */}
            <Rect
              x={100}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={d.color}
              rx={4}
            />
            {/* Label */}
            <SvgText
              x={10}
              y={y + barHeight / 2 + 4}
              fontSize={12}
              fill={colors.text}
              fontWeight="600"
            >
              {d.name}
            </SvgText>
            {/* Count */}
            <SvgText
              x={CHART_WIDTH - 10}
              y={y + barHeight / 2 + 4}
              fontSize={12}
              fill={colors.muted}
              textAnchor="end"
            >
              {d.count}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  summaryLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  timeRangeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeRangeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chartCard: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 40,
  },
  insightRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  habitStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  habitStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  habitStatRank: {
    fontSize: 12,
    fontWeight: '700',
    width: 24,
  },
  habitStatName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  habitStatRight: {
    alignItems: 'flex-end',
  },
  habitStatPercent: {
    fontSize: 16,
    fontWeight: '900',
  },
  habitStatDetail: {
    fontSize: 11,
    marginTop: 2,
  },
});

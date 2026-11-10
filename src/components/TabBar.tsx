// ============================================
// TAB BAR COMPONENT
// ============================================
// Navigation tabs: Today, Week, Calendar, Day Plan
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableScale } from './TouchableScale';
import { TabName } from '../types';
import { useTheme } from '../theme';
import { radii, fontSizes } from '../theme/tokens';

interface TabBarProps {
  activeTab: TabName;
  onChangeTab: (tab: TabName) => void;
}

const tabs: { key: TabName; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'calendar', label: 'Cal' },
  { key: 'dayplan', label: 'Plan' },
  { key: 'stats', label: 'Stats' },
];

export function TabBar({ activeTab, onChangeTab }: TabBarProps) {
  const { colors, radius } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.divider, borderRadius: radius.lg }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableScale
            key={tab.key}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? colors.accent : 'transparent',
                borderColor: isActive ? colors.accent2 : colors.divider,
                borderRadius: radius.md,
              },
            ]}
            onPress={() => onChangeTab(tab.key)}
            accessibilityLabel={`${tab.label} tab`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive ? colors.textOnAccent : colors.text,
                  fontWeight: isActive ? '800' : '600',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    marginVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  tabText: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
});

// ============================================
// TAB BAR COMPONENT
// ============================================
// Navigation tabs: Today, Week, Calendar, Day Plan
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TabName } from '../types';
import { useTheme } from '../theme';

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
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.divider }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? colors.accent : 'transparent',
                borderColor: isActive ? colors.accent2 : colors.divider,
              },
            ]}
            onPress={() => onChangeTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive ? '#fff' : colors.text,
                  fontWeight: isActive ? '800' : '600',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
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
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

// ============================================
// EMPTY STATE COMPONENT
// ============================================
// Reusable empty state with illustrations
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { TouchableScale } from './TouchableScale';
import { fontSizes } from '../theme/tokens';

interface EmptyStateProps {
  icon?: string;
  /** Shown in place of the icon, e.g. the pet waiting for its first habit */
  illustration?: React.ReactNode;
  title: string;
  message?: string;
  compact?: boolean;
  /** A button under the message */
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon = '📭', illustration, title, message, compact = false, action }: EmptyStateProps) {
  const { colors, radius } = useTheme();

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {illustration ? <View style={styles.illustration}>{illustration}</View> : <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message && (
        <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
      )}
      {action && (
        <TouchableScale
          style={[styles.action, { backgroundColor: colors.accent, borderRadius: radius.md }]}
          onPress={action.onPress}
          accessibilityRole="button"
        >
          <Text style={[styles.actionText, { color: colors.textOnAccent }]}>{action.label}</Text>
        </TouchableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  containerCompact: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  action: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '800',
  },
  illustration: {
    marginBottom: 16,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});

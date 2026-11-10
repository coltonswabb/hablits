// ============================================
// IDENTITY FILTER MODAL
// ============================================
// Quick filter to show habits from specific identities
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { TouchableScale } from './TouchableScale';
import { Identity } from '../types';
import { useTheme } from '../theme';
import { radii, fontSizes } from '../theme/tokens';

interface IdentityFilterModalProps {
  visible: boolean;
  identities: Identity[];
  currentFilter: string;
  onSelectFilter: (id: string) => void;
  onClose: () => void;
  onManageIdentities: () => void;
}

export function IdentityFilterModal({
  visible,
  identities,
  currentFilter,
  onSelectFilter,
  onClose,
  onManageIdentities,
}: IdentityFilterModalProps) {
  const { colors } = useTheme();

  const handleSelect = (id: string) => {
    onSelectFilter(id);
    onClose();
  };

  const handleManageIdentities = () => {
    onClose();
    // Small delay to let modal close before opening the next one
    setTimeout(() => {
      onManageIdentities();
    }, 300);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.title, { color: colors.text }]}>Filter Habits</Text>
            <TouchableScale onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.muted }]}>×</Text>
            </TouchableScale>
          </View>

          {/* Filter list */}
          <ScrollView style={styles.scrollView}>
            {/* All option */}
            <TouchableScale
              style={[
                styles.filterOption,
                {
                  backgroundColor: currentFilter === 'all' ? colors.accent : colors.bg,
                  borderColor: currentFilter === 'all' ? colors.accent2 : colors.divider,
                },
              ]}
              onPress={() => handleSelect('all')}
            >
              <View style={styles.filterRow}>
                <View style={[styles.colorDot, { backgroundColor: colors.muted }]} />
                <Text
                  style={[
                    styles.filterName,
                    { color: currentFilter === 'all' ? colors.textOnAccent : colors.text },
                  ]}
                >
                  All Habits
                </Text>
                {currentFilter === 'all' && (
                  <Text style={[styles.checkmark, { color: colors.textOnAccent }]}>✓</Text>
                )}
              </View>
            </TouchableScale>

            {/* Identity options */}
            {identities.map((identity) => {
              const isSelected = currentFilter === identity.id;

              return (
                <TouchableScale
                  key={identity.id}
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.bg,
                      borderColor: isSelected ? colors.accent2 : colors.divider,
                    },
                  ]}
                  onPress={() => handleSelect(identity.id)}
                >
                  <View style={styles.filterRow}>
                    <View style={[styles.colorDot, { backgroundColor: identity.color }]} />
                    <Text
                      style={[
                        styles.filterName,
                        { color: isSelected ? colors.textOnAccent : colors.text },
                      ]}
                    >
                      {identity.name}
                    </Text>
                    {isSelected && (
                      <Text style={[styles.checkmark, { color: colors.textOnAccent }]}>✓</Text>
                    )}
                  </View>
                </TouchableScale>
              );
            })}
          </ScrollView>

          {/* Manage Identities Button */}
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <TouchableScale
              style={[styles.manageButton, { backgroundColor: colors.accent }]}
              onPress={handleManageIdentities}
            >
              <Text style={[styles.manageButtonText, { color: colors.textOnAccent }]}>Manage Identities</Text>
            </TouchableScale>
          </View>
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
  modal: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: fontSizes.hero,
    fontWeight: '300',
  },
  scrollView: {
    padding: 16,
  },
  filterOption: {
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 2,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: radii.sm,
  },
  filterName: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    flex: 1,
  },
  checkmark: {
    fontSize: fontSizes.xl,
    color: '#fff',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  manageButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});

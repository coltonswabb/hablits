// ============================================
// IDENTITY FILTER MODAL
// ============================================
// Quick filter to show habits from specific identities
// ============================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Identity } from '../types';
import { useTheme } from '../theme';

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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.muted }]}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Filter list */}
          <ScrollView style={styles.scrollView}>
            {/* All option */}
            <TouchableOpacity
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
                    { color: currentFilter === 'all' ? '#fff' : colors.text },
                  ]}
                >
                  All Habits
                </Text>
                {currentFilter === 'all' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Identity options */}
            {identities.map((identity) => {
              const isSelected = currentFilter === identity.id;

              return (
                <TouchableOpacity
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
                        { color: isSelected ? '#fff' : colors.text },
                      ]}
                    >
                      {identity.name}
                    </Text>
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Manage Identities Button */}
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <TouchableOpacity
              style={[styles.manageButton, { backgroundColor: colors.accent }]}
              onPress={handleManageIdentities}
            >
              <Text style={styles.manageButtonText}>Manage Identities</Text>
            </TouchableOpacity>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontSize: 20,
    fontWeight: '900',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 32,
    fontWeight: '300',
  },
  scrollView: {
    padding: 16,
  },
  filterOption: {
    padding: 14,
    borderRadius: 12,
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
    borderRadius: 8,
  },
  filterName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    color: '#fff',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  manageButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

// ============================================
// FASTING MODAL - SECRET FEATURE
// ============================================
// Appears when you tap a habit named "Fast"
// Allows selecting fasting duration and setting start time
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useTheme } from '../theme';

interface FastingModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDuration: (hours: number, startTime: string) => void;
  currentStartTime?: string; // If editing an active fast
  currentDuration?: number; // If editing an active fast
}

const FAST_DURATIONS = [
  { hours: 12, label: '12 Hour Fast', description: 'Light intermittent fast' },
  { hours: 16, label: '16 Hour Fast', description: 'Standard IF (16:8)' },
  { hours: 18, label: '18 Hour Fast', description: 'Extended IF' },
  { hours: 24, label: '24 Hour Fast', description: 'OMAD (One meal a day)' },
  { hours: 36, label: '36 Hour Fast', description: 'Monk fast' },
];

export function FastingModal({
  visible,
  onClose,
  onSelectDuration,
  currentStartTime,
  currentDuration,
}: FastingModalProps) {
  const { colors } = useTheme();

  // Default to now, or use current start time if editing
  const [startTime, setStartTime] = useState(() => {
    if (currentStartTime) {
      const date = new Date(currentStartTime);
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    }
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  });

  const handleSelect = (hours: number) => {
    // Parse time and create start timestamp
    const [hoursStr, minsStr] = startTime.split(':');
    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(hoursStr),
      parseInt(minsStr)
    );

    onSelectDuration(hours, startDate.toISOString());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.bg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              ⏱️ Start Fast Timer
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, { color: colors.muted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Start Time Picker */}
          <View style={[styles.timeSection, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.timeLabel, { color: colors.text }]}>Start Time:</Text>
            <TextInput
              style={[
                styles.timeInput,
                { color: colors.text, borderColor: colors.divider, backgroundColor: colors.card },
              ]}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.muted}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Duration Options */}
          <View style={styles.content}>
            {FAST_DURATIONS.map((option) => (
              <TouchableOpacity
                key={option.hours}
                style={[
                  styles.option,
                  { backgroundColor: colors.card, borderColor: colors.divider },
                ]}
                onPress={() => handleSelect(option.hours)}
              >
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDescription, { color: colors.muted }]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
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
    fontSize: 28,
    fontWeight: '300',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeInput: {
    fontSize: 18,
    fontWeight: '700',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 100,
    textAlign: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
});

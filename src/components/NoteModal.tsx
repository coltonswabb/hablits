// ============================================
// NOTE MODAL COMPONENT
// ============================================
// Allows users to add notes to habit completions
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TouchableScale } from './TouchableScale';
import { useTheme } from '../theme';
import { textOn } from '../theme/colors';
import { radii, fontSizes } from '../theme/tokens';

interface NoteModalProps {
  visible: boolean;
  habitName: string;
  existingNote?: string;
  onSave: (note: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function NoteModal({
  visible,
  habitName,
  existingNote = '',
  onSave,
  onDelete,
  onClose,
}: NoteModalProps) {
  const { colors } = useTheme();
  const [note, setNote] = useState(existingNote);

  // Update note when existingNote changes
  useEffect(() => {
    setNote(existingNote);
  }, [existingNote]);

  const handleSave = () => {
    onSave(note.trim());
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableScale
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Add Note
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {habitName}
            </Text>
          </View>

          {/* Input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.divider,
                color: colors.text,
              },
            ]}
            placeholder="How did it go? Any thoughts?"
            placeholderTextColor={colors.muted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            maxLength={500}
            autoFocus
          />

          {/* Character count */}
          <Text style={[styles.charCount, { color: colors.muted }]}>
            {note.length}/500
          </Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            {existingNote && onDelete && (
              <TouchableScale
                style={[styles.button, { backgroundColor: colors.danger }]}
                onPress={handleDelete}
              >
                <Text style={[styles.buttonText, { color: textOn(colors.danger) }]}>Delete</Text>
              </TouchableScale>
            )}
            <TouchableScale
              style={[styles.button, { backgroundColor: colors.muted }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: textOn(colors.muted) }]}>Cancel</Text>
            </TouchableScale>
            <TouchableScale
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, { color: colors.textOnAccent }]}>Save</Text>
            </TouchableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: fontSizes.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    fontSize: fontSizes.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: fontSizes.xs,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.sm,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
});

// ============================================
// IDENTITIES MODAL
// ============================================
// Modal for managing identity groups.
// Add, edit, delete identities with colors.
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Identity } from '../types';
import { useTheme } from '../theme';

interface IdentitiesModalProps {
  visible: boolean;
  identities: Identity[];
  onSave: (identities: Identity[]) => void;
  onClose: () => void;
}

// Preset colors to choose from
const COLOR_PRESETS = [
  '#3ddc97', // Green
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#84cc16', // Lime
];

export function IdentitiesModal({
  visible,
  identities,
  onSave,
  onClose,
}: IdentitiesModalProps) {
  const { colors } = useTheme();
  
  // Local copy of identities for editing
  const [localIdentities, setLocalIdentities] = useState<Identity[]>([]);
  
  // Color picker state
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalIdentities([...identities]);
    }
  }, [visible, identities]);

  // Add new identity
  const addIdentity = () => {
    const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const usedColors = localIdentities.map((i) => i.color);
    const availableColor = COLOR_PRESETS.find((c) => !usedColors.includes(c)) || COLOR_PRESETS[0];
    
    setLocalIdentities([
      ...localIdentities,
      { id: newId, name: 'New Identity', color: availableColor },
    ]);
  };

  // Update identity name
  const updateName = (id: string, name: string) => {
    setLocalIdentities(
      localIdentities.map((i) => (i.id === id ? { ...i, name } : i))
    );
  };

  // Update identity color
  const updateColor = (id: string, color: string) => {
    setLocalIdentities(
      localIdentities.map((i) => (i.id === id ? { ...i, color } : i))
    );
    setColorPickerFor(null);
  };

  // Delete identity
  const deleteIdentity = (id: string) => {
    if (id === 'general') {
      Alert.alert('Cannot Delete', 'The General identity cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Identity',
      'Are you sure? Habits with this identity will be moved to General.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLocalIdentities(localIdentities.filter((i) => i.id !== id));
          },
        },
      ]
    );
  };

  // Save changes
  const handleSave = () => {
    // Validate: at least one identity
    if (localIdentities.length === 0) {
      Alert.alert('Error', 'You need at least one identity.');
      return;
    }

    // Validate: all have names
    const hasEmptyName = localIdentities.some((i) => !i.name.trim());
    if (hasEmptyName) {
      Alert.alert('Error', 'All identities must have a name.');
      return;
    }

    onSave(localIdentities);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Text style={[styles.title, { color: colors.text }]}>Identities</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Group your habits by life areas
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {localIdentities.map((identity) => (
              <View
                key={identity.id}
                style={[styles.identityRow, { borderColor: colors.divider }]}
              >
                {/* Color button */}
                <TouchableOpacity
                  style={[styles.colorButton, { backgroundColor: identity.color }]}
                  onPress={() => setColorPickerFor(identity.id)}
                />

                {/* Name input */}
                <TextInput
                  style={[
                    styles.nameInput,
                    { backgroundColor: colors.bg, borderColor: colors.divider, color: colors.text },
                  ]}
                  value={identity.name}
                  onChangeText={(text) => updateName(identity.id, text)}
                  placeholder="Identity name"
                  placeholderTextColor={colors.muted}
                  maxLength={24}
                />

                {/* Delete button (not for general) */}
                {identity.id !== 'general' ? (
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: colors.danger + '22' }]}
                    onPress={() => deleteIdentity(identity.id)}
                  >
                    <Text style={[styles.deleteButtonText, { color: colors.danger }]}>×</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.deleteButtonPlaceholder} />
                )}
              </View>
            ))}
          </ScrollView>

          {/* Color picker - rendered outside ScrollView with higher z-index */}
          {colorPickerFor && (
            <>
              {/* Backdrop to close picker */}
              <TouchableOpacity
                style={styles.colorPickerBackdrop}
                onPress={() => setColorPickerFor(null)}
                activeOpacity={1}
              />
              <View style={[styles.colorPicker, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      localIdentities.find(i => i.id === colorPickerFor)?.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => updateColor(colorPickerFor, color)}
                  />
                ))}
              </View>
            </>
          )}

          {/* Add button */}
          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.divider }]}
            onPress={addIdentity}
          >
            <Text style={[styles.addButtonText, { color: colors.accent }]}>
              + Add Identity
            </Text>
          </TouchableOpacity>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.divider }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  list: {
    maxHeight: 300,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 20,
    fontWeight: '700',
  },
  deleteButtonPlaceholder: {
    width: 32,
  },
  colorPickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  colorPicker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -90 }, { translateY: -60 }],
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    zIndex: 1000,
    elevation: 10,
    width: 180,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

// ============================================
// EDIT HABIT MODAL
// ============================================
// Modal for creating and editing habits.
// Includes: name, weekly goal, identity,
// active days, order, and delete option.
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
import { Habit, Identity, RoutineStep } from '../types';
import { useTheme } from '../theme';
import { generateId } from '../utils';

interface EditHabitModalProps {
  visible: boolean;
  habit: Habit | null;           // null = creating new habit
  identities: Identity[];
  totalHabits: number;           // For order dropdown
  onSave: (habit: Partial<Habit> & { name: string }) => void;
  onDelete?: (habitId: string) => void;
  onClose: () => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function EditHabitModal({
  visible,
  habit,
  identities,
  totalHabits,
  onSave,
  onDelete,
  onClose,
}: EditHabitModalProps) {
  const { colors } = useTheme();
  const isEditing = habit !== null;

  // Form state
  const [name, setName] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState(7);
  const [identityId, setIdentityId] = useState('general');
  const [days, setDays] = useState<boolean[]>([true, true, true, true, true, true, true]);
  const [order, setOrder] = useState(1);
  const [isRoutine, setIsRoutine] = useState(false);
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [newStepName, setNewStepName] = useState('');
  const [newStepDuration, setNewStepDuration] = useState('');

  // Reset form when modal opens/habit changes
  useEffect(() => {
    if (visible) {
      if (habit) {
        setName(habit.name);
        setWeeklyGoal(habit.weeklyGoal);
        setIdentityId(habit.identityId);
        setDays(habit.days || [true, true, true, true, true, true, true]);
        setOrder(habit.order || 1);
        setIsRoutine(habit.isRoutine || false);
        setSteps(habit.steps || []);
      } else {
        // New habit defaults
        setName('');
        setWeeklyGoal(7);
        setIdentityId('general');
        setDays([true, true, true, true, true, true, true]);
        setOrder(totalHabits + 1);
        setIsRoutine(false);
        setSteps([]);
      }
      setNewStepName('');
      setNewStepDuration('');
    }
  }, [visible, habit, totalHabits]);

  // Toggle a day on/off
  const toggleDay = (index: number) => {
    const newDays = [...days];
    newDays[index] = !newDays[index];
    setDays(newDays);
  };

  // Add a step to the routine
  const addStep = () => {
    if (!newStepName.trim()) return;

    const duration = newStepDuration ? parseInt(newStepDuration, 10) : undefined;
    const newStep: RoutineStep = {
      id: generateId(),
      name: newStepName.trim(),
      duration: duration && !isNaN(duration) ? duration : undefined,
      order: steps.length + 1,
    };

    setSteps([...steps, newStep]);
    setNewStepName('');
    setNewStepDuration('');
  };

  // Remove a step from the routine
  const removeStep = (stepId: string) => {
    const updatedSteps = steps
      .filter((s) => s.id !== stepId)
      .map((s, index) => ({ ...s, order: index + 1 }));
    setSteps(updatedSteps);
  };

  // Move step up in order
  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    const reordered = newSteps.map((s, i) => ({ ...s, order: i + 1 }));
    setSteps(reordered);
  };

  // Move step down in order
  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    const reordered = newSteps.map((s, i) => ({ ...s, order: i + 1 }));
    setSteps(reordered);
  };

  // Handle save
  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    if (isRoutine && steps.length === 0) {
      Alert.alert('Error', 'Please add at least one step to your routine');
      return;
    }

    const habitData = {
      id: habit?.id,
      name: name.trim(),
      weeklyGoal,
      identityId,
      days,
      order,
      isRoutine,
      steps: isRoutine ? steps : undefined,
    };
    onSave(habitData);
    onClose();
  };

  // Handle delete
  const handleDelete = () => {
    if (!habit || !onDelete) return;

    // For web compatibility, use a simpler confirm
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${habit.name}"? This will remove all its history.`
      );
      if (confirmed) {
        onDelete(habit.id);
        onClose();
      }
    } else {
      // Fallback to Alert for native
      Alert.alert(
        'Delete Habit',
        `Are you sure you want to delete "${habit.name}"? This will remove all its history.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              onDelete(habit.id);
              onClose();
            },
          },
        ]
      );
    }
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
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {isEditing ? 'Edit Habit' : 'Add Habit'}
            </Text>

            {/* Name Input */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>
                {isRoutine ? 'Routine name' : 'Habit name'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.divider, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder={isRoutine ? "e.g., Morning Routine" : "e.g., Meditate"}
                placeholderTextColor={colors.muted}
                maxLength={64}
              />
            </View>

            {/* Routine Toggle */}
            <View style={styles.field}>
              <TouchableOpacity
                style={styles.routineToggle}
                onPress={() => setIsRoutine(!isRoutine)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isRoutine ? colors.accent : colors.bg,
                      borderColor: isRoutine ? colors.accent : colors.divider,
                    },
                  ]}
                >
                  {isRoutine && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.routineToggleText, { color: colors.text }]}>
                  This is a routine (multi-step habit)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Routine Steps Editor */}
            {isRoutine && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.muted }]}>Routine Steps</Text>

                {/* Existing steps */}
                {steps.map((step, index) => (
                  <View
                    key={step.id}
                    style={[styles.stepItem, { backgroundColor: colors.bg, borderColor: colors.divider }]}
                  >
                    <View style={styles.stepInfo}>
                      <Text style={[styles.stepName, { color: colors.text }]}>
                        {index + 1}. {step.name}
                      </Text>
                      {step.duration && (
                        <Text style={[styles.stepDuration, { color: colors.muted }]}>
                          {step.duration} min
                        </Text>
                      )}
                    </View>
                    <View style={styles.stepActions}>
                      {index > 0 && (
                        <TouchableOpacity
                          style={[styles.stepActionButton, { borderColor: colors.divider }]}
                          onPress={() => moveStepUp(index)}
                        >
                          <Text style={[styles.stepActionText, { color: colors.text }]}>↑</Text>
                        </TouchableOpacity>
                      )}
                      {index < steps.length - 1 && (
                        <TouchableOpacity
                          style={[styles.stepActionButton, { borderColor: colors.divider }]}
                          onPress={() => moveStepDown(index)}
                        >
                          <Text style={[styles.stepActionText, { color: colors.text }]}>↓</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.stepActionButton, { borderColor: colors.danger }]}
                        onPress={() => removeStep(step.id)}
                      >
                        <Text style={[styles.stepActionText, { color: colors.danger }]}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Add new step */}
                <View style={styles.addStepContainer}>
                  <View style={styles.addStepInputs}>
                    <TextInput
                      style={[
                        styles.stepNameInput,
                        { backgroundColor: colors.bg, borderColor: colors.divider, color: colors.text },
                      ]}
                      value={newStepName}
                      onChangeText={setNewStepName}
                      placeholder="Step name"
                      placeholderTextColor={colors.muted}
                      maxLength={64}
                    />
                    <TextInput
                      style={[
                        styles.stepDurationInput,
                        { backgroundColor: colors.bg, borderColor: colors.divider, color: colors.text },
                      ]}
                      value={newStepDuration}
                      onChangeText={setNewStepDuration}
                      placeholder="Min"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.addStepButton, { backgroundColor: colors.accent }]}
                    onPress={addStep}
                  >
                    <Text style={styles.addStepButtonText}>+ Add Step</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Weekly Goal */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Weekly goal (1-7)</Text>
              <View style={styles.goalRow}>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.goalButton,
                      {
                        backgroundColor: weeklyGoal === num ? colors.accent : colors.bg,
                        borderColor: weeklyGoal === num ? colors.accent : colors.divider,
                      },
                    ]}
                    onPress={() => setWeeklyGoal(num)}
                  >
                    <Text
                      style={[
                        styles.goalButtonText,
                        { color: weeklyGoal === num ? '#fff' : colors.text },
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Identity */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Identity</Text>
              <View style={styles.identityRow}>
                {identities.map((identity) => (
                  <TouchableOpacity
                    key={identity.id}
                    style={[
                      styles.identityButton,
                      {
                        backgroundColor: identityId === identity.id ? colors.accent : colors.bg,
                        borderColor: identityId === identity.id ? colors.accent : colors.divider,
                      },
                    ]}
                    onPress={() => setIdentityId(identity.id)}
                  >
                    <View style={[styles.identityDot, { backgroundColor: identity.color }]} />
                    <Text
                      style={[
                        styles.identityButtonText,
                        { color: identityId === identity.id ? '#fff' : colors.text },
                      ]}
                    >
                      {identity.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Active Days */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Active days</Text>
              <View style={styles.daysRow}>
                {DAY_LABELS.map((label, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: days[index] ? colors.accent : colors.bg,
                        borderColor: days[index] ? colors.accent : colors.divider,
                      },
                    ]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        { color: days[index] ? '#fff' : colors.text },
                      ]}
                    >
                      {label.charAt(0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.hint, { color: colors.muted }]}>
                Turn off days you don't want this habit due.
              </Text>
            </View>

            {/* Order */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Order</Text>
              <View style={styles.orderRow}>
                {Array.from({ length: isEditing ? totalHabits : totalHabits + 1 }, (_, i) => i + 1).map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.orderButton,
                      {
                        backgroundColor: order === num ? colors.accent : colors.bg,
                        borderColor: order === num ? colors.accent : colors.divider,
                      },
                    ]}
                    onPress={() => setOrder(num)}
                  >
                    <Text
                      style={[
                        styles.orderButtonText,
                        { color: order === num ? '#fff' : colors.text },
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              {/* Delete Button (only when editing) */}
              {isEditing && onDelete && (
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.danger }]}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}

              <View style={styles.rightActions}>
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
          </ScrollView>
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
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  hint: {
    fontSize: 11,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  goalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  identityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  identityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  identityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  identityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  orderButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  routineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  routineToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDuration: {
    fontSize: 12,
  },
  stepActions: {
    flexDirection: 'row',
    gap: 6,
  },
  stepActionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  addStepContainer: {
    gap: 8,
    marginTop: 8,
  },
  addStepInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  stepNameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  stepDurationInput: {
    width: 70,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  addStepButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addStepButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

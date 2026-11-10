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
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { TouchableScale } from './TouchableScale';
import { Habit, Identity, RoutineStep } from '../types';
import { useTheme } from '../theme';
import { generateId } from '../utils';
import { newQuitTracker } from '../utils/smartHabits';
import { radii, fontSizes } from '../theme/tokens';

type HabitKind = 'check' | 'count' | 'timed' | 'quit';

const KIND_OPTIONS: { kind: HabitKind; label: string; hint: string }[] = [
  { kind: 'check', label: 'Check', hint: 'Tick it off once a day.' },
  { kind: 'count', label: 'Count', hint: 'Add up to a daily amount, like 8 glasses of water.' },
  { kind: 'timed', label: 'Time', hint: 'Add up minutes toward a daily total.' },
  { kind: 'quit', label: 'Quit', hint: 'Something to stay away from. Counts the days since your last slip.' },
];

interface EditHabitModalProps {
  visible: boolean;
  habit: Habit | null;           // null = creating new habit
  identities: Identity[];
  totalHabits: number;           // For order dropdown
  onSave: (habit: Partial<Habit> & { name: string }) => void;
  onDelete?: (habitId: string) => void;
  onArchive?: (habitId: string) => void;
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
  onArchive,
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
  // How the habit is tracked: a simple tick, an amount, minutes, or a quit counter
  const [kind, setKind] = useState<HabitKind>('check');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetUnit, setTargetUnit] = useState('');

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
        setKind(habit.quit ? 'quit' : habit.target ? (habit.target.unit === 'min' ? 'timed' : 'count') : 'check');
        setTargetAmount(habit.target ? String(habit.target.amount) : '');
        setTargetUnit(habit.target && habit.target.unit !== 'min' ? habit.target.unit : '');
      } else {
        // New habit defaults
        setName('');
        setWeeklyGoal(7);
        setIdentityId('general');
        setDays([true, true, true, true, true, true, true]);
        setOrder(totalHabits + 1);
        setIsRoutine(false);
        setSteps([]);
        setKind('check');
        setTargetAmount('');
        setTargetUnit('');
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

    const trackAs: HabitKind = isRoutine ? 'check' : kind;
    const amount = Math.round(Number(targetAmount));
    if ((trackAs === 'count' || trackAs === 'timed') && !(amount >= 1 && amount <= 9999)) {
      Alert.alert('Error', trackAs === 'timed' ? 'Please enter how many minutes a day' : 'Please enter a daily amount');
      return;
    }

    const habitData = {
      id: habit?.id,
      name: name.trim(),
      weeklyGoal: trackAs === 'quit' ? 7 : weeklyGoal,
      identityId,
      days: trackAs === 'quit' ? [true, true, true, true, true, true, true] : days,
      order,
      isRoutine,
      steps: isRoutine ? steps : undefined,
      target:
        trackAs === 'timed'
          ? { amount, unit: 'min' }
          : trackAs === 'count'
            ? { amount, unit: targetUnit.trim().toLowerCase() || 'times' }
            : undefined,
      // Keep an existing counter running; start a new one from today otherwise
      quit: trackAs === 'quit' ? habit?.quit ?? newQuitTracker() : undefined,
    };
    onSave(habitData);
    onClose();
  };

  // Handle archive — keeps every log, streak and note; just stops scheduling it
  const handleArchive = () => {
    if (!habit || !onArchive) return;
    const go = () => {
      onArchive(habit.id);
      onClose();
    };
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`Archive "${habit.name}"? Its history stays; it just leaves your daily list. You can restore it from Settings.`)) go();
    } else {
      Alert.alert(
        'Archive Habit',
        `"${habit.name}" will leave your daily list but keep all its history. Restore it any time from Settings.`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Archive', onPress: go }]
      );
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!habit || !onDelete) return;

    // For web compatibility, use a simpler confirm
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(
        `Delete "${habit.name}" forever? This erases all its history. If you just want it off your list, use Archive instead.`
      );
      if (confirmed) {
        onDelete(habit.id);
        onClose();
      }
    } else {
      // Fallback to Alert for native
      Alert.alert(
        'Delete Forever',
        `This erases "${habit.name}" and all its history. If you just want it off your list, Archive keeps everything.`,
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
              <TouchableScale
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
                  {isRoutine && <Text style={[styles.checkmark, { color: colors.textOnAccent }]}>✓</Text>}
                </View>
                <Text style={[styles.routineToggleText, { color: colors.text }]}>
                  This is a routine (multi-step habit)
                </Text>
              </TouchableScale>
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
                        <TouchableScale
                          style={[styles.stepActionButton, { borderColor: colors.divider }]}
                          onPress={() => moveStepUp(index)}
                        >
                          <Text style={[styles.stepActionText, { color: colors.text }]}>↑</Text>
                        </TouchableScale>
                      )}
                      {index < steps.length - 1 && (
                        <TouchableScale
                          style={[styles.stepActionButton, { borderColor: colors.divider }]}
                          onPress={() => moveStepDown(index)}
                        >
                          <Text style={[styles.stepActionText, { color: colors.text }]}>↓</Text>
                        </TouchableScale>
                      )}
                      <TouchableScale
                        style={[styles.stepActionButton, { borderColor: colors.danger }]}
                        onPress={() => removeStep(step.id)}
                      >
                        <Text style={[styles.stepActionText, { color: colors.danger }]}>×</Text>
                      </TouchableScale>
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
                  <TouchableScale
                    style={[styles.addStepButton, { backgroundColor: colors.accent }]}
                    onPress={addStep}
                  >
                    <Text style={[styles.addStepButtonText, { color: colors.textOnAccent }]}>+ Add Step</Text>
                  </TouchableScale>
                </View>
              </View>
            )}

            {/* How it's tracked */}
            {!isRoutine && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.muted }]}>Track as</Text>
                <View style={styles.goalRow}>
                  {KIND_OPTIONS.map((opt) => (
                    <TouchableScale
                      key={opt.kind}
                      style={[
                        styles.kindButton,
                        {
                          backgroundColor: kind === opt.kind ? colors.accent : colors.bg,
                          borderColor: kind === opt.kind ? colors.accent : colors.divider,
                        },
                      ]}
                      onPress={() => setKind(opt.kind)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: kind === opt.kind }}
                    >
                      <Text style={[styles.kindButtonText, { color: kind === opt.kind ? colors.textOnAccent : colors.text }]}>
                        {opt.label}
                      </Text>
                    </TouchableScale>
                  ))}
                </View>
                <Text style={[styles.kindHint, { color: colors.muted }]}>{KIND_OPTIONS.find((o) => o.kind === kind)?.hint}</Text>

                {(kind === 'count' || kind === 'timed') && (
                  <View style={styles.targetRow}>
                    <TextInput
                      style={[styles.input, styles.targetAmount, { backgroundColor: colors.bg, borderColor: colors.divider, color: colors.text }]}
                      value={targetAmount}
                      onChangeText={(t) => setTargetAmount(t.replace(/[^0-9]/g, ''))}
                      placeholder={kind === 'timed' ? '20' : '8'}
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      maxLength={4}
                      accessibilityLabel={kind === 'timed' ? 'Minutes a day' : 'Amount a day'}
                    />
                    {kind === 'timed' ? (
                      <Text style={[styles.targetSuffix, { color: colors.text }]}>minutes a day</Text>
                    ) : (
                      <TextInput
                        style={[styles.input, styles.targetUnit, { backgroundColor: colors.bg, borderColor: colors.divider, color: colors.text }]}
                        value={targetUnit}
                        onChangeText={setTargetUnit}
                        placeholder="glasses, pages, reps…"
                        placeholderTextColor={colors.muted}
                        autoCapitalize="none"
                        maxLength={14}
                        accessibilityLabel="Unit"
                      />
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Weekly Goal */}
            {(isRoutine || kind !== 'quit') && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Weekly goal (1-7)</Text>
              <View style={styles.goalRow}>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <TouchableScale
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
                  </TouchableScale>
                ))}
              </View>
            </View>
            )}

            {/* Identity */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Identity</Text>
              <View style={styles.identityRow}>
                {identities.map((identity) => (
                  <TouchableScale
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
                  </TouchableScale>
                ))}
              </View>
            </View>

            {/* Active Days */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Active days</Text>
              <View style={styles.daysRow}>
                {DAY_LABELS.map((label, index) => (
                  <TouchableScale
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
                  </TouchableScale>
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
                  <TouchableScale
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
                  </TouchableScale>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              {/* Archive / Delete (only when editing) */}
              {isEditing && (onArchive || onDelete) && (
                <View style={styles.leftActions}>
                  {onArchive && (
                    <TouchableScale
                      style={[styles.deleteButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.divider }]}
                      onPress={handleArchive}
                    >
                      <Text style={[styles.deleteButtonText, { color: colors.text }]}>Archive</Text>
                    </TouchableScale>
                  )}
                  {onDelete && (
                    <TouchableScale style={styles.deleteLink} onPress={handleDelete} accessibilityLabel="Delete forever">
                      <Text style={[styles.deleteLinkText, { color: colors.danger }]}>Delete</Text>
                    </TouchableScale>
                  )}
                </View>
              )}

              <View style={styles.rightActions}>
                <TouchableScale
                  style={[styles.cancelButton, { borderColor: colors.divider }]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableScale>

                <TouchableScale
                  style={[styles.saveButton, { backgroundColor: colors.accent }]}
                  onPress={handleSave}
                >
                  <Text style={[styles.saveButtonText, { color: colors.textOnAccent }]}>Save</Text>
                </TouchableScale>
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
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: fontSizes.sm,
    marginBottom: 8,
  },
  hint: {
    fontSize: fontSizes.xs,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    fontSize: fontSizes.md,
  },
  kindButton: {
    flex: 1,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  kindHint: {
    fontSize: fontSizes.sm,
    marginTop: 8,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  targetAmount: {
    width: 84,
    textAlign: 'center',
  },
  targetUnit: {
    flex: 1,
  },
  targetSuffix: {
    fontSize: fontSizes.md,
  },
  goalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalButtonText: {
    fontSize: fontSizes.md,
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
    borderRadius: radii.md,
    borderWidth: 1,
  },
  identityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  identityButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: fontSizes.sm,
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
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonText: {
    fontSize: fontSizes.sm,
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
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteLink: { paddingVertical: 8 },
  deleteLinkText: { fontSize: fontSizes.sm, fontWeight: '600' },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: fontSizes.md,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  routineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  routineToggleText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  stepItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: 8,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDuration: {
    fontSize: fontSizes.xs,
  },
  stepActions: {
    flexDirection: 'row',
    gap: 6,
  },
  stepActionButton: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActionText: {
    fontSize: fontSizes.md,
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
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSizes.sm,
  },
  stepDurationInput: {
    width: 70,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  addStepButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  addStepButtonText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
});

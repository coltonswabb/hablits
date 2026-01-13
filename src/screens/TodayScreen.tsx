// ============================================
// TODAY SCREEN
// ============================================
// Main view showing today's habits to complete.
// Now with: edit modal, delete, skip/fail, pet, confetti
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  PanResponder,
  Pressable,
} from 'react-native';
import { useTheme, themeConfetti } from '../theme';
import { useApp } from '../state';
import {
  HabitCard,
  SwipeableHabitCard,
  DraggableHabitCard,
  EditHabitModal,
  Pet,
  getMoodFromProgress,
  Confetti,
  useConfetti,
  NoteModal,
  EmptyState,
  FastingModal,
  FastingTimerCard,
} from '../components';
import { getActiveHabits, todayStr, isFastingHabit, scheduleFastCompletionNotification } from '../utils';
import { Habit, PetSpecies, HatType } from '../types';

interface TodayScreenProps {
  petSpecies: PetSpecies;
  petHat: HatType;
  onOpenHatCloset: () => void;
}

export function TodayScreen({ petSpecies, petHat, onOpenHatCloset }: TodayScreenProps) {
  const { colors, themeName } = useTheme();
  const { state, dispatch } = useApp();
  const [quickAdd, setQuickAdd] = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Note modal state
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteHabitId, setNoteHabitId] = useState<string | null>(null);

  // Fasting modal state (secret feature)
  const [fastingModalVisible, setFastingModalVisible] = useState(false);
  const [fastingHabitId, setFastingHabitId] = useState<string | null>(null);

  // Confetti - full screen for all habits complete
  const fullConfetti = useConfetti();
  // Mini confetti for individual completions
  const miniConfetti = useConfetti();

  // Reorder mode state
  const [reorderMode, setReorderMode] = useState(false);

  // Track which routines are manually expanded (even when complete)
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(new Set());

  // Refs for habit card positions (for confetti origin)
  const habitRefs = useRef<Record<string, View | null>>({});
  const [lastToggledHabitId, setLastToggledHabitId] = useState<string | null>(null);

  const today = todayStr();
  const activeHabits = getActiveHabits(
    state.habits,
    new Date(),
    state.currentIdentityFilter
  );

  // Count completed habits
  const completedCount = activeHabits.filter(
    (h) => state.logs[today]?.includes(h.id)
  ).length;
  
  // Calculate completion percentage for pet mood
  const completionPercent = activeHabits.length > 0
    ? completedCount / activeHabits.length
    : 0;

  // Handle quick add
  const handleQuickAdd = () => {
    if (!quickAdd.trim()) return;

    dispatch({
      type: 'ADD_HABIT',
      payload: {
        name: quickAdd.trim(),
        weeklyGoal: 7,
        identityId:
          state.currentIdentityFilter === 'all'
            ? 'general'
            : state.currentIdentityFilter,
        days: [true, true, true, true, true, true, true],
        order: state.habits.length + 1,
      },
    });
    setQuickAdd('');
  };

  // Track previous completion count to detect new completions
  const [prevCompletedCount, setPrevCompletedCount] = useState(completedCount);

  useEffect(() => {
    // Trigger celebrations when a habit is completed
    if (completedCount > prevCompletedCount && activeHabits.length > 0) {
      // Check if ALL habits are now complete
      if (completedCount === activeHabits.length) {
        // Full-screen confetti for completing everything!
        fullConfetti.trigger();
        setTimeout(() => fullConfetti.trigger(), 300);
      } else {
        // Mini confetti for individual habit completion - measure card position
        if (lastToggledHabitId && habitRefs.current[lastToggledHabitId]) {
          habitRefs.current[lastToggledHabitId]?.measureInWindow((x, y, width, height) => {
            // Trigger confetti from the left side (where checkbox is) and vertical center of the card
            const confettiX = x + 40;
            const confettiY = y + height / 2;
            miniConfetti.trigger(confettiX, confettiY);
          });
        } else {
          miniConfetti.trigger();
        }
      }
    }
    setPrevCompletedCount(completedCount);
  }, [completedCount, activeHabits.length, lastToggledHabitId]);

  // Handle toggle (cycles: none → done → skip → fail → none)
  const handleToggle = (habitId: string) => {
    // Track which habit was toggled for confetti positioning
    setLastToggledHabitId(habitId);

    const habit = state.habits.find(h => h.id === habitId);
    const isDone = state.logs[today]?.includes(habitId) || false;
    const isSkipped = state.marks[today]?.skip?.includes(habitId) || false;
    const isFailed = state.marks[today]?.fail?.includes(habitId) || false;

    // For routines, auto-complete all steps when checking the routine
    if (habit?.isRoutine && habit.steps && !isDone && !isSkipped && !isFailed) {
      const completedSteps = state.routineStepLogs[today]?.[habitId] || [];
      // Complete any incomplete steps
      habit.steps.forEach((step) => {
        if (!completedSteps.includes(step.id)) {
          dispatch({
            type: 'TOGGLE_ROUTINE_STEP',
            payload: { habitId, stepId: step.id, date: today },
          });
        }
      });
      // Mark the routine as complete
      dispatch({ type: 'TOGGLE_HABIT', payload: { habitId, date: today } });
      // Collapse the routine
      setExpandedRoutines(prev => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
      return;
    }

    // For routines being unchecked, uncheck all steps
    if (habit?.isRoutine && habit.steps && (isDone || isSkipped || isFailed)) {
      const completedSteps = state.routineStepLogs[today]?.[habitId] || [];
      // Uncomplete all steps
      habit.steps.forEach((step) => {
        if (completedSteps.includes(step.id)) {
          dispatch({
            type: 'TOGGLE_ROUTINE_STEP',
            payload: { habitId, stepId: step.id, date: today },
          });
        }
      });
    }

    if (!isDone && !isSkipped && !isFailed) {
      // None → Done
      dispatch({ type: 'TOGGLE_HABIT', payload: { habitId, date: today } });
    } else if (isDone) {
      // Done → Skip
      dispatch({ type: 'SKIP_HABIT', payload: { habitId, date: today } });
    } else if (isSkipped) {
      // Skip → Fail
      dispatch({ type: 'FAIL_HABIT', payload: { habitId, date: today } });
    } else if (isFailed) {
      // Fail → None (clear all)
      dispatch({ type: 'TOGGLE_HABIT', payload: { habitId, date: today } });
    }
  };

  // Handle routine step toggle
  const handleToggleRoutineStep = (habitId: string, stepId: string) => {
    dispatch({
      type: 'TOGGLE_ROUTINE_STEP',
      payload: { habitId, stepId, date: today },
    });

    // Auto-complete the routine when all steps are done
    const habit = state.habits.find(h => h.id === habitId);
    if (habit?.steps) {
      const completedSteps = state.routineStepLogs[today]?.[habitId] || [];
      const totalSteps = habit.steps.length;

      // Check if this toggle will complete all steps
      const isTogglingOn = !completedSteps.includes(stepId);
      const newCompletedCount = isTogglingOn ? completedSteps.length + 1 : completedSteps.length - 1;

      if (newCompletedCount === totalSteps && !state.logs[today]?.includes(habitId)) {
        // All steps complete - mark the routine as complete and remove from expanded set
        dispatch({ type: 'TOGGLE_HABIT', payload: { habitId, date: today } });
        setExpandedRoutines(prev => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
      } else if (newCompletedCount < totalSteps && state.logs[today]?.includes(habitId)) {
        // Steps incomplete - unmark the routine
        dispatch({ type: 'TOGGLE_HABIT', payload: { habitId, date: today } });
      }
    }
  };

  // Open modal for new habit
  const handleAddHabit = () => {
    setEditingHabit(null);
    setModalVisible(true);
  };

  // Open modal for editing existing habit
  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setModalVisible(true);
  };

  // Save habit (create or update)
  const handleSaveHabit = (habitData: Partial<Habit> & { name: string }) => {
    if (habitData.id) {
      // Update existing
      const existingHabit = state.habits.find(h => h.id === habitData.id);
      if (existingHabit) {
        dispatch({
          type: 'UPDATE_HABIT',
          payload: { ...existingHabit, ...habitData } as Habit,
        });
      }
    } else {
      // Create new - pass ALL fields from habitData
      dispatch({
        type: 'ADD_HABIT',
        payload: {
          name: habitData.name,
          weeklyGoal: habitData.weeklyGoal || 7,
          identityId: habitData.identityId || 'general',
          days: habitData.days || [true, true, true, true, true, true, true],
          order: habitData.order || state.habits.length + 1,
          isRoutine: habitData.isRoutine,
          steps: habitData.steps,
        },
      });
    }
  };

  // Delete habit
  const handleDeleteHabit = (habitId: string) => {
    dispatch({ type: 'DELETE_HABIT', payload: habitId });
  };

  // Reorder habit (move up or down)
  const handleReorderHabit = (habitId: string, direction: 'up' | 'down') => {
    const sortedHabits = [...state.habits].sort((a, b) => a.order - b.order);
    const currentIndex = sortedHabits.findIndex((h) => h.id === habitId);

    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === sortedHabits.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reordered = [...sortedHabits];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(newIndex, 0, moved);

    dispatch({ type: 'REORDER_HABITS', payload: reordered });
  };

  // Get identity for a habit
  const getIdentity = (identityId: string) => {
    return (
      state.identities.find((i) => i.id === identityId) || state.identities[0]
    );
  };

  // Handle note press
  const handleNotePress = (habitId: string) => {
    setNoteHabitId(habitId);
    setNoteModalVisible(true);
  };

  // Save note
  const handleSaveNote = (note: string) => {
    if (noteHabitId && note.trim()) {
      dispatch({
        type: 'SET_NOTE',
        payload: { habitId: noteHabitId, date: today, note: note.trim() },
      });
    }
  };

  // Delete note
  const handleDeleteNote = () => {
    if (noteHabitId) {
      dispatch({
        type: 'DELETE_NOTE',
        payload: { habitId: noteHabitId, date: today },
      });
    }
  };

  // FASTING FEATURE HANDLERS (Secret Feature)
  const handleStartFast = (habitId: string, duration: number, startTime: string) => {
    dispatch({
      type: 'START_FAST',
      payload: { habitId, duration, startTime },
    });

    // Schedule notification
    const habit = state.habits.find(h => h.id === habitId);
    if (habit) {
      const fast = {
        habitId,
        startTime,
        duration,
        targetTime: new Date(new Date(startTime).getTime() + duration * 60 * 60 * 1000).toISOString(),
      };
      scheduleFastCompletionNotification(fast, habit.name);
    }
  };

  const handleUpdateFastStartTime = (habitId: string, startTime: string) => {
    dispatch({
      type: 'UPDATE_FAST_START_TIME',
      payload: { habitId, startTime },
    });

    // Reschedule notification
    const fast = state.activeFasts[habitId];
    const habit = state.habits.find(h => h.id === habitId);
    if (fast && habit) {
      const updatedFast = {
        ...fast,
        startTime,
        targetTime: new Date(new Date(startTime).getTime() + fast.duration * 60 * 60 * 1000).toISOString(),
      };
      scheduleFastCompletionNotification(updatedFast, habit.name);
    }
  };

  const handleEndFast = (habitId: string) => {
    dispatch({
      type: 'END_FAST',
      payload: habitId,
    });
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Full-screen confetti for completing all habits */}
      <Confetti
        key={fullConfetti.key}
        active={fullConfetti.isActive}
        onComplete={fullConfetti.onComplete}
        colors={themeConfetti[themeName]}
        count={60}
      />

      {/* Mini confetti for individual completions */}
      <Confetti
        key={`mini-${miniConfetti.key}`}
        active={miniConfetti.isActive}
        onComplete={miniConfetti.onComplete}
        colors={themeConfetti[themeName]}
        mini={true}
        count={15}
        originX={miniConfetti.originX}
        originY={miniConfetti.originY}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>Today</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Pet - tap to open hat closet */}
            <TouchableOpacity onPress={onOpenHatCloset} activeOpacity={0.8}>
              <Pet
                species={petSpecies}
                mood={getMoodFromProgress(completionPercent)}
                hat={petHat}
                size={48}
                completionsToday={completedCount}
              />
            </TouchableOpacity>
            <View style={[styles.datePill, { borderColor: colors.divider }]}>
              <Text style={[styles.dateText, { color: colors.muted }]}>
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={[styles.countPill, { backgroundColor: colors.accent }]}>
              <Text style={styles.countText}>
                {completedCount}/{activeHabits.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick add and Reorder button */}
        <View style={styles.quickAddRow}>
          {!reorderMode ? (
            <>
              <TextInput
                style={[
                  styles.quickAddInput,
                  { backgroundColor: colors.card, borderColor: colors.divider, color: colors.text },
                ]}
                placeholder="Quick add a habit…"
                placeholderTextColor={colors.muted}
                value={quickAdd}
                onChangeText={setQuickAdd}
                onSubmitEditing={handleQuickAdd}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.accent }]}
                onPress={handleQuickAdd}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
              {activeHabits.length > 1 && (
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.divider }]}
                  onPress={() => setReorderMode(true)}
                >
                  <Text style={[styles.addButtonText, { color: colors.text }]}>↕️</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.good, flex: 1 }]}
              onPress={() => setReorderMode(false)}
            >
              <Text style={styles.addButtonText}>Done Reordering</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Habit list */}
        <View style={styles.habitList}>
          {activeHabits.length === 0 ? (
            <EmptyState
              icon="✨"
              title="No habits for today"
              message="Add your first habit above to get started!"
            />
          ) : (
            activeHabits.map((habit, index) => {
              // Check if it's a routine habit
              if (habit.isRoutine && habit.steps && habit.steps.length > 0) {
                // Routine habit rendering
                const completedSteps = state.routineStepLogs[today]?.[habit.id] || [];
                const totalSteps = habit.steps.length;
                const allStepsComplete = completedSteps.length === totalSteps;
                const isRoutineComplete = state.logs[today]?.includes(habit.id) || false;

                return (
                  <View key={habit.id} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {reorderMode && (
                        <View style={{ gap: 4 }}>
                          <TouchableOpacity
                            onPress={() => handleReorderHabit(habit.id, 'up')}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: colors.card,
                              borderWidth: 1,
                              borderColor: colors.divider,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            disabled={index === 0}
                          >
                            <Text style={{ color: index === 0 ? colors.muted : colors.text, fontSize: 16 }}>↑</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleReorderHabit(habit.id, 'down')}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: colors.card,
                              borderWidth: 1,
                              borderColor: colors.divider,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            disabled={index === activeHabits.length - 1}
                          >
                            <Text style={{ color: index === activeHabits.length - 1 ? colors.muted : colors.text, fontSize: 16 }}>↓</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      <View
                        style={{ flex: 1 }}
                        ref={(ref) => { habitRefs.current[habit.id] = ref; }}
                        collapsable={false}
                      >
                        <SwipeableHabitCard
                          habit={habit}
                          identity={getIdentity(habit.identityId)}
                          logs={state.logs}
                          marks={state.marks}
                          today={today}
                          index={index}
                          onToggle={() => handleToggle(habit.id)}
                          onPress={() => handleEditHabit(habit)}
                          onNotePress={() => handleNotePress(habit.id)}
                          hasNote={!!state.notes[today]?.[habit.id]}
                          isComplete={isRoutineComplete}
                          isSkipped={state.marks[today]?.skip?.includes(habit.id) || false}
                        />
                      </View>
                    </View>

                    {/* Routine steps */}
                    <View style={{ marginLeft: reorderMode ? 48 : 0, marginTop: -8 }}>
                      {allStepsComplete && !expandedRoutines.has(habit.id) ? (
                        // Collapsed/stacked view when all steps complete
                        <View style={{ paddingTop: 2, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ flex: 1, position: 'relative', height: 32 + (habit.steps.length - 1) * 6 }}>
                            {habit.steps.sort((a, b) => b.order - a.order).map((step, idx) => {
                              const reverseIdx = habit.steps.length - 1 - idx;
                              const isTopCard = idx === 0;
                              const opacity = isTopCard ? 1.0 : 0.3 + (reverseIdx / habit.steps.length) * 0.5;
                              return (
                                <View
                                  key={step.id}
                                  style={{
                                    position: 'absolute',
                                    top: reverseIdx * 6,
                                    left: 0,
                                    right: 0,
                                    height: 32,
                                    backgroundColor: colors.muted,
                                    opacity: opacity,
                                    borderRadius: 4,
                                    borderWidth: 1,
                                    borderColor: colors.divider,
                                    justifyContent: 'center',
                                    paddingHorizontal: 12,
                                    zIndex: reverseIdx,
                                  }}
                                >
                                  {isTopCard && (
                                    <Text
                                      style={{
                                        fontSize: 12,
                                        color: '#ffffff',
                                        fontWeight: '500',
                                      }}
                                      numberOfLines={1}
                                    >
                                      {habit.name} - {habit.steps.length} steps - Complete
                                    </Text>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              setExpandedRoutines(prev => {
                                const next = new Set(prev);
                                next.add(habit.id);
                                return next;
                              });
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              backgroundColor: colors.card,
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: colors.divider,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 14, color: colors.muted }}>↓</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        // Expanded view when steps incomplete or manually expanded
                        <View>
                          {allStepsComplete && (
                            <TouchableOpacity
                              onPress={() => {
                                setExpandedRoutines(prev => {
                                  const next = new Set(prev);
                                  next.delete(habit.id);
                                  return next;
                                });
                              }}
                              style={{
                                alignSelf: 'flex-end',
                                marginBottom: 4,
                                paddingVertical: 2,
                                paddingHorizontal: 6,
                                backgroundColor: colors.card,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.divider,
                              }}
                            >
                              <Text style={{ fontSize: 10, color: colors.muted, fontWeight: '600' }}>
                                Collapse ↑
                              </Text>
                            </TouchableOpacity>
                          )}
                          {habit.steps.sort((a, b) => a.order - b.order).map((step, stepIndex) => {
                          const isStepComplete = completedSteps.includes(step.id);
                          return (
                            <TouchableOpacity
                              key={step.id}
                              style={[
                                styles.routineStep,
                                {
                                  backgroundColor: isStepComplete ? colors.muted : colors.card,
                                  borderColor: colors.divider,
                                  opacity: isStepComplete ? 0.5 : 1,
                                },
                              ]}
                              onPress={() => handleToggleRoutineStep(habit.id, step.id)}
                            >
                              <View
                                style={[
                                  styles.stepCheckbox,
                                  {
                                    backgroundColor: isStepComplete ? colors.good : colors.bg,
                                    borderColor: isStepComplete ? colors.good : colors.divider,
                                  },
                                ]}
                              >
                                {isStepComplete && <Text style={styles.stepCheckmark}>✓</Text>}
                              </View>
                              <Text
                                style={[
                                  styles.stepText,
                                  {
                                    color: colors.text,
                                    textDecorationLine: isStepComplete ? 'line-through' : 'none',
                                  }
                                ]}
                              >
                                {stepIndex + 1}. {step.name}
                              </Text>
                              {step.duration && (
                                <Text style={[styles.stepDurationBadge, { color: colors.muted }]}>
                                  {step.duration}m
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                        </View>
                      )}
                    </View>
                  </View>
                );
              }

              // SECRET FASTING FEATURE - Check if habit is a "Fast" habit
              if (isFastingHabit(habit.name)) {
                const activeFast = state.activeFasts[habit.id] || null;
                const isComplete = state.logs[today]?.includes(habit.id) || false;

                return (
                  <View key={habit.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {reorderMode && (
                      <View style={{ gap: 4 }}>
                        <TouchableOpacity
                          onPress={() => handleReorderHabit(habit.id, 'up')}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.divider,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          disabled={index === 0}
                        >
                          <Text style={{ color: index === 0 ? colors.muted : colors.text, fontSize: 16 }}>↑</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleReorderHabit(habit.id, 'down')}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.divider,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          disabled={index === activeHabits.length - 1}
                        >
                          <Text style={{ color: index === activeHabits.length - 1 ? colors.muted : colors.text, fontSize: 16 }}>↓</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <FastingTimerCard
                        habitId={habit.id}
                        habitName={habit.name}
                        activeFast={activeFast}
                        isComplete={isComplete}
                        onStartFast={() => {
                          setFastingHabitId(habit.id);
                          setFastingModalVisible(true);
                        }}
                        onEndFast={() => handleEndFast(habit.id)}
                        onEditStartTime={() => {
                          setFastingHabitId(habit.id);
                          setFastingModalVisible(true);
                        }}
                        onToggleComplete={() => handleToggle(habit.id)}
                        onEdit={() => handleEditHabit(habit)}
                        onDelete={() => handleDeleteHabit(habit.id)}
                      />
                    </View>
                  </View>
                );
              }

              // Regular habit rendering
              return (
                <View key={habit.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {reorderMode && (
                    <View style={{ gap: 4 }}>
                      <TouchableOpacity
                        onPress={() => handleReorderHabit(habit.id, 'up')}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.divider,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        disabled={index === 0}
                      >
                        <Text style={{ color: index === 0 ? colors.muted : colors.text, fontSize: 16 }}>↑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleReorderHabit(habit.id, 'down')}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.divider,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        disabled={index === activeHabits.length - 1}
                      >
                        <Text style={{ color: index === activeHabits.length - 1 ? colors.muted : colors.text, fontSize: 16 }}>↓</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View
                    style={{ flex: 1 }}
                    ref={(ref) => { habitRefs.current[habit.id] = ref; }}
                    collapsable={false}
                  >
                    <SwipeableHabitCard
                      habit={habit}
                      identity={getIdentity(habit.identityId)}
                      logs={state.logs}
                      marks={state.marks}
                      today={today}
                      index={index}
                      onToggle={() => handleToggle(habit.id)}
                      onPress={() => handleEditHabit(habit)}
                      onNotePress={() => handleNotePress(habit.id)}
                      hasNote={!!state.notes[today]?.[habit.id]}
                      isComplete={state.logs[today]?.includes(habit.id) || false}
                      isSkipped={state.marks[today]?.skip?.includes(habit.id) || false}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Tip for skip/fail and swipe */}
        {activeHabits.length > 0 && !reorderMode && (
          <Text style={[styles.tipText, { color: colors.muted }]}>
            Tip: Swipe right to complete, left to skip, or tap checkbox to cycle ✓ → – → ×
          </Text>
        )}
        {reorderMode && (
          <Text style={[styles.tipText, { color: colors.muted }]}>
            Use ↑ ↓ arrows to reorder habits, then tap "Done Reordering"
          </Text>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={handleAddHabit}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      <EditHabitModal
        visible={modalVisible}
        habit={editingHabit}
        identities={state.identities}
        totalHabits={state.habits.length}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
        onClose={() => setModalVisible(false)}
      />

      {/* Note Modal */}
      <NoteModal
        visible={noteModalVisible}
        habitName={
          noteHabitId
            ? state.habits.find(h => h.id === noteHabitId)?.name || ''
            : ''
        }
        existingNote={
          noteHabitId && state.notes[today]?.[noteHabitId]
            ? state.notes[today][noteHabitId]
            : ''
        }
        onSave={handleSaveNote}
        onDelete={
          noteHabitId && state.notes[today]?.[noteHabitId]
            ? handleDeleteNote
            : undefined
        }
        onClose={() => setNoteModalVisible(false)}
      />

      {/* Fasting Modal - Secret Feature */}
      <FastingModal
        visible={fastingModalVisible}
        onClose={() => setFastingModalVisible(false)}
        onSelectDuration={(hours, startTime) => {
          if (fastingHabitId) {
            const existingFast = state.activeFasts[fastingHabitId];
            if (existingFast) {
              // Updating existing fast
              handleUpdateFastStartTime(fastingHabitId, startTime);
            } else {
              // Starting new fast
              handleStartFast(fastingHabitId, hours, startTime);
            }
          }
        }}
        currentStartTime={
          fastingHabitId && state.activeFasts[fastingHabitId]
            ? state.activeFasts[fastingHabitId].startTime
            : undefined
        }
        currentDuration={
          fastingHabitId && state.activeFasts[fastingHabitId]
            ? state.activeFasts[fastingHabitId].duration
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 12,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickAddInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  habitList: {
    gap: 0,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  tipText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: -2,
  },
  routineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
    gap: 12,
  },
  stepCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  stepDurationBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
});

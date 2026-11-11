// ============================================
// TODAY SCREEN
// ============================================
// Main view showing today's habits to complete.
// Now with: edit modal, delete, skip/fail, pet, confetti
// ============================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Animated,
  PanResponder,
  Pressable,
  Alert,
} from 'react-native';
import { TouchableScale } from '../components/TouchableScale';
import { useTheme, themeConfetti, spacing } from '../theme';
import { textOn } from '../theme/colors';
import { allDoneCelebration, habitDonePop } from '../utils/celebrate';
import { getProgress, isOnVacation, quitBest, quitDays } from '../utils/smartHabits';
import { comebackLine, petTapLine } from '../utils/petVoice';
import { currentLetter } from '../utils/petLetter';
import { PetStage } from '../utils/evolution';
import { PetLetterCard } from '../components/PetLetterCard';
import { RoutineRunnerModal } from '../components/RoutineRunnerModal';
import { EnterExit } from '../components/Animations';
import { useApp } from '../state';
import {
  HabitCard,
  SwipeableHabitCard,
  DraggableHabitCard,
  EditHabitModal,
  Pet,
  getMoodFromProgress,
  getUnlockedHats,
  Confetti,
  useConfetti,
  NoteModal,
  EmptyState,
  FastingModal,
  FastingTimerCard,
} from '../components';
import { getActiveHabits, todayStr, isFastingHabit, scheduleFastCompletionNotification } from '../utils';
import { Habit, PetSpecies, HatType } from '../types';
import { radii, fontSizes } from '../theme/tokens';

const PET_SIZE = 48;
const SPEECH_TAIL = 12;

interface TodayScreenProps {
  petSpecies: PetSpecies;
  petHat: HatType;
  petStage?: number;
  onOpenHatCloset: () => void;
}

export function TodayScreen({ petSpecies, petHat, petStage = 0, onOpenHatCloset }: TodayScreenProps) {
  const { colors, themeName, radius, headingFont } = useTheme();
  const { state, dispatch, isLoaded } = useApp();
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

  // Reorder mode state
  const [reorderMode, setReorderMode] = useState(false);

  // Track which routines are manually expanded (even when complete)
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(new Set());
  const [runningRoutineId, setRunningRoutineId] = useState<string | null>(null);

  // Refs for habit card positions (for confetti origin)

  const today = todayStr();
  const activeHabits = getActiveHabits(
    state.habits,
    new Date(),
    state.currentIdentityFilter
  );
  const quitHabits = state.habits.filter(
    (h) => h.quit && !h.archivedAt && (state.currentIdentityFilter === 'all' || h.identityId === state.currentIdentityFilter)
  );
  const onVacation = isOnVacation(state);


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

  // Weekly note from the pet (Mon/Tue, about last week)
  const letter = useMemo(() => currentLetter(state, petStage as PetStage), [state.logs, state.habits, state.lastLetterDismissed, state.petName, petStage]);

  // Track previous completion count to detect new completions
  const [prevCompletedCount, setPrevCompletedCount] = useState(completedCount);
  const [treatKey, setTreatKey] = useState(0);
  const [bigTreat, setBigTreat] = useState(false);
  // True while a habit card is being swiped, so the pet can watch
  const [petAttentive, setPetAttentive] = useState(false);
  // Where the pet sits in the header, so its speech bubble can point at it
  const [petCenterX, setPetCenterX] = useState<number | null>(null);

  // Saved data arrives after the first render, which makes the count jump from
  // 0 to today's total. That jump is not something the user just did.
  const countSettled = useRef(false);

  useEffect(() => {
    if (!countSettled.current) {
      countSettled.current = isLoaded;
      setPrevCompletedCount(completedCount);
      return;
    }
    // Trigger celebrations when a habit is completed
    if (completedCount > prevCompletedCount && activeHabits.length > 0) {
      // The pet gets a treat for every finished habit, and a big one for finishing the day
      setBigTreat(completedCount === activeHabits.length);
      setTreatKey((k) => k + 1);
      // Check if ALL habits are now complete
      if (completedCount === activeHabits.length) {
        // Everything done: one orchestrated fanfare (haptics → sound → confetti)
        allDoneCelebration(() => fullConfetti.trigger());
      } else {
        // One habit done: a soft pop. The pet's treat is the visual reward, so no confetti here.
        habitDonePop();
      }
    }
    setPrevCompletedCount(completedCount);
  }, [completedCount, activeHabits.length, isLoaded]);

  // ---- Pet ----
  // Tap the pet and it says something about right now; the line fades after a few seconds
  const [petLine, setPetLine] = useState<string | null>(null);
  const petTaps = useRef(0);
  const petLineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlePetTap = () => {
    setPetLine(petTapLine(state, petTaps.current++));
    if (petLineTimer.current) clearTimeout(petLineTimer.current);
    petLineTimer.current = setTimeout(() => setPetLine(null), 5000);
  };
  useEffect(() => () => {
    if (petLineTimer.current) clearTimeout(petLineTimer.current);
  }, []);

  const welcomeBack = comebackLine(state);

  // New-hat announcement. Hats unlock by total completions; hatsSeen is how
  // many the user has already been shown (set silently the first time).
  const unlockedHats = getUnlockedHats(Object.values(state.logs).reduce((sum, ids) => sum + ids.length, 0));
  const unlockedHatCount = unlockedHats.length;
  useEffect(() => {
    if (isLoaded && state.hatsSeen === undefined) dispatch({ type: 'SET_HATS_SEEN', payload: unlockedHatCount });
  }, [isLoaded, state.hatsSeen, unlockedHatCount]);
  const newHatKey = state.hatsSeen !== undefined && unlockedHatCount > state.hatsSeen ? unlockedHats[unlockedHatCount - 1] : null;
  const newHat = newHatKey === 'tophat' ? 'top hat' : newHatKey === 'party' ? 'party hat' : newHatKey;

  // Count/timed habits: add to (or take from) today's amount
  const handleAddProgress = (habitId: string, delta: number) => {
    dispatch({
      type: 'SET_PROGRESS',
      payload: { habitId, date: today, amount: getProgress(state, habitId, today) + delta },
    });
  };

  // Quit habits: a slip restarts the count
  const handleSlip = (habit: Habit) => {
    Alert.alert(
      `Slipped on "${habit.name}"?`,
      `Your count restarts today. Your best run (${quitBest(habit)} day${quitBest(habit) === 1 ? '' : 's'}) is kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restart count', style: 'destructive', onPress: () => dispatch({ type: 'RECORD_SLIP', payload: habit.id }) },
      ]
    );
  };

  // Handle toggle (cycles: none → done → skip → fail → none)
  const handleToggle = (habitId: string) => {

    const habit = state.habits.find(h => h.id === habitId);
    const isDone = state.logs[today]?.includes(habitId) || false;
    const isSkipped = state.marks[today]?.skip?.includes(habitId) || false;
    const isFailed = state.marks[today]?.fail?.includes(habitId) || false;

    // For routines, auto-complete all steps when checking the routine from unchecked state
    if (habit?.isRoutine && habit.steps && habit.steps.length > 0 && !isDone && !isSkipped && !isFailed) {
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
          target: habitData.target,
          quit: habitData.quit,
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

      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }, headingFont]}>Today</Text>
          </View>
          <View
            style={styles.headerRight}
            onLayout={(e) => setPetCenterX(e.nativeEvent.layout.x + PET_SIZE / 2)}
          >
            {/* Pet - tap it and it talks */}
            <Pet
              species={petSpecies}
              mood={getMoodFromProgress(completionPercent)}
              hat={petHat}
              size={PET_SIZE}
              completionsToday={completedCount}
              stage={petStage}
              onPress={handlePetTap}
              attentive={petAttentive}
              treatKey={treatKey}
              bigTreat={bigTreat}
            />
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
              <Text style={[styles.countText, { color: colors.textOnAccent }]}>
                {completedCount}/{activeHabits.length}
              </Text>
            </View>
          </View>
        </View>

        {/* What the pet says when tapped: a speech bubble right under it */}
        <EnterExit show={!!petLine}>
          <View
            style={[styles.noticeCard, styles.speechBubble, { backgroundColor: colors.card, borderColor: colors.accent, borderRadius: radius.lg }]}
            accessibilityLiveRegion="polite"
          >
            {/* The tail points up at the pet in the header */}
            {petCenterX !== null && (
              <View
                style={[
                  styles.speechTail,
                  { left: petCenterX - SPEECH_TAIL / 2, backgroundColor: colors.card, borderColor: colors.accent },
                ]}
              />
            )}
            <Text style={[styles.noticeText, { color: colors.text }]}>{petLine}</Text>
            <TouchableScale onPress={onOpenHatCloset} accessibilityRole="button" accessibilityLabel="Open the hat closet">
              <Text style={[styles.noticeAction, { color: colors.accent }]}>Hats</Text>
            </TouchableScale>
          </View>
        </EnterExit>

        {/* Quick add and Reorder button */}
        {letter && (
          <PetLetterCard
            letter={letter}
            species={petSpecies}
            hat={petHat}
            stage={petStage}
            petName={state.petName}
            weekPct={letter.pct}
            weekStat={letter.stat}
            onDismiss={() => dispatch({ type: 'DISMISS_LETTER', payload: letter.weekStart })}
          />
        )}

        {/* A new hat was earned since the user last looked */}
        {newHat && (
          <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.divider, borderRadius: radius.md }]}>
            <Text style={[styles.noticeText, { color: colors.text }]}>
              🎉 New hat unlocked: the {newHat}! {(state.petName || '').trim() || 'Your pet'} wants to try it on.
            </Text>
            <TouchableScale
              onPress={() => {
                dispatch({ type: 'SET_HATS_SEEN', payload: unlockedHatCount });
                onOpenHatCloset();
              }}
              accessibilityRole="button"
            >
              <Text style={[styles.noticeAction, { color: colors.accent }]}>Try it on</Text>
            </TouchableScale>
          </View>
        )}

        {/* Back after a few days away */}
        {welcomeBack && !petLine && (
          <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.divider, borderRadius: radius.md }]}>
            <Text style={[styles.noticeText, { color: colors.text }]}>👋 {welcomeBack}</Text>
          </View>
        )}

        {/* Vacation mode: streaks are paused */}
        {onVacation && (
          <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.divider, borderRadius: radius.md }]}>
            <Text style={[styles.noticeText, { color: colors.text }]}>
              🏝 Vacation mode is on. Streaks are paused and reminders are off.
            </Text>
            <TouchableScale onPress={() => dispatch({ type: 'SET_VACATION', payload: false })} accessibilityRole="button">
              <Text style={[styles.noticeAction, { color: colors.accent }]}>I'm back</Text>
            </TouchableScale>
          </View>
        )}

        {/* A pet snack covered a missed day */}
        {state.lastSnackNote && (
          <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.divider, borderRadius: radius.md }]}>
            <Text style={[styles.noticeText, { color: colors.text }]}>
              🍪 {(state.petName || '').trim() || 'Your pet'} ate a snack to keep your {state.lastSnackNote.habitNames.join(' and ')} streak
              {state.lastSnackNote.habitNames.length > 1 ? 's' : ''} alive. {state.snacks ?? 0} left.
            </Text>
            <TouchableScale onPress={() => dispatch({ type: 'DISMISS_SNACK_NOTE' })} accessibilityRole="button">
              <Text style={[styles.noticeAction, { color: colors.accent }]}>Nice</Text>
            </TouchableScale>
          </View>
        )}

        <View style={styles.quickAddRow}>
          {!reorderMode ? (
            <>
              <TextInput
                style={[
                  styles.quickAddInput,
                  { backgroundColor: colors.card, borderColor: colors.divider, color: colors.text, borderRadius: radius.md },
                ]}
                placeholder="Quick add a habit…"
                placeholderTextColor={colors.muted}
                value={quickAdd}
                onChangeText={setQuickAdd}
                onSubmitEditing={handleQuickAdd}
                returnKeyType="done"
              />
              <TouchableScale
                style={[styles.addButton, { backgroundColor: colors.accent, borderRadius: radius.md }]}
                onPress={handleQuickAdd}
              >
                <Text style={[styles.addButtonText, { color: colors.textOnAccent }]}>Add</Text>
              </TouchableScale>
              {activeHabits.length > 1 && (
                <TouchableScale
                  style={[styles.addButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md }]}
                  onPress={() => setReorderMode(true)}
                >
                  <Text style={[styles.addButtonText, { color: colors.text }]}>↕️</Text>
                </TouchableScale>
              )}
            </>
          ) : (
            <TouchableScale
              style={[styles.addButton, { backgroundColor: colors.good, flex: 1 }]}
              onPress={() => setReorderMode(false)}
            >
              <Text style={[styles.addButtonText, { color: textOn(colors.good) }]}>Done Reordering</Text>
            </TouchableScale>
          )}
        </View>

        {/* Habit list */}
        <View style={styles.habitList}>
          {activeHabits.length === 0 ? (
            <EmptyState
              illustration={<Pet species={petSpecies} mood="curious" hat={petHat} size={112} stage={petStage} onPress={handlePetTap} />}
              title={`${(state.petName || '').trim() || 'Your pet'} is waiting for a first habit`}
              message="Type one in the box above and tap Add. Every habit you finish is a treat for your pet."
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
                          <TouchableScale
                            onPress={() => handleReorderHabit(habit.id, 'up')}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: radii.sm,
                              backgroundColor: colors.card,
                              borderWidth: 1,
                              borderColor: colors.divider,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            disabled={index === 0}
                          >
                            <Text style={{ color: index === 0 ? colors.muted : colors.text, fontSize: fontSizes.md }}>↑</Text>
                          </TouchableScale>
                          <TouchableScale
                            onPress={() => handleReorderHabit(habit.id, 'down')}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: radii.sm,
                              backgroundColor: colors.card,
                              borderWidth: 1,
                              borderColor: colors.divider,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            disabled={index === activeHabits.length - 1}
                          >
                            <Text style={{ color: index === activeHabits.length - 1 ? colors.muted : colors.text, fontSize: fontSizes.md }}>↓</Text>
                          </TouchableScale>
                        </View>
                      )}
                      <View
                        style={{ flex: 1 }}
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
                          <View style={{ flex: 1, position: 'relative', height: 32 + ((habit.steps?.length ?? 1) - 1) * 6 }}>
                            {[...(habit.steps ?? [])].sort((a, b) => b.order - a.order).map((step, idx) => {
                              const stepCount = habit.steps?.length ?? 0;
                              const reverseIdx = stepCount - 1 - idx;
                              const isTopCard = idx === 0;
                              const opacity = isTopCard ? 1.0 : 0.3 + (reverseIdx / stepCount) * 0.5;
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
                                    borderRadius: radii.xs,
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
                                        fontSize: fontSizes.xs,
                                        color: '#ffffff',
                                        fontWeight: '500',
                                      }}
                                      numberOfLines={1}
                                    >
                                      {habit.name} - {habit.steps?.length ?? 0} steps - Complete
                                    </Text>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                          <TouchableScale
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
                              borderRadius: radii.lg,
                              borderWidth: 1,
                              borderColor: colors.divider,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: fontSizes.sm, color: colors.muted }}>↓</Text>
                          </TouchableScale>
                        </View>
                      ) : (
                        // Expanded view when steps incomplete or manually expanded
                        <View>
                          {allStepsComplete && (
                            <TouchableScale
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
                                borderRadius: radii.md,
                                borderWidth: 1,
                                borderColor: colors.divider,
                              }}
                            >
                              <Text style={{ fontSize: fontSizes.micro, color: colors.muted, fontWeight: '600' }}>
                                Collapse ↑
                              </Text>
                            </TouchableScale>
                          )}
                          {!allStepsComplete && (
                            <TouchableScale
                              onPress={() => setRunningRoutineId(habit.id)}
                              style={[styles.startRoutine, { backgroundColor: colors.accent }]}
                              accessibilityLabel={`Start ${habit.name}`}
                            >
                              <Text style={[styles.startRoutineText, { color: colors.textOnAccent }]}>
                                {`▶  Start routine${habit.steps.some((st) => st.duration) ? ` · ${habit.steps.reduce((m, st) => m + (st.duration || 0), 0)} min` : ''}`}
                              </Text>
                            </TouchableScale>
                          )}
                          {[...habit.steps].sort((a, b) => a.order - b.order).map((step, stepIndex) => {
                          const isStepComplete = completedSteps.includes(step.id);
                          return (
                            <TouchableScale
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
                                {isStepComplete && <Text style={[styles.stepCheckmark, { color: textOn(colors.good) }]}>✓</Text>}
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
                            </TouchableScale>
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
                        <TouchableScale
                          onPress={() => handleReorderHabit(habit.id, 'up')}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: radii.sm,
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.divider,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          disabled={index === 0}
                        >
                          <Text style={{ color: index === 0 ? colors.muted : colors.text, fontSize: fontSizes.md }}>↑</Text>
                        </TouchableScale>
                        <TouchableScale
                          onPress={() => handleReorderHabit(habit.id, 'down')}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: radii.sm,
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.divider,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          disabled={index === activeHabits.length - 1}
                        >
                          <Text style={{ color: index === activeHabits.length - 1 ? colors.muted : colors.text, fontSize: fontSizes.md }}>↓</Text>
                        </TouchableScale>
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
                      <TouchableScale
                        onPress={() => handleReorderHabit(habit.id, 'up')}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: radii.sm,
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.divider,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        disabled={index === 0}
                      >
                        <Text style={{ color: index === 0 ? colors.muted : colors.text, fontSize: fontSizes.md }}>↑</Text>
                      </TouchableScale>
                      <TouchableScale
                        onPress={() => handleReorderHabit(habit.id, 'down')}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: radii.sm,
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.divider,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        disabled={index === activeHabits.length - 1}
                      >
                        <Text style={{ color: index === activeHabits.length - 1 ? colors.muted : colors.text, fontSize: fontSizes.md }}>↓</Text>
                      </TouchableScale>
                    </View>
                  )}
                  <View
                    style={{ flex: 1 }}
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
                      progressAmount={getProgress(state, habit.id, today)}
                      onAddProgress={(delta) => handleAddProgress(habit.id, delta)}
                      onSwipeActiveChange={setPetAttentive}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Quit habits: days since the last slip, no daily ticking */}
        {quitHabits.length > 0 && !reorderMode && (
          <View style={styles.quitSection}>
            <Text style={[styles.quitHeading, { color: colors.muted }]}>STAYING AWAY FROM</Text>
            {quitHabits.map((habit) => {
              const days = quitDays(habit);
              const best = quitBest(habit);
              return (
                <TouchableScale
                  key={habit.id}
                  style={[styles.quitCard, { backgroundColor: colors.card, borderColor: colors.divider, borderRadius: radius.md }]}
                  onPress={() => handleEditHabit(habit)}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel={`${habit.name}, ${days} day${days === 1 ? '' : 's'} clean, best ${best}`}
                >
                  <View style={[styles.quitDays, { backgroundColor: colors.good }]}>
                    <Text style={[styles.quitDaysNumber, { color: textOn(colors.good) }]}>{days}</Text>
                    <Text style={[styles.quitDaysLabel, { color: textOn(colors.good) }]}>{days === 1 ? 'day' : 'days'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.quitName, { color: colors.text }]} numberOfLines={1}>{habit.name}</Text>
                    <Text style={[styles.quitMeta, { color: colors.muted }]}>
                      {days === 0 ? 'Day one starts now' : days >= best ? 'Your best run yet' : `Best run: ${best} days`}
                    </Text>
                  </View>
                  <TouchableScale
                    style={[styles.slipButton, { borderColor: colors.divider }]}
                    onPress={() => handleSlip(habit)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`I slipped on ${habit.name}`}
                  >
                    <Text style={[styles.slipButtonText, { color: colors.muted }]}>I slipped</Text>
                  </TouchableScale>
                </TouchableScale>
              );
            })}
          </View>
        )}

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
      <TouchableScale
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={handleAddHabit}
      >
        <Text style={[styles.fabText, { color: colors.textOnAccent }]}>+</Text>
      </TouchableScale>

      {/* Edit Modal */}
      <EditHabitModal
        visible={modalVisible}
        habit={editingHabit}
        identities={state.identities}
        totalHabits={state.habits.length}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
        onArchive={(habitId) => dispatch({ type: 'ARCHIVE_HABIT', payload: habitId })}
        onClose={() => setModalVisible(false)}
      />

      {/* Routine runner */}
      <RoutineRunnerModal
        visible={runningRoutineId !== null}
        habit={state.habits.find((h) => h.id === runningRoutineId) ?? null}
        completedStepIds={runningRoutineId ? state.routineStepLogs[today]?.[runningRoutineId] || [] : []}
        onToggleStep={(stepId) => runningRoutineId && handleToggleRoutineStep(runningRoutineId, stepId)}
        onClose={() => setRunningRoutineId(null)}
        species={petSpecies}
        hat={petHat}
        stage={petStage}
        petName={state.petName}
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
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 12,
  },
  speechBubble: {
    marginTop: -spacing.xs,
  },
  speechTail: {
    position: 'absolute',
    top: -SPEECH_TAIL / 2 - 1,
    width: SPEECH_TAIL,
    height: SPEECH_TAIL,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  noticeText: {
    flex: 1,
    fontSize: fontSizes.sm,
    lineHeight: 19,
  },
  noticeAction: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  quitSection: {
    marginTop: 18,
  },
  quitHeading: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  quitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 10,
    marginBottom: 10,
  },
  quitDays: {
    width: 54,
    height: 54,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitDaysNumber: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
  },
  quitDaysLabel: {
    fontSize: fontSizes.micro,
    fontWeight: '700',
  },
  quitName: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  quitMeta: {
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  slipButton: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  slipButtonText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
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
    fontSize: fontSizes.display,
    fontWeight: '900',
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  dateText: {
    fontSize: fontSizes.xs,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  countText: {
    color: '#fff',
    fontSize: fontSizes.xs,
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
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: fontSizes.md,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  habitList: {
    gap: 0,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: fontSizes.md,
  },
  tipText: {
    textAlign: 'center',
    fontSize: fontSizes.xs,
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
    fontSize: fontSizes.display,
    fontWeight: '700',
    marginTop: -2,
  },
  startRoutine: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill, marginBottom: 8 },
  startRoutineText: { fontSize: fontSizes.sm, fontWeight: '700' },
  routineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: 6,
    gap: 12,
  },
  stepCheckbox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckmark: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  stepDurationBadge: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
});

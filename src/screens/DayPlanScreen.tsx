// ============================================
// DAY PLAN SCREEN
// ============================================
// Timeline view showing habits scheduled by time.
// Assign times to habits and see them on a visual
// timeline with a "now" line.
// ============================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import { useTheme } from '../theme';
import { useApp } from '../state';
import { getActiveHabits, todayStr, dateStr } from '../utils';
import { EmptyState } from '../components';

const START_HOUR = 5;  // 5am
const END_HOUR = 23;   // 11pm
const TOTAL_HOURS = END_HOUR - START_HOUR;

export function DayPlanScreen() {
  const { colors } = useTheme();
  const { state, dispatch } = useApp();

  // Current time (updates every minute)
  const [now, setNow] = useState(new Date());

  // Schedule editor modal
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [timeInput, setTimeInput] = useState('');
  const [durationInput, setDurationInput] = useState('30');
  const [recurringInput, setRecurringInput] = useState<'once' | 'daily' | 'custom'>('daily');
  const [recurringDays, setRecurringDays] = useState<boolean[]>([true, true, true, true, true, true, true]); // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]

  // Ref for ScrollView
  const scrollViewRef = useRef<ScrollView>(null);

  // Quick schedule modal state
  const [quickScheduleVisible, setQuickScheduleVisible] = useState(false);
  const [quickScheduleHabitId, setQuickScheduleHabitId] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(30);

  const timeScrollRef = useRef<ScrollView>(null);
  const durationScrollRef = useRef<ScrollView>(null);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const today = todayStr();
  const activeHabits = getActiveHabits(
    state.habits,
    new Date(),
    state.currentIdentityFilter
  );

  // Calculate Y position (0-100%) for a time
  const getYPosition = (time: string | Date) => {
    let hours = 0;
    let minutes = 0;

    if (time instanceof Date) {
      hours = time.getHours();
      minutes = time.getMinutes();
    } else if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) {
      const [h, m] = time.split(':').map(Number);
      hours = h;
      minutes = m;
    } else {
      return -100; // Hide if invalid
    }

    const totalMinutes = (hours - START_HOUR) * 60 + minutes;
    const maxMinutes = TOTAL_HOURS * 60;
    const clamped = Math.max(0, Math.min(maxMinutes, totalMinutes));
    return (clamped / maxMinutes) * 100;
  };

  // Calculate time from Y pixel position on timeline
  const getTimeFromY = (yPixel: number): string => {
    // yPixel is relative to timeline (0 to TOTAL_HOURS * 60)
    const clampedY = Math.max(0, Math.min(TOTAL_HOURS * 60, yPixel));
    const totalMinutes = Math.round(clampedY); // 1 pixel = 1 minute

    // Snap to 15-minute intervals
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;

    const hours = START_HOUR + Math.floor(snappedMinutes / 60);
    const minutes = snappedMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Get habits with schedules, sorted by time
  const scheduledHabits = activeHabits
    .map((h) => ({
      ...h,
      schedule: state.dayPlanSchedules[h.id] || null,
    }))
    .filter((h) => h.schedule)
    .sort((a, b) => (a.schedule?.time || '').localeCompare(b.schedule?.time || ''));

  // Get habits without schedules
  const unscheduledHabits = activeHabits.filter(
    (h) => !state.dayPlanSchedules[h.id]
  );

  // Generate time options (every 15 minutes from 5am to 11pm)
  const timeOptions = useMemo(() => {
    const options: { hour: number; minute: number; display: string }[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (h === END_HOUR && m > 0) break; // Stop at 11:00pm
        const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const period = h >= 12 ? 'PM' : 'AM';
        const display = `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
        options.push({ hour: h, minute: m, display });
      }
    }
    return options;
  }, []);

  // Duration options in minutes
  const durationOptions = [15, 30, 45, 60, 90, 120, 180, 240];

  const openQuickSchedule = (habitId: string) => {
    setQuickScheduleHabitId(habitId);
    // Reset to defaults
    setSelectedHour(9);
    setSelectedMinute(0);
    setSelectedDuration(30);
    setQuickScheduleVisible(true);
  };

  const confirmSchedule = () => {
    if (!quickScheduleHabitId) return;

    const time = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;

    dispatch({
      type: 'SET_DAY_PLAN_SCHEDULE',
      payload: {
        habitId: quickScheduleHabitId,
        schedule: {
          time,
          duration: selectedDuration,
          recurring: 'daily',
          recurringDays: [true, true, true, true, true, true, true],
        },
      },
    });

    setQuickScheduleVisible(false);
    setQuickScheduleHabitId(null);
  };

  // Open schedule editor
  const openTimePicker = (habitId: string) => {
    const currentSchedule = state.dayPlanSchedules[habitId];
    setEditingHabitId(habitId);
    setTimeInput(currentSchedule?.time || '');
    setDurationInput(currentSchedule?.duration?.toString() || '30');
    setRecurringInput(currentSchedule?.recurring || 'daily');
    setRecurringDays(currentSchedule?.recurringDays || [true, true, true, true, true, true, true]);
    setTimeModalVisible(true);
  };

  // Save schedule
  const saveTime = () => {
    if (!editingHabitId) return;

    const isValid = /^\d{2}:\d{2}$/.test(timeInput);
    const duration = parseInt(durationInput, 10);

    if (isValid && duration > 0) {
      dispatch({
        type: 'SET_DAY_PLAN_SCHEDULE',
        payload: {
          habitId: editingHabitId,
          schedule: {
            time: timeInput,
            duration,
            recurring: recurringInput,
            recurringDays: recurringInput === 'daily' ? recurringDays : undefined,
          },
        },
      });
    }

    setTimeModalVisible(false);
    setEditingHabitId(null);
  };

  // Clear schedule
  const clearTime = () => {
    if (!editingHabitId) return;
    dispatch({
      type: 'SET_DAY_PLAN_SCHEDULE',
      payload: { habitId: editingHabitId, schedule: null },
    });
    setTimeModalVisible(false);
    setEditingHabitId(null);
  };

  // Toggle habit completion
  const toggleHabit = (habitId: string) => {
    dispatch({
      type: 'TOGGLE_HABIT',
      payload: { habitId, date: today },
    });
  };

  // Check habit status
  const getHabitStatus = (habitId: string) => {
    const isComplete = state.logs[today]?.includes(habitId) || false;
    const isSkipped = state.marks[today]?.skip?.includes(habitId) || false;
    const isFailed = state.marks[today]?.fail?.includes(habitId) || false;
    return { isComplete, isSkipped, isFailed };
  };

  // Get identity color
  const getIdentityColor = (identityId: string) => {
    const identity = state.identities.find((i) => i.id === identityId);
    return identity?.color || colors.accent;
  };

  // Format hour for display
  const formatHour = (hour: number) => {
    const date = new Date(2000, 0, 1, hour, 0);
    return date.toLocaleTimeString(undefined, { hour: 'numeric' });
  };

  const nowY = getYPosition(now);

  // Auto-scroll to current time on mount
  useEffect(() => {
    // Wait a bit for the component to render
    const timer = setTimeout(() => {
      const scrollY = (nowY / 100) * (TOTAL_HOURS * 60);
      // Scroll to current time minus some offset to show what's coming up
      const offsetScrollY = Math.max(0, scrollY - 100);

      scrollViewRef.current?.scrollTo({
        y: offsetScrollY,
        animated: true,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []); // Only run on mount

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Day Plan</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Timeline */}
        <View style={[styles.timelineContainer, { borderColor: colors.divider }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.timelineScroll}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            <View style={styles.timeline}>
              {/* Hour markers */}
              {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
                const hour = START_HOUR + i;
                const pixelY = i * 60; // 60 pixels per hour
                return (
                  <View key={hour} style={[styles.hourMarker, { top: pixelY }]}>
                    <Text style={[styles.hourLabel, { color: colors.muted }]}>
                      {formatHour(hour)}
                    </Text>
                    <View style={[styles.hourLine, { backgroundColor: colors.divider }]} />
                  </View>
                );
              })}

              {/* Past time overlay */}
              <View
                style={[
                  styles.pastOverlay,
                  { height: (nowY / 100) * (TOTAL_HOURS * 60), backgroundColor: colors.muted + '15' },
                ]}
              />

              {/* Now line */}
              <View style={[styles.nowLine, { top: (nowY / 100) * (TOTAL_HOURS * 60) }]}>
                <View style={[styles.nowDot, { backgroundColor: colors.danger }]} />
                <View style={[styles.nowLineBar, { backgroundColor: colors.danger }]} />
                <Text style={[styles.nowLabel, { color: colors.danger }]}>
                  {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>

              {/* Scheduled habits */}
              {scheduledHabits.map((habit) => {
            if (!habit.schedule) return null;
            const y = getYPosition(habit.schedule.time);
            const duration = habit.schedule.duration || 30; // Default 30 min
            const heightPixels = duration; // 1 pixel per minute
            const { isComplete, isSkipped, isFailed } = getHabitStatus(habit.id);
            const color = getIdentityColor(habit.identityId);

            // Determine checkbox appearance
            let checkboxBg = 'transparent';
            let checkboxBorder = colors.divider;
            let checkboxText = '';
            let checkboxTextColor = colors.muted;
            let pillBg = colors.card;
            let pillBorder = colors.divider;
            let textColor = colors.text;
            let timeColor = colors.muted;

            if (isComplete) {
              checkboxBg = colors.good;
              checkboxBorder = colors.good;
              checkboxText = '✓';
              checkboxTextColor = '#fff';
              pillBg = color;
              pillBorder = color;
              textColor = '#fff';
              timeColor = '#fff';
            } else if (isSkipped) {
              checkboxBg = colors.muted;
              checkboxBorder = colors.muted;
              checkboxText = '–';
              checkboxTextColor = '#fff';
            } else if (isFailed) {
              checkboxBg = colors.danger;
              checkboxBorder = colors.danger;
              checkboxText = '×';
              checkboxTextColor = '#fff';
            }

            // Check if it's a routine
            const isRoutine = habit.isRoutine === true && Array.isArray(habit.steps) && habit.steps.length > 0;
            const completedSteps = state.routineStepLogs[today]?.[habit.id] || [];
            const allStepsComplete = isRoutine && habit.steps && completedSteps.length === habit.steps.length;
            const isRoutineCollapsed = allStepsComplete && isComplete;

            return (
              <View
                key={habit.id}
                style={[
                  styles.eventPill,
                  {
                    top: (y / 100) * (TOTAL_HOURS * 60),
                    height: Math.max(heightPixels, 36), // Minimum height for readability
                    backgroundColor: pillBg,
                    borderColor: pillBorder,
                  },
                ]}
              >
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => openTimePicker(habit.id)}
                >
                  {/* Header row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                      style={[
                        styles.eventName,
                        { color: textColor },
                      ]}
                      numberOfLines={1}
                    >
                      {isRoutine ? `Routine: ${habit.name}` : habit.name}
                    </Text>
                    <Text
                      style={[
                        styles.eventTime,
                        { color: timeColor },
                      ]}
                    >
                      {habit.schedule.time} ({duration}m)
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.eventCheck,
                        {
                          backgroundColor: checkboxBg,
                          borderColor: checkboxBorder,
                        },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (isRoutine && habit.steps) {
                          // For routines, complete all steps when checked
                          const allStepsCompleted = allStepsComplete && isComplete;
                          if (!allStepsCompleted) {
                            // Complete all steps
                            habit.steps.forEach((step) => {
                              const stepAlreadyComplete = completedSteps.includes(step.id);
                              if (!stepAlreadyComplete) {
                                dispatch({
                                  type: 'TOGGLE_ROUTINE_STEP',
                                  payload: { habitId: habit.id, stepId: step.id, date: today },
                                });
                              }
                            });
                            // Mark the routine as complete
                            if (!isComplete) {
                              toggleHabit(habit.id);
                            }
                          } else {
                            // Uncomplete all steps
                            habit.steps.forEach((step) => {
                              const stepAlreadyComplete = completedSteps.includes(step.id);
                              if (stepAlreadyComplete) {
                                dispatch({
                                  type: 'TOGGLE_ROUTINE_STEP',
                                  payload: { habitId: habit.id, stepId: step.id, date: today },
                                });
                              }
                            });
                            // Unmark the routine
                            if (isComplete) {
                              toggleHabit(habit.id);
                            }
                          }
                        } else {
                          toggleHabit(habit.id);
                        }
                      }}
                    >
                      <Text style={{ color: checkboxTextColor, fontWeight: '900' }}>
                        {checkboxText}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Routine visual indicator */}
                  {isRoutine && habit.steps && (
                    <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{
                        flexDirection: 'row',
                        gap: 2,
                      }}>
                        {habit.steps.slice(0, Math.min(5, habit.steps.length)).map((step, idx) => (
                          <View
                            key={step.id}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: completedSteps.includes(step.id) ? colors.good : timeColor,
                              opacity: completedSteps.includes(step.id) ? 1 : 0.3,
                            }}
                          />
                        ))}
                      </View>
                      <Text style={{ fontSize: 10, color: timeColor, opacity: 0.7 }}>
                        {completedSteps.length}/{habit.steps.length} steps
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
            </View>
          </ScrollView>
        </View>

        {/* Unscheduled habits */}
        <View style={[styles.unscheduledPanel, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Text style={[styles.unscheduledTitle, { color: colors.text }]}>
            Assign Times
          </Text>
          <ScrollView style={styles.unscheduledList} showsVerticalScrollIndicator={false}>
            {unscheduledHabits.length === 0 ? (
              <EmptyState
                icon="✅"
                title="All habits scheduled!"
                compact
              />
            ) : (
              unscheduledHabits.map((habit) => {
                const { isComplete, isSkipped, isFailed } = getHabitStatus(habit.id);

                // Determine checkbox appearance
                let checkboxBg = 'transparent';
                let checkboxBorder = colors.divider;
                let checkboxText = '';
                let checkboxTextColor = colors.muted;

                if (isComplete) {
                  checkboxBg = colors.good;
                  checkboxBorder = colors.good;
                  checkboxText = '✓';
                  checkboxTextColor = '#fff';
                } else if (isSkipped) {
                  checkboxBg = colors.muted;
                  checkboxBorder = colors.muted;
                  checkboxText = '–';
                  checkboxTextColor = '#fff';
                } else if (isFailed) {
                  checkboxBg = colors.danger;
                  checkboxBorder = colors.danger;
                  checkboxText = '×';
                  checkboxTextColor = '#fff';
                }

                return (
                  <View key={habit.id}>
                    <TouchableOpacity
                      style={[styles.unscheduledItem, { borderColor: colors.divider }]}
                      onPress={() => openQuickSchedule(habit.id)}
                    >
                      <View style={[styles.unscheduledDot, { backgroundColor: getIdentityColor(habit.identityId) }]} />
                      <Text style={[styles.unscheduledName, { color: colors.text }]} numberOfLines={1}>
                        {habit.name}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.unscheduledCheck,
                          {
                            backgroundColor: checkboxBg,
                            borderColor: checkboxBorder,
                          },
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleHabit(habit.id);
                        }}
                      >
                        <Text style={{ color: checkboxTextColor, fontWeight: '900' }}>
                          {checkboxText}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>

      {/* Schedule Editor Modal */}
      <Modal
        visible={timeModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule Habit</Text>

            {/* Time Input */}
            <Text style={[styles.modalLabel, { color: colors.text }]}>Time</Text>
            <TextInput
              style={[styles.timeInput, { backgroundColor: colors.bg, borderColor: colors.divider, color: colors.text }]}
              value={timeInput}
              onChangeText={setTimeInput}
              placeholder="HH:MM (e.g., 09:00)"
              placeholderTextColor={colors.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />

            {/* Duration Input */}
            <Text style={[styles.modalLabel, { color: colors.text }]}>Duration (minutes)</Text>
            <TextInput
              style={[styles.timeInput, { backgroundColor: colors.bg, borderColor: colors.divider, color: colors.text }]}
              value={durationInput}
              onChangeText={setDurationInput}
              placeholder="30"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
            />

            {/* Recurrence Options */}
            <Text style={[styles.modalLabel, { color: colors.text }]}>Repeat</Text>
            <View style={styles.recurrenceButtons}>
              <TouchableOpacity
                style={[
                  styles.recurrenceButton,
                  { borderColor: colors.divider },
                  recurringInput === 'once' && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
                onPress={() => setRecurringInput('once')}
              >
                <Text style={[
                  styles.recurrenceButtonText,
                  { color: recurringInput === 'once' ? '#fff' : colors.text },
                ]}>
                  Once
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recurrenceButton,
                  { borderColor: colors.divider },
                  recurringInput === 'daily' && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
                onPress={() => setRecurringInput('daily')}
              >
                <Text style={[
                  styles.recurrenceButtonText,
                  { color: recurringInput === 'daily' ? '#fff' : colors.text },
                ]}>
                  Daily
                </Text>
              </TouchableOpacity>
            </View>

            {/* Day of Week Toggles (only show for Daily) */}
            {recurringInput === 'daily' && (
              <>
                <Text style={[styles.modalLabel, { color: colors.text }]}>Days</Text>
                <View style={styles.dayToggles}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayToggle,
                        { borderColor: colors.divider },
                        recurringDays[index] && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                      onPress={() => {
                        const newDays = [...recurringDays];
                        newDays[index] = !newDays[index];
                        setRecurringDays(newDays);
                      }}
                    >
                      <Text style={[
                        styles.dayToggleText,
                        { color: recurringDays[index] ? '#fff' : colors.text },
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.divider }]}
                onPress={clearTime}
              >
                <Text style={[styles.modalButtonText, { color: colors.danger }]}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.divider }]}
                onPress={() => setTimeModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent, borderColor: colors.accent }]}
                onPress={saveTime}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Schedule Modal */}
      <Modal
        visible={quickScheduleVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setQuickScheduleVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.pickerModal, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule Habit</Text>

            <View style={styles.pickerContainer}>
              {/* Time Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.muted }]}>Time</Text>
                <View style={[styles.pickerWrapper, { borderColor: colors.divider }]}>
                  <View style={[styles.pickerHighlight, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]} />
                  <ScrollView
                    ref={timeScrollRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={40}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.y / 40);
                      const option = timeOptions[index];
                      if (option) {
                        setSelectedHour(option.hour);
                        setSelectedMinute(option.minute);
                      }
                    }}
                  >
                    {/* Top padding */}
                    <View style={{ height: 80 }} />

                    {timeOptions.map((option, index) => {
                      const isSelected = option.hour === selectedHour && option.minute === selectedMinute;
                      return (
                        <TouchableOpacity
                          key={`${option.hour}-${option.minute}`}
                          style={styles.pickerItem}
                          onPress={() => {
                            setSelectedHour(option.hour);
                            setSelectedMinute(option.minute);
                            timeScrollRef.current?.scrollTo({ y: index * 40, animated: true });
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              { color: isSelected ? colors.accent : colors.text },
                              isSelected && styles.pickerItemTextSelected,
                            ]}
                          >
                            {option.display}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Bottom padding */}
                    <View style={{ height: 80 }} />
                  </ScrollView>
                </View>
              </View>

              {/* Duration Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.muted }]}>Duration</Text>
                <View style={[styles.pickerWrapper, { borderColor: colors.divider }]}>
                  <View style={[styles.pickerHighlight, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]} />
                  <ScrollView
                    ref={durationScrollRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={40}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.y / 40);
                      const duration = durationOptions[index];
                      if (duration) {
                        setSelectedDuration(duration);
                      }
                    }}
                  >
                    {/* Top padding */}
                    <View style={{ height: 80 }} />

                    {durationOptions.map((duration, index) => {
                      const isSelected = duration === selectedDuration;
                      const hours = Math.floor(duration / 60);
                      const mins = duration % 60;
                      let display = '';
                      if (hours > 0 && mins > 0) {
                        display = `${hours}h ${mins}m`;
                      } else if (hours > 0) {
                        display = `${hours} hour${hours > 1 ? 's' : ''}`;
                      } else {
                        display = `${mins} min`;
                      }

                      return (
                        <TouchableOpacity
                          key={duration}
                          style={styles.pickerItem}
                          onPress={() => {
                            setSelectedDuration(duration);
                            durationScrollRef.current?.scrollTo({ y: index * 40, animated: true });
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              { color: isSelected ? colors.accent : colors.text },
                              isSelected && styles.pickerItemTextSelected,
                            ]}
                          >
                            {display}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Bottom padding */}
                    <View style={{ height: 80 }} />
                  </ScrollView>
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.divider }]}
                onPress={() => setQuickScheduleVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent, borderColor: colors.accent }]}
                onPress={confirmSchedule}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  timelineContainer: {
    flex: 2,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  timelineScroll: {
    flex: 1,
  },
  timeline: {
    position: 'relative',
    height: TOTAL_HOURS * 60, // 60 pixels per hour
  },
  hourMarker: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourLabel: {
    width: 45,
    fontSize: 10,
    textAlign: 'right',
    paddingRight: 6,
  },
  hourLine: {
    flex: 1,
    height: 1,
  },
  pastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  nowLine: {
    position: 'absolute',
    left: 45,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
  nowLineBar: {
    flex: 1,
    height: 2,
  },
  nowLabel: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  eventPill: {
    position: 'absolute',
    left: 50,
    right: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 5,
  },
  eventName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 11,
  },
  eventCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unscheduledPanel: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  unscheduledTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  unscheduledList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  unscheduledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  unscheduledDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unscheduledName: {
    flex: 1,
    fontSize: 13,
  },
  unscheduledCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  recurrenceButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  recurrenceButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  recurrenceButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayToggles: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  dayToggle: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerModal: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 16,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerWrapper: {
    height: 200,
    borderWidth: 1,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  pickerHighlight: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 40,
    marginTop: -20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 1,
    pointerEvents: 'none',
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 16,
  },
  pickerItemTextSelected: {
    fontWeight: '700',
    fontSize: 18,
  },
  miniStepCheckbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStepCheckmark: {
    fontSize: 9,
    fontWeight: '900',
  },
});

// ============================================
// CALENDAR SCREEN
// ============================================
// Monthly calendar view showing habit completion
// density for each day. Tap a day to see details.
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme';
import { useApp } from '../state';
import { NoteModal } from '../components';
import {
  startOfMonth,
  endOfMonth,
  dateStr,
  getMonthCells,
  sortByOrder,
  isToday,
} from '../utils';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarScreen() {
  const { colors } = useTheme();
  const { state, dispatch } = useApp();

  // Track which month we're viewing
  const [viewingMonth, setViewingMonth] = useState(new Date());

  // Track selected day (to show details)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Note modal state
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteHabitId, setNoteHabitId] = useState<string | null>(null);
  const [noteDate, setNoteDate] = useState<string | null>(null);

  // Journal view toggle
  const [showJournal, setShowJournal] = useState(false);

  // Get month cells
  const monthCells = getMonthCells(viewingMonth);

  // Filter habits by identity
  const habits =
    state.currentIdentityFilter === 'all'
      ? state.habits
      : state.habits.filter((h) => h.identityId === state.currentIdentityFilter);

  // Navigate months
  const prevMonth = () => {
    const newDate = new Date(viewingMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewingMonth(newDate);
    setSelectedDay(null);
    setShowJournal(false);
  };

  const nextMonth = () => {
    const newDate = new Date(viewingMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewingMonth(newDate);
    setSelectedDay(null);
    setShowJournal(false);
  };

  const goToToday = () => {
    setViewingMonth(new Date());
    setSelectedDay(new Date());
    setShowJournal(false);
  };

  const toggleJournal = () => {
    setShowJournal(!showJournal);
    if (!showJournal) {
      // When opening journal, clear selected day
      setSelectedDay(null);
    }
  };

  // Calculate completion percentage for a day
  const getDayCompletion = (date: Date) => {
    const ds = dateStr(date);
    const dayLogs = state.logs[ds] || [];
    
    if (habits.length === 0) return 0;
    
    const completed = habits.filter((h) => dayLogs.includes(h.id)).length;
    return completed / habits.length;
  };

  // Get habits completed on selected day
  const getSelectedDayDetails = () => {
    if (!selectedDay) return { completed: [], remaining: [] };
    
    const ds = dateStr(selectedDay);
    const dayLogs = state.logs[ds] || [];
    
    const completed = sortByOrder(habits.filter((h) => dayLogs.includes(h.id)));
    const remaining = sortByOrder(habits.filter((h) => !dayLogs.includes(h.id)));
    
    return { completed, remaining };
  };

  const { completed, remaining } = getSelectedDayDetails();

  // Get all notes for the viewing month
  const getMonthNotes = () => {
    const monthStart = startOfMonth(viewingMonth);
    const monthEnd = endOfMonth(viewingMonth);
    const notesForMonth: Array<{ date: Date; habitName: string; note: string }> = [];

    Object.entries(state.notes).forEach(([dateString, dayNotes]) => {
      const date = new Date(dateString + 'T00:00:00');
      if (date >= monthStart && date <= monthEnd) {
        Object.entries(dayNotes).forEach(([habitId, note]) => {
          const habit = state.habits.find(h => h.id === habitId);
          if (habit && note) {
            notesForMonth.push({ date, habitName: habit.name, note });
          }
        });
      }
    });

    // Sort by date descending (newest first)
    return notesForMonth.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const monthNotes = getMonthNotes();

  // Handle note press
  const handleNotePress = (habitId: string, date: string) => {
    setNoteHabitId(habitId);
    setNoteDate(date);
    setNoteModalVisible(true);
  };

  // Save note
  const handleSaveNote = (note: string) => {
    if (noteHabitId && noteDate && note.trim()) {
      dispatch({
        type: 'SET_NOTE',
        payload: { habitId: noteHabitId, date: noteDate, note: note.trim() },
      });
    }
  };

  // Delete note
  const handleDeleteNote = () => {
    if (noteHabitId && noteDate) {
      dispatch({
        type: 'DELETE_NOTE',
        payload: { habitId: noteHabitId, date: noteDate },
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={toggleJournal}
              style={[
                styles.journalButton,
                {
                  borderColor: showJournal ? colors.accent : colors.divider,
                  backgroundColor: showJournal ? colors.accent + '20' : 'transparent',
                }
              ]}
            >
              <Text style={[styles.journalButtonText, { color: showJournal ? colors.accent : colors.text }]}>
                📓 Journal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToToday}>
              <Text style={[styles.todayLink, { color: colors.accent }]}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
          <Text style={[styles.navButtonText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {viewingMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <Text style={[styles.navButtonText, { color: colors.text }]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Day Labels */}
      <View style={styles.dayLabelsRow}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={styles.dayLabelCell}>
            <Text style={[styles.dayLabelText, { color: colors.muted }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {monthCells.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const completion = getDayCompletion(date);
          const isSelected = selectedDay && dateStr(date) === dateStr(selectedDay);
          const isTodayDate = isToday(date);

          // Color based on completion and selection
          let cellBg = 'transparent';
          if (isSelected) {
            // Selected day gets accent color with higher opacity
            cellBg = colors.accent + '40';
          } else if (completion > 0) {
            const opacity = Math.max(0.2, completion);
            cellBg = colors.accent + Math.round(opacity * 255).toString(16).padStart(2, '0');
          }

          return (
            <TouchableOpacity
              key={dateStr(date)}
              style={[
                styles.dayCell,
                { backgroundColor: cellBg },
              ]}
              onPress={() => {
                setSelectedDay(date);
                setShowJournal(false);
              }}
            >
              <View style={styles.dayContent}>
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: isSelected || completion > 0.5 ? '#fff' : colors.text,
                    },
                    isTodayDate && { fontWeight: '900' },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Journal View */}
      {showJournal ? (
        <View style={[styles.journalPanel, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <ScrollView>
            <View style={styles.journalHeader}>
              <Text style={[styles.journalTitle, { color: colors.text }]}>
                Journal for {viewingMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Text>
              {monthNotes.length > 0 && (
                <Text style={[styles.journalCount, { color: colors.muted }]}>
                  {monthNotes.length} {monthNotes.length === 1 ? 'note' : 'notes'}
                </Text>
              )}
            </View>

            {monthNotes.length === 0 ? (
              <View>
                <Text style={[styles.journalEmpty, { color: colors.muted }]}>
                  No notes for this month
                </Text>
                <Text style={[styles.journalHint, { color: colors.muted }]}>
                  Add notes by completing habits on the Today screen!
                </Text>
              </View>
            ) : (
              monthNotes.map((entry, index) => (
                <View
                  key={`${dateStr(entry.date)}-${entry.habitName}-${index}`}
                  style={[styles.journalEntry, { borderBottomColor: colors.divider }]}
                >
                  <View style={styles.journalEntryHeader}>
                    <Text style={[styles.journalDate, { color: colors.muted }]}>
                      {entry.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={[styles.journalHabit, { color: colors.accent }]}>
                      {entry.habitName}
                    </Text>
                  </View>
                  <Text style={[styles.journalNote, { color: colors.text }]}>
                    {entry.note}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      ) : null}

      {/* Selected Day Details */}
      {selectedDay && !showJournal ? (
        <View style={[styles.detailsPanel, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <ScrollView>
            <Text style={[styles.detailsTitle, { color: colors.text }]}>
              {selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          
          {habits.length === 0 ? (
            <Text style={[styles.detailsEmpty, { color: colors.muted }]}>
              No habits tracked
            </Text>
          ) : (
            <>
              {/* Completed */}
              {completed.length > 0 && (
                <View style={styles.detailsSection}>
                  <Text style={[styles.detailsSectionTitle, { color: colors.good }]}>
                    ✓ Completed ({completed.length})
                  </Text>
                  {completed.map((habit) => {
                    const ds = dateStr(selectedDay);
                    const note = state.notes[ds]?.[habit.id];
                    return (
                      <View key={habit.id} style={styles.habitWithNote}>
                        <TouchableOpacity onPress={() => handleNotePress(habit.id, ds)}>
                          <Text style={[styles.detailsHabit, { color: colors.text }]}>
                            {habit.name}
                            {note && ' 📝'}
                          </Text>
                        </TouchableOpacity>
                        {note && (
                          <TouchableOpacity onPress={() => handleNotePress(habit.id, ds)}>
                            <Text style={[styles.noteText, { color: colors.muted }]}>
                              "{note}"
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Remaining */}
              {remaining.length > 0 && (
                <View style={styles.detailsSection}>
                  <Text style={[styles.detailsSectionTitle, { color: colors.muted }]}>
                    ○ Not done ({remaining.length})
                  </Text>
                  {remaining.map((habit) => (
                    <Text key={habit.id} style={[styles.detailsHabit, { color: colors.muted }]}>
                      {habit.name}
                    </Text>
                  ))}
                </View>
              )}

              {/* Summary */}
              <View style={[styles.summaryRow, { borderTopColor: colors.divider }]}>
                <Text style={[styles.summaryText, { color: colors.text }]}>
                  {completed.length}/{habits.length} completed ({Math.round(getDayCompletion(selectedDay) * 100)}%)
                </Text>
              </View>
            </>
          )}
          </ScrollView>
        </View>
      ) : null}

      {/* Note Modal */}
      <NoteModal
        visible={noteModalVisible}
        habitName={
          noteHabitId
            ? state.habits.find(h => h.id === noteHabitId)?.name || ''
            : ''
        }
        existingNote={
          noteHabitId && noteDate && state.notes[noteDate]?.[noteHabitId]
            ? state.notes[noteDate][noteHabitId]
            : ''
        }
        onSave={handleSaveNote}
        onDelete={
          noteHabitId && noteDate && state.notes[noteDate]?.[noteHabitId]
            ? handleDeleteNote
            : undefined
        }
        onClose={() => setNoteModalVisible(false)}
      />
      </ScrollView>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  journalButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  journalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  todayLink: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 8,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayNumber: {
    fontSize: 18,
  },
  completionDot: {
    fontSize: 14,
    color: '#fff',
  },
  detailsPanel: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    height: 300,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailsEmpty: {
    fontSize: 14,
  },
  detailsSection: {
    marginBottom: 12,
  },
  detailsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsHabit: {
    fontSize: 14,
    paddingVertical: 2,
    paddingLeft: 8,
  },
  habitWithNote: {
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    paddingLeft: 16,
    paddingTop: 2,
    fontStyle: 'italic',
  },
  summaryRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  journalPanel: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    height: 300,
  },
  journalHeader: {
    marginBottom: 12,
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  journalCount: {
    fontSize: 12,
  },
  journalEmpty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  journalHint: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingTop: 8,
  },
  journalEntry: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  journalEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  journalDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  journalHabit: {
    fontSize: 12,
    fontWeight: '700',
  },
  journalNote: {
    fontSize: 14,
    lineHeight: 20,
  },
});

// ============================================
// ROUTINE RUNNER
// ============================================
// "Start routine": walks a routine's steps one at a time with a timer
// (counting down when the step has a duration, up when it doesn't), ticks
// each step as you go through the same TOGGLE_ROUTINE_STEP path as the
// checklist, and ends on a small completion screen.
// ============================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme';
import { Habit, RoutineStep, PetSpecies, HatType } from '../types';
import { Pet } from './Pet';
import { lightTap, successTap } from '../utils/haptics';
import { playSound } from '../utils/sounds';
import { petDisplayName } from '../utils/petName';

interface Props {
  visible: boolean;
  habit: Habit | null;
  completedStepIds: string[];
  onToggleStep: (stepId: string) => void;
  onClose: () => void;
  species: PetSpecies;
  hat: HatType;
  stage: number;
  petName?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (s: number) => `${pad(Math.floor(Math.abs(s) / 60))}:${pad(Math.abs(s) % 60)}`;

export function RoutineRunnerModal({ visible, habit, completedStepIds, onToggleStep, onClose, species, hat, stage, petName }: Props) {
  const { colors } = useTheme();
  const steps = useMemo<RoutineStep[]>(() => [...(habit?.steps ?? [])].sort((a, b) => a.order - b.order), [habit]);
  const remaining = steps.filter((s) => !completedStepIds.includes(s.id));
  const current = remaining[0] ?? null;
  const total = steps.length;
  const doneCount = total - remaining.length;

  // ---- timer ----
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const currentId = current?.id ?? null;

  useEffect(() => {
    setElapsed(0);
    setTimeUp(false);
    setPaused(false);
  }, [currentId, visible]);

  useEffect(() => {
    if (!visible || !current || paused) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [visible, currentId, paused]);

  const targetSeconds = current?.duration ? current.duration * 60 : null;
  const secondsLeft = targetSeconds !== null ? targetSeconds - elapsed : null;

  useEffect(() => {
    if (secondsLeft !== null && secondsLeft <= 0 && !timeUp) {
      setTimeUp(true);
      successTap();
      playSound('pop');
    }
  }, [secondsLeft, timeUp]);

  // ---- progress ring (plain Animated width bar; keeps it simple) ----
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: total ? doneCount / total : 0, duration: 300, useNativeDriver: false }).start();
  }, [doneCount, total]);
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const finishStep = () => {
    if (!current) return;
    lightTap();
    onToggleStep(current.id);
  };

  if (!habit) return null;
  const allDone = total > 0 && remaining.length === 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: colors.muted }]}>ROUTINE</Text>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {habit.name}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close routine" style={[styles.close, { borderColor: colors.divider }]}>
            <Text style={{ color: colors.muted, fontSize: 18, lineHeight: 20 }}>×</Text>
          </Pressable>
        </View>

        {/* Progress */}
        <View style={[styles.track, { backgroundColor: colors.divider }]}>
          <Animated.View style={[styles.fill, { backgroundColor: colors.accent, width: barWidth }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.muted }]}>
          {allDone ? 'All steps done' : `Step ${doneCount + 1} of ${total}`}
        </Text>

        {allDone ? (
          <View style={styles.center}>
            <Pet species={species} mood="celebrate" hat={hat} size={140} stage={stage} />
            <Text style={[styles.doneTitle, { color: colors.text }]}>Routine complete</Text>
            <Text style={[styles.doneBody, { color: colors.muted }]}>
              {`${petDisplayName(petName, 'Your pet')} watched the whole thing. Very impressed.`}
            </Text>
            <Pressable style={[styles.primary, { backgroundColor: colors.accent }]} onPress={onClose}>
              <Text style={[styles.primaryText, { color: colors.textOnAccent }]}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={[styles.stepName, { color: colors.text }]}>{current!.name}</Text>
            <Text
              style={[
                styles.timer,
                { color: timeUp ? colors.good : colors.text, fontVariant: ['tabular-nums'] },
              ]}
            >
              {secondsLeft !== null ? (secondsLeft >= 0 ? fmt(secondsLeft) : `+${fmt(secondsLeft)}`) : fmt(elapsed)}
            </Text>
            <Text style={[styles.timerLabel, { color: colors.muted }]}>
              {secondsLeft === null ? 'elapsed' : timeUp ? 'time — take it or keep going' : `${current!.duration} min`}
            </Text>

            {/* Up next */}
            {remaining[1] && (
              <Text style={[styles.upNext, { color: colors.muted }]}>Up next: {remaining[1].name}</Text>
            )}

            <View style={styles.controls}>
              <Pressable
                onPress={() => setPaused((p) => !p)}
                style={[styles.secondary, { borderColor: colors.divider, backgroundColor: colors.card }]}
                accessibilityLabel={paused ? 'Resume timer' : 'Pause timer'}
              >
                <Text style={[styles.secondaryText, { color: colors.text }]}>{paused ? 'Resume' : 'Pause'}</Text>
              </Pressable>
              <Pressable style={[styles.primary, { backgroundColor: timeUp ? colors.good : colors.accent, flex: 1 }]} onPress={finishStep}>
                <Text style={[styles.primaryText, { color: colors.textOnAccent }]}>
                  {remaining.length === 1 ? 'Finish routine' : 'Done, next step'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step list */}
        <View style={styles.list}>
          {steps.map((s) => {
            const done = completedStepIds.includes(s.id);
            const isCurrent = current?.id === s.id;
            return (
              <Pressable key={s.id} onPress={() => onToggleStep(s.id)} style={styles.row} accessibilityLabel={`${done ? 'Undo' : 'Mark'} ${s.name}`}>
                <View style={[styles.dot, { borderColor: done ? colors.good : isCurrent ? colors.accent : colors.divider, backgroundColor: done ? colors.good : 'transparent' }]} />
                <Text style={[styles.rowText, { color: done ? colors.muted : colors.text, fontWeight: isCurrent ? '700' : '500', textDecorationLine: done ? 'line-through' : 'none' }]} numberOfLines={1}>
                  {s.name}
                </Text>
                {s.duration ? <Text style={[styles.rowMeta, { color: colors.muted }]}>{s.duration}m</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 64, paddingHorizontal: 24, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 24, fontWeight: '800' },
  close: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, marginTop: 18, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 13, marginTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  stepName: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  timer: { fontSize: 72, fontWeight: '800', letterSpacing: -2, marginTop: 8 },
  timerLabel: { fontSize: 14 },
  upNext: { fontSize: 14, marginTop: 14 },
  controls: { flexDirection: 'row', gap: 10, marginTop: 26, alignSelf: 'stretch' },
  primary: { paddingVertical: 16, paddingHorizontal: 22, borderRadius: 16, alignItems: 'center' },
  primaryText: { fontSize: 17, fontWeight: '800' },
  secondary: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1 },
  secondaryText: { fontSize: 16, fontWeight: '700' },
  doneTitle: { fontSize: 26, fontWeight: '800', marginTop: 10 },
  doneBody: { fontSize: 15, textAlign: 'center', marginBottom: 18 },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  rowText: { flex: 1, fontSize: 15 },
  rowMeta: { fontSize: 12 },
});

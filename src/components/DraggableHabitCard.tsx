// ============================================
// DRAGGABLE HABIT CARD
// ============================================
// Wraps SwipeableHabitCard with long-press drag
// functionality for reordering habits
// ============================================

import React, { useRef } from 'react';
import { Animated, StyleSheet, View, PanResponder } from 'react-native';
import { SwipeableHabitCard } from './SwipeableHabitCard';
import { Habit, Identity } from '../types';

interface DraggableHabitCardProps {
  habit: Habit;
  identity: Identity;
  logs: Record<string, string[]>;
  marks: Record<string, { skip: string[]; fail: string[] }>;
  today: string;
  index: number;
  onToggle: () => void;
  onPress: () => void;
  onNotePress?: () => void;
  hasNote?: boolean;
  isComplete: boolean;
  isSkipped: boolean;
  isDragging: boolean;
  onDragStart: (index: number) => void;
  onDragMove: (y: number) => void;
  onDragEnd: () => void;
}

export function DraggableHabitCard({
  habit,
  identity,
  logs,
  marks,
  today,
  index,
  onToggle,
  onPress,
  onNotePress,
  hasNote = false,
  isComplete,
  isSkipped,
  isDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DraggableHabitCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const startY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture if we're dragging or if there's significant vertical movement
        return isDraggingRef.current || Math.abs(gestureState.dy) > 10;
      },
      onMoveShouldSetPanResponderCapture: () => isDraggingRef.current,

      onPanResponderGrant: (evt) => {
        startY.current = evt.nativeEvent.pageY;

        // Start long-press timer
        longPressTimer.current = setTimeout(() => {
          isDraggingRef.current = true;
          onDragStart(index);

          // Visual feedback - scale up immediately
          Animated.spring(scale, {
            toValue: 1.05,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
          }).start();
        }, 300); // Reduced to 300ms for faster response
      },

      onPanResponderMove: (_, gestureState) => {
        // Cancel long-press if user moves too much before timer
        if (!isDraggingRef.current && Math.abs(gestureState.dx) > 10) {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          return;
        }

        if (isDraggingRef.current) {
          pan.setValue({ x: 0, y: gestureState.dy });
          onDragMove(startY.current + gestureState.dy);
        }
      },

      onPanResponderRelease: () => {
        // Clear long-press timer if still waiting
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        if (isDraggingRef.current) {
          isDraggingRef.current = false;

          // Animate back to normal
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();

          onDragEnd();
        }
      },

      onPanResponderTerminate: () => {
        // Clear timer on cancel
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        if (isDraggingRef.current) {
          isDraggingRef.current = false;

          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();

          onDragEnd();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: [
            { translateY: isDragging ? pan.y : 0 },
            { scale },
          ],
          zIndex: isDragging ? 1000 : 1,
          opacity: isDragging ? 0.9 : 1,
        },
      ]}
    >
      <SwipeableHabitCard
        habit={habit}
        identity={identity}
        logs={logs}
        marks={marks}
        today={today}
        index={index}
        onToggle={onToggle}
        onPress={onPress}
        onNotePress={onNotePress}
        hasNote={hasNote}
        isComplete={isComplete}
        isSkipped={isSkipped}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

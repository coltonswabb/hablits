// ============================================
// SWIPEABLE HABIT CARD WRAPPER
// ============================================
// Adds swipe gestures:
// - Right swipe: Complete/toggle
// - Left swipe: Skip
// ============================================

import React, { useRef, useEffect } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { HabitCard } from './HabitCard';
import { Habit, Identity } from '../types';
import { useReduceMotion } from '../utils/motion';
import { SCREEN_WIDTH, SWIPE_THRESHOLD, swipeDirection } from '../utils/swipe';
import { useTheme } from '../theme';
import { radii, fontSizes } from '../theme/tokens';

const SWIPE_AWAY_MIN_MS = 120;
const SWIPE_AWAY_MAX_MS = 250;

interface SwipeableHabitCardProps {
  habit: Habit;
  identity: Identity;
  logs: Record<string, string[]>;
  marks: Record<string, { skip: string[]; fail: string[] }>;
  today: string;
  index?: number;
  onToggle: () => void;
  onPress: () => void;
  onNotePress?: () => void;
  hasNote?: boolean;
  isComplete: boolean;
  isSkipped: boolean;
  progressAmount?: number;
  onAddProgress?: (delta: number) => void;
  /** Called with true while a finger is swiping this card, false when it lets go */
  onSwipeActiveChange?: (active: boolean) => void;
}

export function SwipeableHabitCard({
  habit,
  identity,
  logs,
  marks,
  today,
  index = 0,
  onToggle,
  onPress,
  onNotePress,
  hasNote = false,
  isComplete,
  isSkipped,
  progressAmount,
  onAddProgress,
  onSwipeActiveChange,
}: SwipeableHabitCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const reduceMotion = useReduceMotion();
  const { radius } = useTheme();

  // The reveal layers fade in with the swipe distance. Derived on the native
  // side, so nothing has to listen to translateX on the JS thread.
  const rightRevealOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const leftRevealOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Ensure card always returns to center on mount
  useEffect(() => {
    translateX.setValue(0);
  }, []);

  // Settle back to centre with no overshoot
  const snapBack = (onDone?: () => void) => {
    isAnimating.current = true;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      // Critically damped: settles in about a quarter of a second
      stiffness: 300,
      damping: 35,
      mass: 1,
      overshootClamping: true,
    }).start(() => {
      translateX.setValue(0);
      isAnimating.current = false;
      onDone?.();
    });
  };

  // Carry the card off screen at the speed it was released, then toggle and reset
  const swipeAway = (direction: 1 | -1, swipeDistance: number, velocityX: number) => {
    if (reduceMotion) {
      // No fly-off: commit straight away and let the card settle back
      onToggle(); // Right: complete. Left: cycles to skip.
      snapBack();
      return;
    }
    isAnimating.current = true;
    const remaining = Math.max(0, SCREEN_WIDTH - Math.abs(swipeDistance));
    const speed = Math.abs(velocityX); // points per second
    const duration = speed > 0 ? (remaining / speed) * 1000 : SWIPE_AWAY_MAX_MS;
    Animated.timing(translateX, {
      toValue: direction * SCREEN_WIDTH,
      duration: Math.min(SWIPE_AWAY_MAX_MS, Math.max(SWIPE_AWAY_MIN_MS, duration)),
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      onToggle(); // Right: complete. Left: cycles to skip.
      translateX.setValue(0);
      isAnimating.current = false;
    });
  };

  // Created once: a new Animated.event every render would re-bind the gesture
  const onPanUpdate = useRef(
    Animated.event([{ nativeEvent: { handlerData: { translationX: translateX } } }], { useNativeDriver: true })
  ).current;

  const pan = usePanGesture({
    activeOffsetX: [-10, 10],
    failOffsetY: [-20, 20],
    // Drive translateX straight from the native event, as the old
    // PanGestureHandler + Animated.event did
    useAnimated: true,
    onUpdate: onPanUpdate,
    onActivate: () => onSwipeActiveChange?.(true),
    onFinalize: () => onSwipeActiveChange?.(false),
    onDeactivate: (event) => {
      // Prevent multiple animations
      if (isAnimating.current) return;

      const { translationX: swipeDistance, velocityX } = event;
      const direction = swipeDirection(swipeDistance, velocityX);

      if (direction === 1 && !isComplete) {
        swipeAway(1, swipeDistance, velocityX);
      } else if (direction === -1 && !isSkipped) {
        swipeAway(-1, swipeDistance, velocityX);
      } else {
        snapBack();
      }
    },
  });

  return (
    <View style={styles.container}>
      {/* Right reveal layer - Complete */}
      <Animated.View
        style={[
          styles.revealLayerRight,
          { opacity: rightRevealOpacity, borderRadius: radius.md },
        ]}
      >
        <Animated.Text style={styles.revealText}>✓</Animated.Text>
      </Animated.View>

      {/* Left reveal layer - Skip */}
      <Animated.View
        style={[
          styles.revealLayerLeft,
          { opacity: leftRevealOpacity, borderRadius: radius.md },
        ]}
      >
        <Animated.Text style={styles.revealText}>–</Animated.Text>
      </Animated.View>

      {/* Card with gesture handler */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={{
            transform: [{ translateX }],
          }}
        >
          <HabitCard
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
            progressAmount={progressAmount}
            onAddProgress={onAddProgress}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  revealLayerRight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 10, // Account for marginBottom in HabitCard
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 20,
    backgroundColor: '#22c55e',
    borderRadius: radii.md,
    zIndex: -1,
  },
  revealLayerLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 20,
    backgroundColor: '#f59e0b',
    borderRadius: radii.md,
    zIndex: -1,
  },
  revealText: {
    fontSize: fontSizes.hero,
    fontWeight: '900',
    color: '#fff',
  },
});

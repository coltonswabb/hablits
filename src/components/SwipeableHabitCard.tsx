// ============================================
// SWIPEABLE HABIT CARD WRAPPER
// ============================================
// Adds swipe gestures:
// - Right swipe: Complete/toggle
// - Left swipe: Skip
// ============================================

import React, { useRef, useEffect } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { HabitCard } from './HabitCard';
import { Habit, Identity } from '../types';
import { useReduceMotion } from '../utils/motion';
import { selectionTap } from '../utils/haptics';
import { swipeDirection, swipeThreshold } from '../utils/swipe';
import { useTheme } from '../theme';
import { radii, fontSizes } from '../theme/tokens';

// Before the swipe counts, the colour behind the card is faint and its icon small
const FAINT_REVEAL = 0.45;
const UNARMED_ICON_SCALE = 0.7;
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
  /**
   * What a swipe does: 1 = swiped right (complete), -1 = swiped left (skip).
   * Left out, a swipe just calls onToggle, which cycles the state like a tap.
   */
  onSwipe?: (direction: 1 | -1) => void;
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
  onSwipe,
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
  const { width: screenWidth } = useWindowDimensions();
  const threshold = swipeThreshold(screenWidth);
  // The gesture and the haptic listener are set up once, so they read these through a ref
  const layout = useRef({ screenWidth, threshold });
  layout.current = { screenWidth, threshold };

  // The reveal layers show how close the swipe is to counting. They stay
  // faint until the card crosses the line, then go solid and the icon pops, so
  // you can tell when letting go will count. All derived on the native side.
  const rightRevealOpacity = translateX.interpolate({
    inputRange: [0, threshold - 1, threshold],
    outputRange: [0, FAINT_REVEAL, 1],
    extrapolate: 'clamp',
  });
  const leftRevealOpacity = translateX.interpolate({
    inputRange: [-threshold, -threshold + 1, 0],
    outputRange: [1, FAINT_REVEAL, 0],
    extrapolate: 'clamp',
  });
  const rightIconScale = translateX.interpolate({
    inputRange: [threshold - 1, threshold],
    outputRange: [UNARMED_ICON_SCALE, 1],
    extrapolate: 'clamp',
  });
  const leftIconScale = translateX.interpolate({
    inputRange: [-threshold, -threshold + 1],
    outputRange: [1, UNARMED_ICON_SCALE],
    extrapolate: 'clamp',
  });

  // One haptic tick each time a drag crosses the line, in either direction
  // Where the card has actually been dragged to, as last reported by the animated value
  const draggedTo = useRef(0);
  const isDragging = useRef(false);
  const wasArmed = useRef(false);
  useEffect(() => {
    const id = translateX.addListener(({ value }) => {
      if (!isDragging.current) return;
      draggedTo.current = value;
      const armed = Math.abs(value) >= layout.current.threshold;
      if (armed !== wasArmed.current) {
        wasArmed.current = armed;
        selectionTap();
      }
    });
    return () => translateX.removeListener(id);
  }, []);

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

  // The swipe counts the moment the finger lifts. The card then leaves at the
  // speed it was released and comes back in its new state.
  const swipeAway = (direction: 1 | -1, swipeDistance: number, velocityX: number) => {
    if (onSwipe) onSwipe(direction);
    else onToggle();
    if (reduceMotion) {
      // No fly-off: let the card settle back
      snapBack();
      return;
    }
    isAnimating.current = true;
    const width = layout.current.screenWidth;
    const remaining = Math.max(0, width - Math.abs(swipeDistance));
    const speed = Math.abs(velocityX); // points per second
    const duration = speed > 0 ? (remaining / speed) * 1000 : SWIPE_AWAY_MAX_MS;
    Animated.timing(translateX, {
      toValue: direction * width,
      duration: Math.min(SWIPE_AWAY_MAX_MS, Math.max(SWIPE_AWAY_MIN_MS, duration)),
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
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
    onActivate: () => {
      isDragging.current = true;
      wasArmed.current = false;
      draggedTo.current = 0;
      onSwipeActiveChange?.(true);
    },
    onFinalize: () => {
      isDragging.current = false;
      onSwipeActiveChange?.(false);
    },
    onDeactivate: (event) => {
      isDragging.current = false;
      // Prevent multiple animations
      if (isAnimating.current) return;

      // Trust whichever says the card went further: the gesture's own total, or
      // where the card was last drawn. On iOS the gesture's total can come back
      // short after a pause mid-drag, and then a swipe that looked far enough
      // would not count.
      const reported = Number.isFinite(event.translationX) ? event.translationX : 0;
      const swipeDistance = Math.abs(draggedTo.current) > Math.abs(reported) ? draggedTo.current : reported;
      const velocityX = Number.isFinite(event.velocityX) ? event.velocityX : 0;
      const direction = swipeDirection(swipeDistance, velocityX, layout.current.threshold);

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
        <Animated.Text style={[styles.revealText, { transform: [{ scale: rightIconScale }] }]}>✓</Animated.Text>
      </Animated.View>

      {/* Left reveal layer - Skip */}
      <Animated.View
        style={[
          styles.revealLayerLeft,
          { opacity: leftRevealOpacity, borderRadius: radius.md },
        ]}
      >
        <Animated.Text style={[styles.revealText, { transform: [{ scale: leftIconScale }] }]}>–</Animated.Text>
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

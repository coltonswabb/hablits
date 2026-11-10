// ============================================
// SWIPEABLE HABIT CARD WRAPPER
// ============================================
// Adds swipe gestures:
// - Right swipe: Complete/toggle
// - Left swipe: Skip
// ============================================

import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { HabitCard } from './HabitCard';
import { Habit, Identity } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.15; // 15% of screen width for easy triggering
const VELOCITY_THRESHOLD = 0.5; // Minimum velocity to auto-complete swipe

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
}: SwipeableHabitCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const isAnimating = useRef(false);

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
    cardScale.setValue(1);
  }, []);

  // Slide off to one side with a little bounce, then toggle and reset
  const swipeAway = (toValue: number) => {
    isAnimating.current = true;
    Animated.parallel([
      Animated.sequence([
        Animated.spring(cardScale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 200,
          friction: 3,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]),
      Animated.timing(translateX, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onToggle(); // Right: complete. Left: cycles to skip.
      translateX.setValue(0);
      isAnimating.current = false;
    });
  };

  // Snap back to original position with bounce - ALWAYS complete this animation
  const snapBack = () => {
    isAnimating.current = true;
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 150,
        friction: 10,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 10,
      }),
    ]).start(() => {
      // Ensure values are exactly centered
      translateX.setValue(0);
      cardScale.setValue(1);
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
    onDeactivate: (event) => {
      // Prevent multiple animations
      if (isAnimating.current) return;

      const { translationX: swipeDistance, velocityX } = event;

      // Determine if we should complete the swipe based on distance or velocity
      const shouldCompleteRight = (swipeDistance > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) && !isComplete;
      const shouldCompleteLeft = (swipeDistance < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) && !isSkipped;

      if (shouldCompleteRight) {
        swipeAway(SCREEN_WIDTH);
      } else if (shouldCompleteLeft) {
        swipeAway(-SCREEN_WIDTH);
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
          {
            opacity: rightRevealOpacity,
          },
        ]}
      >
        <Animated.Text style={styles.revealText}>✓</Animated.Text>
      </Animated.View>

      {/* Left reveal layer - Skip */}
      <Animated.View
        style={[
          styles.revealLayerLeft,
          {
            opacity: leftRevealOpacity,
          },
        ]}
      >
        <Animated.Text style={styles.revealText}>–</Animated.Text>
      </Animated.View>

      {/* Card with gesture handler */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={{
            transform: [{ translateX }, { scale: cardScale }],
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
    borderRadius: 10,
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
    borderRadius: 10,
    zIndex: -1,
  },
  revealText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
});

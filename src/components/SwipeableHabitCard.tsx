// ============================================
// SWIPEABLE HABIT CARD WRAPPER
// ============================================
// Adds swipe gestures:
// - Right swipe: Complete/toggle
// - Left swipe: Skip
// ============================================

import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
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
}: SwipeableHabitCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const rightRevealOpacity = useRef(new Animated.Value(0)).current;
  const leftRevealOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const isAnimating = useRef(false);

  // Ensure card always returns to center on mount
  useEffect(() => {
    translateX.setValue(0);
    cardScale.setValue(1);
    rightRevealOpacity.setValue(0);
    leftRevealOpacity.setValue(0);
  }, []);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX: swipeDistance, velocityX } = event.nativeEvent;

      // Prevent multiple animations
      if (isAnimating.current) return;

      // Determine if we should complete the swipe based on distance or velocity
      const shouldCompleteRight = (swipeDistance > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) && !isComplete;
      const shouldCompleteLeft = (swipeDistance < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) && !isSkipped;

      // Right swipe - Complete/toggle
      if (shouldCompleteRight) {
        isAnimating.current = true;
        // Bounce and slide animation
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
            toValue: SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onToggle();
          translateX.setValue(0);
          rightRevealOpacity.setValue(0);
          isAnimating.current = false;
        });
      }
      // Left swipe - Skip (cycle to skip if not already)
      else if (shouldCompleteLeft) {
        isAnimating.current = true;
        // Bounce and slide animation
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
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onToggle(); // Will cycle to skip
          translateX.setValue(0);
          leftRevealOpacity.setValue(0);
          isAnimating.current = false;
        });
      }
      // Snap back to original position with bounce - ALWAYS complete this animation
      else {
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
          Animated.timing(rightRevealOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(leftRevealOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Ensure values are exactly centered
          translateX.setValue(0);
          cardScale.setValue(1);
          rightRevealOpacity.setValue(0);
          leftRevealOpacity.setValue(0);
          isAnimating.current = false;
        });
      }
    }
  };

  // Update reveal opacity based on swipe distance
  translateX.addListener(({ value }) => {
    if (value > 0) {
      rightRevealOpacity.setValue(Math.min(value / SWIPE_THRESHOLD, 1));
      leftRevealOpacity.setValue(0);
    } else if (value < 0) {
      leftRevealOpacity.setValue(Math.min(Math.abs(value) / SWIPE_THRESHOLD, 1));
      rightRevealOpacity.setValue(0);
    } else {
      rightRevealOpacity.setValue(0);
      leftRevealOpacity.setValue(0);
    }
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
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-20, 20]}
      >
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
          />
        </Animated.View>
      </PanGestureHandler>
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

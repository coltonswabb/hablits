// ============================================
// SWIPE HINT COMPONENT
// ============================================
// Animated hints showing swipe gestures
// ============================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme';

interface SwipeHintProps {
  onDismiss: () => void;
}

export function SwipeHint({ onDismiss }: SwipeHintProps) {
  const { colors } = useTheme();
  const leftArrowX = useRef(new Animated.Value(0)).current;
  const rightArrowX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate arrows
    const leftAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(leftArrowX, {
          toValue: -15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(leftArrowX, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const rightAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rightArrowX, {
          toValue: 15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(rightArrowX, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    leftAnimation.start();
    rightAnimation.start();

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onDismiss();
      });
    }, 5000);

    return () => {
      clearTimeout(timer);
      leftAnimation.stop();
      rightAnimation.stop();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Left swipe hint (Skip) */}
      <Animated.View style={[styles.hint, styles.leftHint, { transform: [{ translateX: leftArrowX }] }]}>
        <Text style={styles.arrow}>←</Text>
        <Text style={[styles.label, { color: colors.text }]}>Swipe to skip</Text>
      </Animated.View>

      {/* Right swipe hint (Complete) */}
      <Animated.View style={[styles.hint, styles.rightHint, { transform: [{ translateX: rightArrowX }] }]}>
        <Text style={[styles.label, { color: colors.text }]}>Swipe to complete</Text>
        <Text style={styles.arrow}>→</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 10,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'absolute',
  },
  leftHint: {
    left: 20,
  },
  rightHint: {
    right: 20,
  },
  arrow: {
    fontSize: 32,
    opacity: 0.7,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
});

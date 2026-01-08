// ============================================
// ANIMATED NUMBER COMPONENT
// ============================================
// Animates number changes with a rolling effect
// ============================================

import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  style?: StyleProp<TextStyle>;
  suffix?: string; // e.g., "d" for days
}

export function AnimatedNumber({ value, style, suffix = '' }: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Quick fade and number change effect with scale
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(animatedValue, {
          toValue: value,
          useNativeDriver: true,
          tension: 80,
          friction: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [value]);

  // For display, we'll use the value directly but animate opacity
  // Since we can't interpolate text directly, we animate the opacity instead
  return (
    <Animated.Text style={[style, { opacity }]}>
      {value}{suffix}
    </Animated.Text>
  );
}

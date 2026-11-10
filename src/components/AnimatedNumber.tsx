// ============================================
// ANIMATED NUMBER COMPONENT
// ============================================
// When the number changes, the new value rises into place and fades in.
// Nothing plays on first render. Reduce Motion: fade only.
// ============================================

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, TextStyle } from 'react-native';
import { useReduceMotion } from '../utils/motion';

const RISE_PX = 6;
const DURATION_MS = 180;

interface AnimatedNumberProps {
  value: number;
  style?: StyleProp<TextStyle>;
  suffix?: string; // e.g., "d" for days
  /** Custom text for the value, e.g. "3/8 glasses". Overrides the plain number and suffix. */
  format?: (value: number) => string;
}

export function AnimatedNumber({ value, style, suffix = '', format }: AnimatedNumberProps) {
  const reduceMotion = useReduceMotion();
  // 0 = just changed, 1 = settled
  const settle = useRef(new Animated.Value(1)).current;
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    settle.setValue(0);
    Animated.timing(settle, {
      toValue: 1,
      duration: DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [value]);

  const translateY = reduceMotion ? 0 : settle.interpolate({ inputRange: [0, 1], outputRange: [RISE_PX, 0] });

  return (
    <Animated.Text style={[style, { opacity: settle, transform: [{ translateY }] }]}>
      {format ? format(value) : `${value}${suffix}`}
    </Animated.Text>
  );
}

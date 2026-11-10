// ============================================
// TOUCHABLE SCALE
// ============================================
// The app's standard pressable. Shrinks very slightly while held, which
// takes the label and icon with it and reads as a physical press. Feedback
// starts on press-in; the action still fires on release.
// Reduce Motion: dims instead of shrinking.
// ============================================

import React, { useRef } from 'react';
import { Animated, Easing, GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useReduceMotion } from '../utils/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESSED_SCALE = 0.97;
const PRESSED_OPACITY = 0.7;
const PRESS_IN_MS = 100;
const PRESS_OUT_MS = 150;

export type TouchableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Accepted so old TouchableOpacity call sites keep compiling; not used */
  activeOpacity?: number;
};

export function TouchableScale({
  style,
  children,
  onPressIn,
  onPressOut,
  activeOpacity: _activeOpacity,
  ...rest
}: TouchableScaleProps) {
  const reduceMotion = useReduceMotion();
  // 0 = at rest, 1 = held down
  const pressed = useRef(new Animated.Value(0)).current;

  const animateTo = (toValue: number, duration: number) =>
    Animated.timing(pressed, { toValue, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();

  const handlePressIn = (event: GestureResponderEvent) => {
    animateTo(1, PRESS_IN_MS);
    onPressIn?.(event);
  };
  const handlePressOut = (event: GestureResponderEvent) => {
    animateTo(0, PRESS_OUT_MS);
    onPressOut?.(event);
  };

  const feedback = reduceMotion
    ? { opacity: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, PRESSED_OPACITY] }) }
    : { transform: [{ scale: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, PRESSED_SCALE] }) }] };

  return (
    <AnimatedPressable {...rest} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[style, feedback]}>
      {children}
    </AnimatedPressable>
  );
}

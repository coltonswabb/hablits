// ============================================
// ANIMATIONS
// ============================================
// Reusable animation utilities and components.
// Uses React Native's Animated API.
// ============================================

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, Easing } from 'react-native';

// ============================================
// ANIMATED WRAPPERS
// ============================================

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

/**
 * Fades in children on mount
 */
export function FadeIn({ children, delay = 0, duration = 300, style }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
}

interface SlideInProps {
  children: React.ReactNode;
  from?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle;
}

/**
 * Slides in children from a direction on mount
 */
export function SlideIn({
  children,
  from = 'bottom',
  delay = 0,
  duration = 300,
  distance = 20,
  style,
}: SlideInProps) {
  const translateValue = useRef(new Animated.Value(distance)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateValue, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const transform = [];
  switch (from) {
    case 'left':
      transform.push({ translateX: Animated.multiply(translateValue, -1) });
      break;
    case 'right':
      transform.push({ translateX: translateValue });
      break;
    case 'top':
      transform.push({ translateY: Animated.multiply(translateValue, -1) });
      break;
    case 'bottom':
    default:
      transform.push({ translateY: translateValue });
      break;
  }

  return (
    <Animated.View style={[style, { opacity, transform }]}>
      {children}
    </Animated.View>
  );
}

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

/**
 * Scales in children from 0 to 1 on mount
 */
export function ScaleIn({ children, delay = 0, duration = 300, style }: ScaleInProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration / 2,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

interface BounceProps {
  children: React.ReactNode;
  trigger: boolean;
  style?: ViewStyle;
}

/**
 * Bounces children when trigger changes to true
 */
export function Bounce({ children, trigger, style }: BounceProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
      ]).start();
    }
  }, [trigger]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

interface PulseProps {
  children: React.ReactNode;
  active?: boolean;
  style?: ViewStyle;
}

/**
 * Continuously pulses children while active
 */
export function Pulse({ children, active = true, style }: PulseProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
      scale.setValue(1);
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [active]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

interface ShakeProps {
  children: React.ReactNode;
  trigger: boolean;
  style?: ViewStyle;
}

/**
 * Shakes children when trigger changes to true
 */
export function Shake({ children, trigger, style }: ShakeProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [trigger]);

  return (
    <Animated.View style={[style, { transform: [{ translateX }] }]}>
      {children}
    </Animated.View>
  );
}

// ============================================
// ANIMATION HOOKS
// ============================================

/**
 * Hook for animated progress value (0 to target)
 */
export function useAnimatedProgress(targetValue: number, duration: number = 500) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: targetValue,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // Can't use native driver for non-transform/opacity
    }).start();
  }, [targetValue]);

  return animatedValue;
}

/**
 * Hook for bounce animation on value change
 */
export function useBounceOnChange(value: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
      ]).start();
      prevValue.current = value;
    }
  }, [value]);

  return scale;
}

/**
 * Stagger delay calculator for list items
 */
export function staggerDelay(index: number, baseDelay: number = 50): number {
  return index * baseDelay;
}

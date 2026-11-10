// ============================================
// PROGRESS RING COMPONENT
// ============================================
// A small circular progress indicator. The arc eases to its new value when
// progress changes (no animation on first render).
// ============================================

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const FILL_MS = 300;

interface ProgressRingProps {
  progress: number;    // 0 to 1
  size?: number;       // Diameter in pixels
  strokeWidth?: number;
}

export function ProgressRing({
  progress,
  size = 22,
  strokeWidth = 3,
}: ProgressRingProps) {
  const { colors } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));

  const filled = useRef(new Animated.Value(clamped)).current;
  useEffect(() => {
    // SVG props can't use the native driver; this is one tiny arc
    Animated.timing(filled, {
      toValue: clamped,
      duration: FILL_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  const strokeDashoffset = filled.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <View>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.divider}
          strokeWidth={strokeWidth}
          fill={colors.bg}
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

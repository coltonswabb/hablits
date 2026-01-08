// ============================================
// LOGO COMPONENT
// ============================================
// Pixel art house logo for Hablits
// ============================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 24 }: LogoProps) {
  const { colors } = useTheme();
  const pixelSize = size / 8; // 8x8 pixel grid

  // Pixel art house pattern (1 = filled, 0 = empty)
  // Designed to look like a cute little house/home
  const pattern = [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {pattern.map((row, y) =>
        row.map((pixel, x) => {
          if (!pixel) return null;
          return (
            <View
              key={`${x}-${y}`}
              style={[
                styles.pixel,
                {
                  width: pixelSize,
                  height: pixelSize,
                  left: x * pixelSize,
                  top: y * pixelSize,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pixel: {
    position: 'absolute',
  },
});

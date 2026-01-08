// ============================================
// CELEBRATIONS
// ============================================
// Confetti and celebration effects.
// Uses a simple particle system for web/native.
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { playCelebrationSequence } from '../utils/sounds';
import { celebrationTaps } from '../utils/haptics';

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
}

interface ConfettiProps {
  active: boolean;
  count?: number;
  colors?: string[];
  onComplete?: () => void;
  mini?: boolean; // Smaller, localized celebration
  originX?: number; // X coordinate for confetti origin
  originY?: number; // Y coordinate for confetti origin
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DEFAULT_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
  '#f38181',
  '#aa96da',
  '#fcbad3',
  '#a8d8ea',
];

export function Confetti({
  active,
  count = 50,
  colors = DEFAULT_COLORS,
  onComplete,
  mini = false,
  originX,
  originY,
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];

    // Mini celebrations use fewer particles and start from center or specified origin
    const particleCount = mini ? Math.min(count, 15) : count;
    const startX = originX ?? (mini ? SCREEN_WIDTH / 2 : 0);
    const startY = originY ?? (mini ? SCREEN_HEIGHT * 0.4 : -20);

    for (let i = 0; i < particleCount; i++) {
      const initialY = mini ? startY : startY - Math.random() * 100;
      newParticles.push({
        id: i,
        x: new Animated.Value(mini ? startX + (Math.random() - 0.5) * 40 : Math.random() * SCREEN_WIDTH),
        y: new Animated.Value(initialY),
        rotation: new Animated.Value(0),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: mini ? 4 + Math.random() * 4 : 8 + Math.random() * 8,
      });
    }

    return newParticles;
  }, [count, colors, mini, originX, originY]);

  const animateParticles = useCallback((particleList: Particle[]) => {
    const animations = particleList.map((particle, index) => {
      // Mini celebrations are faster and more compact
      const duration = mini ? 800 + Math.random() * 400 : 2000 + Math.random() * 1000;
      const spread = mini ? 150 : 200;
      const startX = originX ?? (mini ? SCREEN_WIDTH / 2 : 0);
      const startY = originY ?? (mini ? SCREEN_HEIGHT * 0.4 : -20);

      // For mini confetti, particles burst outward and down from origin
      // For full confetti, they fall from top to bottom
      const fallDistance = mini ? 200 + Math.random() * 100 : SCREEN_HEIGHT + 50;

      const toX = mini
        ? startX + (Math.random() - 0.5) * spread
        : (SCREEN_WIDTH / particleList.length) * index + (Math.random() - 0.5) * spread;

      return Animated.parallel([
        Animated.timing(particle.y, {
          toValue: mini ? startY + fallDistance : SCREEN_HEIGHT + 50,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.x, {
          toValue: toX,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: Math.random() * 10 - 5,
          duration,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(mini ? 10 : 20, animations).start(() => {
      setParticles([]);
      onComplete?.();
    });
  }, [mini, onComplete, originX, originY]);

  useEffect(() => {
    if (active) {
      // Play celebration sound and haptics (only for full confetti)
      if (!mini) {
        playCelebrationSequence();
        celebrationTaps();
      }

      const newParticles = createParticles();
      setParticles(newParticles);

      // Small delay to ensure state is set before animation
      setTimeout(() => {
        animateParticles(newParticles);
      }, 50);
    }
  }, [active, createParticles, animateParticles]);

  if (particles.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: particle.size / 2,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [-5, 5],
                    outputRange: ['-180deg', '180deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

// Hook for triggering confetti
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);
  const [key, setKey] = useState(0);
  const [origin, setOrigin] = useState<{ x?: number; y?: number }>({});

  const trigger = useCallback((x?: number, y?: number) => {
    setKey((k) => k + 1);
    setOrigin({ x, y });
    setIsActive(true);
  }, []);

  const onComplete = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    key,
    trigger,
    onComplete,
    originX: origin.x,
    originY: origin.y,
  };
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999, // For Android
  },
  particle: {
    position: 'absolute',
  },
});

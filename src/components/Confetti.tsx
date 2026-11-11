// ============================================
// CELEBRATIONS
// ============================================
// Confetti for finishing the day. Two bursts fire from the bottom corners,
// arc up across the screen, tumble as they fall and fade out before they
// land. Each piece follows a real thrown path (up fast, slowing, then down),
// so the motion reads as paper in the air rather than dots sliding.
//
// Everything animates transform and opacity on the native driver.
// ============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, useWindowDimensions, ViewStyle } from 'react-native';
import { isReduceMotion } from '../utils/motion';

/** What the pieces look like. Themes can pick one that suits them. */
export type ConfettiShape = 'mixed' | 'pixel' | 'petal';

type PieceKind = 'strip' | 'square' | 'dot' | 'petal';

interface Piece {
  id: number;
  /** 0 = just fired, 1 = finished */
  progress: Animated.Value;
  kind: PieceKind;
  color: string;
  size: number;
  startX: number;
  endX: number;
  /** How high it climbs above the launch point, in points */
  rise: number;
  /** How far below the launch point it ends up */
  fall: number;
  spins: number;
  flips: number;
  delay: number;
  duration: number;
}

interface ConfettiProps {
  active: boolean;
  count?: number;
  colors?: string[];
  shape?: ConfettiShape;
  onComplete?: () => void;
}

const DEFAULT_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3', '#a8d8ea'];

const DURATION_MS = 2200;
const DURATION_SPREAD_MS = 500;
const MAX_DELAY_MS = 180;
// Points along the flight where the height is sampled. More points near the
// top, where the path curves most.
const FLIGHT_SAMPLES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
/** The piece is at its highest this far through the flight */
const PEAK_AT = 0.38;

const KINDS_FOR_SHAPE: Record<ConfettiShape, PieceKind[]> = {
  mixed: ['strip', 'strip', 'square', 'dot'],
  pixel: ['square'],
  petal: ['petal'],
};

const random = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Height above the launch point at time t (0..1): climbs to `rise` at PEAK_AT,
 * then drops to `-fall` by the end. Each half is a parabola, like a thrown object.
 */
function heightAt(t: number, rise: number, fall: number): number {
  if (t <= PEAK_AT) {
    const u = t / PEAK_AT;
    return rise * (1 - (1 - u) * (1 - u));
  }
  const u = (t - PEAK_AT) / (1 - PEAK_AT);
  return rise - (rise + fall) * u * u;
}

export function Confetti({ active, count = 50, colors = DEFAULT_COLORS, shape = 'mixed', onComplete }: ConfettiProps) {
  const { width, height } = useWindowDimensions();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const createPieces = useCallback((): Piece[] => {
    const kinds = KINDS_FOR_SHAPE[shape];
    return Array.from({ length: count }, (_, id) => {
      // Alternate corners; each side throws toward and past the middle
      const fromLeft = id % 2 === 0;
      const startX = fromLeft ? random(-10, width * 0.08) : random(width * 0.92, width + 10);
      const reach = random(width * 0.15, width * 0.85);
      return {
        id,
        progress: new Animated.Value(0),
        kind: kinds[Math.floor(Math.random() * kinds.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        size: random(7, 12),
        startX,
        endX: fromLeft ? startX + reach : startX - reach,
        rise: random(height * 0.45, height * 0.85),
        fall: random(40, 160),
        spins: random(1, 3) * (Math.random() < 0.5 ? -1 : 1),
        flips: random(2, 5),
        delay: random(0, MAX_DELAY_MS),
        duration: DURATION_MS + random(-DURATION_SPREAD_MS / 2, DURATION_SPREAD_MS / 2),
      };
    });
  }, [count, colors, shape, width, height]);

  useEffect(() => {
    if (!active) return;
    const next = createPieces();
    setPieces(next);
    const animation = Animated.parallel(
      next.map((piece) =>
        Animated.timing(piece.progress, {
          toValue: 1,
          duration: piece.duration,
          delay: piece.delay,
          // Time runs evenly; the thrown path itself supplies the slow-at-the-top feel
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    );
    animation.start(({ finished }) => {
      if (!finished) return;
      setPieces([]);
      onCompleteRef.current?.();
    });
    return () => animation.stop();
  }, [active]);

  if (pieces.length === 0) return null;

  // Launch from just below three quarters of the way down the screen
  const launchY = height * 0.78;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => {
        const translateX = piece.progress.interpolate({ inputRange: [0, 1], outputRange: [piece.startX, piece.endX] });
        const translateY = piece.progress.interpolate({
          inputRange: FLIGHT_SAMPLES,
          outputRange: FLIGHT_SAMPLES.map((t) => launchY - heightAt(t, piece.rise, piece.fall)),
        });
        // Solid for most of the flight, gone before it would hit the ground
        const opacity = piece.progress.interpolate({ inputRange: [0, 0.05, 0.75, 1], outputRange: [0, 1, 1, 0] });
        const rotate = piece.progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spins * 360}deg`] });
        // Flipping end over end is what makes paper look like paper
        const rotateX = piece.progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.flips * 360}deg`] });
        // Pixel pieces stay square to the screen: no spin, no flip
        const transform =
          piece.kind === 'square' && shape === 'pixel'
            ? [{ translateX }, { translateY }]
            : [{ translateX }, { translateY }, { rotate }, { rotateX }];

        return (
          <Animated.View
            key={piece.id}
            style={[styles.piece, pieceStyle(piece), { backgroundColor: piece.color, opacity, transform }]}
          />
        );
      })}
    </View>
  );
}

function pieceStyle(piece: Piece): ViewStyle {
  const s = piece.size;
  switch (piece.kind) {
    case 'strip':
      return { width: s * 0.5, height: s * 1.6, borderRadius: 1 };
    case 'square':
      return { width: s, height: s, borderRadius: 1 };
    case 'dot':
      return { width: s * 0.8, height: s * 0.8, borderRadius: s };
    case 'petal':
      // A rounded shape with one pointed corner
      return { width: s, height: s * 1.3, borderRadius: s, borderTopLeftRadius: 0 };
  }
}

// Hook for triggering confetti
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);
  const [key, setKey] = useState(0);

  const trigger = useCallback(() => {
    if (isReduceMotion()) return; // Reduce Motion: no particle bursts
    setKey((k) => k + 1);
    setIsActive(true);
  }, []);

  const onComplete = useCallback(() => {
    setIsActive(false);
  }, []);

  return { isActive, key, trigger, onComplete };
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999, // For Android
  },
  piece: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

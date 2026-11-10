// ============================================
// LAUNCH SCREEN
// ============================================
// Covers the app while saved data and the theme load, so the first thing
// seen is never the default (Light, empty) screen. The native splash is a
// plain colour (no logo; see the expo-splash-screen config in app.json) and
// this starts as the same plain colour, so the handoff is invisible. Then:
//
//   the pet drops in with a bounce → "Hablits" and a greeting rise in →
//   the cover fades to reveal the app, already themed with data in place.
//
// Reduce Motion: no bounce, just fades.
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Pet } from './Pet';
import { HatType, PetSpecies } from '../types';
import { useReduceMotion } from '../utils/motion';

// Must match the expo-splash-screen plugin config in app.json
const SPLASH_BG = { light: '#6c6fe0', dark: '#15121f' };

/** Never hold the app hostage: dismiss even if loading hasn't reported in. */
const MAX_WAIT_MS = 4000;

interface LaunchScreenProps {
  /** True once saved data and theme have loaded */
  ready: boolean;
  /** False on a first launch, before the user has picked a pet */
  hasPet: boolean;
  species: PetSpecies;
  hat: HatType;
  stage: number;
  petName?: string;
}

export function LaunchScreen({ ready, hasPet, species, hat, stage, petName }: LaunchScreenProps) {
  const scheme = useColorScheme();
  const reduceMotion = useReduceMotion();
  const [gone, setGone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // The pet is only drawn once we know which pet it is
  const [showPet, setShowPet] = useState(false);
  const started = useRef(false);

  const cover = useRef(new Animated.Value(1)).current;
  const petScale = useRef(new Animated.Value(0.3)).current;
  const petDrop = useRef(new Animated.Value(-40)).current;
  const petOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleRise = useRef(new Animated.Value(10)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (started.current || !(ready || timedOut)) return;
    started.current = true;

    const fadeCover = (duration: number) =>
      Animated.timing(cover, { toValue: 0, duration, easing: Easing.out(Easing.quad), useNativeDriver: true });

    if (!ready) {
      // Loading is stuck: get out of the way and let the app show what it has
      fadeCover(300).start(() => setGone(true));
      return;
    }

    setShowPet(true);
    const fadeIn = (v: Animated.Value, duration: number) => Animated.timing(v, { toValue: 1, duration, useNativeDriver: true });

    if (reduceMotion) {
      petScale.setValue(1);
      petDrop.setValue(0);
      titleRise.setValue(0);
      Animated.sequence([
        Animated.parallel([fadeIn(petOpacity, 200), fadeIn(titleOpacity, 200), fadeIn(subOpacity, 200)]),
        Animated.delay(450),
        fadeCover(250),
      ]).start(() => setGone(true));
      return;
    }

    Animated.sequence([
      // The pet drops in and lands with a bounce
      Animated.parallel([
        fadeIn(petOpacity, 120),
        Animated.spring(petScale, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
        Animated.spring(petDrop, { toValue: 0, tension: 120, friction: 7, useNativeDriver: true }),
        // The name rises in just behind it
        Animated.sequence([
          Animated.delay(140),
          Animated.parallel([
            fadeIn(titleOpacity, 240),
            Animated.timing(titleRise, { toValue: 0, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
        ]),
        Animated.sequence([Animated.delay(300), fadeIn(subOpacity, 240)]),
      ]),
      Animated.delay(280),
      fadeCover(320),
    ]).start(() => setGone(true));
  }, [ready, timedOut, reduceMotion]);

  if (gone) return null;

  const name = (petName || '').trim();
  const greeting = !hasPet ? 'Small habits, happy pet' : name ? `${name} says hi` : 'Welcome back';

  return (
    <Animated.View
      // Once it starts fading, touches go to the app underneath
      pointerEvents={started.current ? 'none' : 'auto'}
      style={[styles.cover, { backgroundColor: scheme === 'dark' ? SPLASH_BG.dark : SPLASH_BG.light, opacity: cover }]}
      // The native splash stays up until this identical plain frame is on screen
      onLayout={() => SplashScreen.hideAsync().catch(() => {})}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {showPet ? (
        <>
          <Animated.View style={{ opacity: petOpacity, transform: [{ translateY: petDrop }, { scale: petScale }] }}>
            <Pet species={species} hat={hasPet ? hat : 'none'} stage={hasPet ? stage : 0} mood="happy" size={150} />
          </Animated.View>
          <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleRise }] }}>
            <Text style={styles.title}>Hablits</Text>
          </Animated.View>
          <Animated.View style={{ opacity: subOpacity }}>
            <Text style={styles.sub}>{greeting}</Text>
          </Animated.View>
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 18,
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  sub: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.85,
  },
});

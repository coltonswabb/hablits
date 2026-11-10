// ============================================
// LAUNCH SCREEN
// ============================================
// Covers the app while saved data and the theme load, so the first thing
// seen is never the default (Light, empty) screen. It starts as an exact
// copy of the native splash (same colour, same mark, same size), so the
// handoff is invisible, then:
//
//   mark dips and lifts away → the pet pops up with a greeting → the cover
//   fades to reveal the app, already in the right theme with data in place.
//
// Reduce Motion: a plain fade.
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Pet } from './Pet';
import { HatType, PetSpecies } from '../types';
import { useReduceMotion } from '../utils/motion';

// Must match the expo-splash-screen plugin config in app.json
const SPLASH_BG = { light: '#6c6fe0', dark: '#15121f' };
const SPLASH_MARK_SIZE = 200;

/** Never hold the app hostage: dismiss even if loading hasn't reported in. */
const MAX_WAIT_MS = 4000;

interface LaunchScreenProps {
  /** True once saved data and theme have loaded */
  ready: boolean;
  /** Show the pet (false for a first launch, before there is one) */
  showPet: boolean;
  species: PetSpecies;
  hat: HatType;
  stage: number;
  petName?: string;
}

export function LaunchScreen({ ready, showPet, species, hat, stage, petName }: LaunchScreenProps) {
  const scheme = useColorScheme();
  const reduceMotion = useReduceMotion();
  const [gone, setGone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const started = useRef(false);

  const cover = useRef(new Animated.Value(1)).current;
  const markScale = useRef(new Animated.Value(1)).current;
  const markOpacity = useRef(new Animated.Value(1)).current;
  const markLift = useRef(new Animated.Value(0)).current;
  const petScale = useRef(new Animated.Value(0.4)).current;
  const petOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textRise = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (started.current || !(ready || timedOut)) return;
    started.current = true;

    const fadeCover = (duration: number) =>
      Animated.timing(cover, { toValue: 0, duration, easing: Easing.out(Easing.quad), useNativeDriver: true });

    if (reduceMotion || !showPet || !ready) {
      // First launch, Reduce Motion, or a slow load: just get out of the way
      fadeCover(reduceMotion ? 200 : 320).start(() => setGone(true));
      return;
    }

    Animated.sequence([
      // The mark takes a breath, then lifts away
      Animated.timing(markScale, { toValue: 0.9, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(markScale, { toValue: 1.15, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(markLift, { toValue: -36, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(markOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
      // The pet pops up to say hello
      Animated.parallel([
        Animated.spring(petScale, { toValue: 1, tension: 140, friction: 6, useNativeDriver: true }),
        Animated.timing(petOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(120),
          Animated.parallel([
            Animated.timing(textOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
            Animated.timing(textRise, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
        ]),
      ]),
      Animated.delay(260),
      fadeCover(300),
    ]).start(() => setGone(true));
  }, [ready, timedOut, reduceMotion, showPet]);

  if (gone) return null;

  const name = (petName || '').trim();
  const dark = scheme === 'dark';

  return (
    <Animated.View
      // Once it starts fading, touches go to the app underneath
      pointerEvents={started.current ? 'none' : 'auto'}
      style={[styles.cover, { backgroundColor: dark ? SPLASH_BG.dark : SPLASH_BG.light, opacity: cover }]}
      // The native splash stays up until this identical frame is on screen
      onLayout={() => SplashScreen.hideAsync().catch(() => {})}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.center, { opacity: markOpacity, transform: [{ translateY: markLift }, { scale: markScale }] }]}>
        <Image source={require('../../assets/splash-icon.png')} style={styles.mark} resizeMode="contain" />
      </Animated.View>

      {showPet ? (
        <Animated.View style={[styles.center, { opacity: petOpacity, transform: [{ scale: petScale }] }]}>
          <Pet species={species} hat={hat} stage={stage} mood="happy" size={150} />
          <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textRise }] }}>
            <Text style={styles.hello}>{name ? `${name} says hi` : 'Welcome back'}</Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: SPLASH_MARK_SIZE,
    height: SPLASH_MARK_SIZE,
  },
  hello: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
});

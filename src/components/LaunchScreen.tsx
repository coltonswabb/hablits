// ============================================
// LAUNCH SCREEN
// ============================================
// Covers the app while saved data and the theme load, so the first thing
// seen is never the default (Light, empty) screen. The native splash is the
// app icon's pet on black (see the expo-splash-screen config in app.json:
// assets/splash-pet.png, 150pt wide, centred). This starts as that same
// frame, with the same pet at the same size in the same place, so the
// handoff is invisible. Then:
//
//   once data is loaded the icon's pet cross-fades into your own pet, and
//   "Hablits" and a greeting rise in below → the cover fades to reveal the app.
//
// This plays on every open, so it is short (about 0.6s after loading) and
// never overshoots. Reduce Motion: fades only.
//
// If you change PET_SIZE or the pet's position, change the splash config to match.
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Pet } from './Pet';
import { Logo } from './Logo';
import { HatType, PetSpecies } from '../types';
import { useReduceMotion } from '../utils/motion';
import { fontSizes } from '../theme/tokens';

// These must match the expo-splash-screen plugin config in app.json (backgroundColor, imageWidth)
const SPLASH_BG = '#000000';
const PET_SIZE = 150;
const TITLE_GAP = 18;

// Strong ease-out: quick to arrive, no overshoot
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

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
  const reduceMotion = useReduceMotion();
  const [gone, setGone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // The user's own pet is only drawn once we know which pet it is
  const [showOwnPet, setShowOwnPet] = useState(false);
  const started = useRef(false);

  const cover = useRef(new Animated.Value(1)).current;
  // Already showing: the native splash drew this same pet
  const iconPetOpacity = useRef(new Animated.Value(1)).current;
  const ownPetOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleRise = useRef(new Animated.Value(10)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;

  const timing = (v: Animated.Value, toValue: number, duration: number) =>
    Animated.timing(v, { toValue, duration, easing: EASE_OUT, useNativeDriver: true });

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (started.current || !(ready || timedOut)) return;
    started.current = true;

    if (!ready) {
      // Loading is stuck: get out of the way and let the app show what it has
      timing(cover, 0, 300).start(() => setGone(true));
      return;
    }

    if (reduceMotion) titleRise.setValue(0);
    if (hasPet) setShowOwnPet(true);

    Animated.sequence([
      Animated.parallel([
        // The icon's pet becomes your pet
        ...(hasPet ? [timing(ownPetOpacity, 1, 220), timing(iconPetOpacity, 0, 220)] : []),
        // The name rises in just behind it
        Animated.sequence([
          Animated.delay(70),
          Animated.parallel([timing(titleOpacity, 1, 220), timing(titleRise, 0, 220)]),
        ]),
        Animated.sequence([Animated.delay(140), timing(subOpacity, 1, 220)]),
      ]),
      Animated.delay(80),
      timing(cover, 0, 180),
    ]).start(() => setGone(true));
  }, [ready, timedOut, reduceMotion]);

  if (gone) return null;

  const name = (petName || '').trim();
  const greeting = !hasPet ? 'Small habits, happy pet' : name ? `${name} says hi` : 'Welcome back';

  return (
    <Animated.View
      // Once it starts fading, touches go to the app underneath
      pointerEvents={started.current ? 'none' : 'auto'}
      style={[styles.cover, { opacity: cover }]}
      // The native splash stays up until this identical plain frame is on screen
      onLayout={() => SplashScreen.hideAsync().catch(() => {})}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.petStage}>
        <Animated.View style={[styles.petLayer, { opacity: iconPetOpacity }]}>
          {/* The same pet as the app icon, in the icon's colours */}
          <Logo size={PET_SIZE} body="#ffffff" face="#000000" cheek="#cfcfcf" shadow="#3a3a3a" />
        </Animated.View>
        {showOwnPet ? (
          <Animated.View style={[styles.petLayer, { opacity: ownPetOpacity }]}>
            <Pet species={species} hat={hat} stage={stage} mood="happy" size={PET_SIZE} />
          </Animated.View>
        ) : null}
      </View>
      {/* The pet stays dead centre, where the native splash drew it; the text hangs below */}
      <View style={styles.textBlock}>
        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleRise }] }}>
          <Text style={styles.title}>Hablits</Text>
        </Animated.View>
        <Animated.View style={{ opacity: subOpacity }}>
          <Text style={styles.sub}>{greeting}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BG,
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petStage: {
    width: PET_SIZE,
    height: PET_SIZE,
  },
  petLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: PET_SIZE / 2 + TITLE_GAP,
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  sub: {
    marginTop: 6,
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.85,
  },
});

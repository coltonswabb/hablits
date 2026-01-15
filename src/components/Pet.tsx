// ============================================
// PET COMPONENT - PIXEL ART EDITION
// ============================================
// Stardew Valley-inspired virtual pets with:
// - Detailed pixel art designs
// - Idle breathing/bobbing animations
// - Reactive animations based on completions
// - Expressive moods and celebrations
// ============================================

import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse, G } from 'react-native-svg';
import { PetSpecies, PetMood, HatType } from '../types';
import { useTheme } from '../theme';

// Create animated SVG components
const AnimatedG = Animated.createAnimatedComponent(G);

interface PetProps {
  species: PetSpecies;
  mood: PetMood;
  hat: HatType;
  size?: number;
  completionsToday?: number;
  streak?: number;
  onPress?: () => void;
}

export function Pet({
  species,
  mood,
  hat,
  size = 64,
  completionsToday = 0,
  streak = 0,
  onPress
}: PetProps) {
  const { colors } = useTheme();

  // Animation values
  const bobY = useRef(new Animated.Value(0)).current;
  const breatheScale = useRef(new Animated.Value(1)).current;
  const bounceY = useRef(new Animated.Value(0)).current;
  const wiggleRotate = useRef(new Animated.Value(0)).current;
  const blinkOpacity = useRef(new Animated.Value(1)).current;
  const headTilt = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(1)).current;
  const tapBounce = useRef(new Animated.Value(0)).current;
  const tapScale = useRef(new Animated.Value(1)).current;

  // Idle animation - gentle bob
  useEffect(() => {
    const bobAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, {
          toValue: -2,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bobY, {
          toValue: 2,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    bobAnimation.start();
    return () => bobAnimation.stop();
  }, []);

  // Breathing animation
  useEffect(() => {
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheScale, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheScale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breatheAnimation.start();
    return () => breatheAnimation.stop();
  }, []);

  // Occasional blink animation
  useEffect(() => {
    const triggerBlink = () => {
      Animated.sequence([
        Animated.timing(blinkOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(blinkOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Random blinks every 3-6 seconds
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        triggerBlink();
      }
    }, 3000 + Math.random() * 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Occasional head tilt animation
  useEffect(() => {
    const triggerHeadTilt = () => {
      Animated.sequence([
        Animated.timing(headTilt, {
          toValue: 5,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(headTilt, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Random head tilts every 5-10 seconds
    const tiltInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        triggerHeadTilt();
      }
    }, 5000 + Math.random() * 5000);

    return () => clearInterval(tiltInterval);
  }, []);

  // Celebration animation for milestone streaks
  useEffect(() => {
    const milestones = [7, 14, 30, 50, 100, 365];
    const isMilestone = milestones.includes(streak);

    if (isMilestone) {
      // Big celebratory jump and scale
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bounceY, {
            toValue: -20,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(celebrationScale, {
            toValue: 1.3,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(bounceY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(celebrationScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]),
      ]).start();
    }
  }, [streak]);

  // Reactive animations based on completions
  useEffect(() => {
    if (completionsToday >= 5) {
      // Excited bouncing
      const excitedAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceY, {
            toValue: -6,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(bounceY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      );
      excitedAnimation.start();
      return () => excitedAnimation.stop();
    } else if (completionsToday >= 3) {
      // Happy wiggle
      const wiggleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(wiggleRotate, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleRotate, {
            toValue: -1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleRotate, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      wiggleAnimation.start();
      return () => wiggleAnimation.stop();
    } else if (completionsToday >= 1) {
      // Gentle bounce
      const gentleBounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceY, {
            toValue: -3,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceY, {
            toValue: 0,
            duration: 400,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(1000),
        ])
      );
      gentleBounce.start();
      return () => gentleBounce.stop();
    } else {
      bounceY.setValue(0);
      wiggleRotate.setValue(0);
    }
  }, [completionsToday]);

  // Color palettes - richer pixel art colors
  const palettes: Record<PetSpecies, { 
    body: string; 
    bodyLight: string;
    bodyDark: string;
    eye: string;
    eyeShine: string;
    cheek: string;
    accent: string;
  }> = {
    blob: { 
      body: '#7ED67E', 
      bodyLight: '#A8E6A8',
      bodyDark: '#5CB85C',
      eye: '#2D2D2D',
      eyeShine: '#FFFFFF',
      cheek: '#FFB6C1',
      accent: '#4CAF50',
    },
    pixel: { 
      body: '#5B9BD5', 
      bodyLight: '#7EB6E6',
      bodyDark: '#3D7AB8',
      eye: '#1A1A2E',
      eyeShine: '#FFFFFF',
      cheek: '#FFB6C1',
      accent: '#2196F3',
    },
    paper: { 
      body: '#F5F5F0', 
      bodyLight: '#FFFFFF',
      bodyDark: '#E0E0D8',
      eye: '#333333',
      eyeShine: '#FFFFFF',
      cheek: '#FFCDD2',
      accent: '#9E9E9E',
    },
    robot: { 
      body: '#78909C', 
      bodyLight: '#90A4AE',
      bodyDark: '#546E7A',
      eye: '#4FC3F7',
      eyeShine: '#B3E5FC',
      cheek: '#FFAB91',
      accent: '#607D8B',
    },
    droplet: { 
      body: '#4DD0E1', 
      bodyLight: '#80DEEA',
      bodyDark: '#26C6DA',
      eye: '#1A237E',
      eyeShine: '#FFFFFF',
      cheek: '#F8BBD9',
      accent: '#00BCD4',
    },
    slime: { 
      body: '#AED581', 
      bodyLight: '#C5E1A5',
      bodyDark: '#8BC34A',
      eye: '#1B5E20',
      eyeShine: '#FFFFFF',
      cheek: '#FFCC80',
      accent: '#689F38',
    },
    carmech: { 
      body: '#EF5350', 
      bodyLight: '#EF9A9A',
      bodyDark: '#C62828',
      eye: '#212121',
      eyeShine: '#FFEB3B',
      cheek: '#FFAB91',
      accent: '#D32F2F',
    },
    navi: {
      body: '#9575CD',
      bodyLight: '#B39DDB',
      bodyDark: '#7E57C2',
      eye: '#311B92',
      eyeShine: '#E1BEE7',
      cheek: '#F48FB1',
      accent: '#673AB7',
    },
    fish: {
      body: '#FF9A56',
      bodyLight: '#FFB380',
      bodyDark: '#FF7F3F',
      eye: '#1A1A2E',
      eyeShine: '#FFFFFF',
      cheek: '#FF6B9D',
      accent: '#16c0d6',
    },
    butterfly: {
      body: '#FF6B9D',
      bodyLight: '#FFB3D1',
      bodyDark: '#E6578A',
      eye: '#2D2D2D',
      eyeShine: '#FFFFFF',
      cheek: '#FFBE0B',
      accent: '#FFD4A3',
    },
    star: {
      body: '#E0E0FF',
      bodyLight: '#FFFFFF',
      bodyDark: '#B388FF',
      eye: '#2D2D2D',
      eyeShine: '#FFFFFF',
      cheek: '#8E44AD',
      accent: '#00F5FF',
    },
    deer: {
      body: '#A67C52',
      bodyLight: '#C9A87C',
      bodyDark: '#8B6239',
      eye: '#2D2D2D',
      eyeShine: '#FFFFFF',
      cheek: '#D4A574',
      accent: '#7D9871',
    },
    tiger: {
      body: '#FF8C42',
      bodyLight: '#FFB380',
      bodyDark: '#1A1410',
      eye: '#FFE066',
      eyeShine: '#FFFFFF',
      cheek: '#FFFFFF',
      accent: '#D97530',
    },
    lion: {
      body: '#7BB3FF',
      bodyLight: '#B3D4FF',
      bodyDark: '#4A90E2',
      eye: '#1A1A2E',
      eyeShine: '#FFFFFF',
      cheek: '#5EB3FF',
      accent: '#91C7FF',
    },
    hawk: {
      body: '#8B6F47',
      bodyLight: '#C4A574',
      bodyDark: '#5D4A2F',
      eye: '#FFC107',
      eyeShine: '#FFFFFF',
      cheek: '#D4A574',
      accent: '#8B5A99',
    },
    dragon: {
      body: '#48C9A5',
      bodyLight: '#7FE3C9',
      bodyDark: '#2A9D7F',
      eye: '#2D2D2D',
      eyeShine: '#FFFFFF',
      cheek: '#FFD700',
      accent: '#FFD700',
    },
  };

  const pal = palettes[species];

  // Render detailed pixel art body for each species
  const renderBody = () => {
    switch (species) {
      case 'blob':
        return (
          <G>
            <Ellipse cx="32" cy="56" rx="16" ry="4" fill="rgba(0,0,0,0.15)" />
            <Path 
              d="M16 40 Q12 35 14 28 Q16 20 24 18 Q32 16 40 18 Q48 20 50 28 Q52 35 48 40 Q50 48 44 52 Q36 56 28 52 Q22 48 16 40Z" 
              fill={pal.body}
            />
            <Path 
              d="M20 28 Q22 22 30 20 Q36 19 38 22" 
              fill="none" 
              stroke={pal.bodyLight} 
              strokeWidth="3"
              strokeLinecap="round"
            />
            <Path 
              d="M44 44 Q48 40 46 34" 
              fill="none" 
              stroke={pal.bodyDark} 
              strokeWidth="2"
              strokeLinecap="round"
            />
          </G>
        );

      case 'pixel':
        return (
          <G>
            <Rect x="18" y="52" width="28" height="6" rx="3" fill="rgba(0,0,0,0.15)" />
            <Rect x="20" y="24" width="24" height="28" rx="4" fill={pal.body} />
            <Rect x="22" y="18" width="20" height="10" rx="4" fill={pal.body} />
            <Rect x="18" y="16" width="6" height="8" rx="2" fill={pal.body} />
            <Rect x="40" y="16" width="6" height="8" rx="2" fill={pal.body} />
            <Rect x="19" y="18" width="4" height="4" rx="1" fill={pal.bodyLight} />
            <Rect x="41" y="18" width="4" height="4" rx="1" fill={pal.bodyLight} />
            <Rect x="22" y="20" width="8" height="4" rx="2" fill={pal.bodyLight} />
            <Ellipse cx="32" cy="42" rx="8" ry="10" fill={pal.bodyLight} />
          </G>
        );

      case 'paper':
        return (
          <G>
            <Ellipse cx="32" cy="54" rx="14" ry="4" fill="rgba(0,0,0,0.1)" />
            <Path 
              d="M32 16 L48 32 L40 52 L24 52 L16 32 Z" 
              fill={pal.body}
              stroke={pal.bodyDark}
              strokeWidth="1"
            />
            <Path d="M32 16 L32 52" stroke={pal.bodyDark} strokeWidth="1" />
            <Path d="M24 32 L40 32" stroke={pal.bodyDark} strokeWidth="1" />
            <Path 
              d="M32 18 L44 30 L38 30 Z" 
              fill={pal.bodyLight}
            />
          </G>
        );

      case 'robot':
        return (
          <G>
            <Rect x="18" y="52" width="28" height="6" rx="3" fill="rgba(0,0,0,0.15)" />
            <Rect x="20" y="28" width="24" height="24" rx="4" fill={pal.body} />
            <Rect x="18" y="16" width="28" height="16" rx="3" fill={pal.body} />
            <Rect x="30" y="8" width="4" height="10" fill={pal.bodyDark} />
            <Circle cx="32" cy="8" r="4" fill={pal.accent} />
            <Circle cx="32" cy="8" r="2" fill={pal.eyeShine} />
            <Rect x="22" y="20" width="20" height="8" rx="2" fill={pal.bodyDark} />
            <Rect x="24" y="32" width="16" height="12" rx="2" fill={pal.bodyDark} />
            <Circle cx="28" cy="38" r="2" fill="#4CAF50" />
            <Circle cx="36" cy="38" r="2" fill="#F44336" />
            <Rect x="12" y="30" width="8" height="4" rx="2" fill={pal.bodyDark} />
            <Rect x="44" y="30" width="8" height="4" rx="2" fill={pal.bodyDark} />
          </G>
        );

      case 'droplet':
        return (
          <G>
            <Ellipse cx="32" cy="56" rx="12" ry="3" fill="rgba(0,0,0,0.15)" />
            <Path 
              d="M32 12 Q44 28 44 40 Q44 54 32 54 Q20 54 20 40 Q20 28 32 12Z" 
              fill={pal.body}
            />
            <Path 
              d="M26 24 Q28 20 32 16" 
              fill="none" 
              stroke={pal.bodyLight} 
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Ellipse cx="26" cy="32" rx="3" ry="4" fill={pal.bodyLight} opacity="0.6" />
            <Ellipse cx="32" cy="48" rx="6" ry="3" fill={pal.bodyLight} opacity="0.4" />
          </G>
        );

      case 'slime':
        return (
          <G>
            <Ellipse cx="32" cy="54" rx="18" ry="4" fill="rgba(0,0,0,0.15)" />
            <Ellipse cx="32" cy="48" rx="20" ry="8" fill={pal.bodyDark} />
            <Ellipse cx="32" cy="38" rx="16" ry="14" fill={pal.body} />
            <Circle cx="18" cy="44" r="6" fill={pal.body} />
            <Circle cx="46" cy="42" r="5" fill={pal.body} />
            <Ellipse cx="28" cy="30" rx="6" ry="4" fill={pal.bodyLight} opacity="0.7" />
            <Circle cx="24" cy="32" r="2" fill={pal.bodyLight} />
            <Circle cx="38" cy="28" r="1.5" fill={pal.bodyLight} />
          </G>
        );

      case 'carmech':
        return (
          <G>
            <Ellipse cx="32" cy="54" rx="16" ry="4" fill="rgba(0,0,0,0.2)" />
            <Path 
              d="M14 40 L18 28 L46 28 L50 40 L50 48 L14 48 Z" 
              fill={pal.body}
            />
            <Path 
              d="M20 28 L24 18 L40 18 L44 28 Z" 
              fill={pal.body}
            />
            <Path 
              d="M22 26 L25 20 L39 20 L42 26 Z" 
              fill={pal.bodyDark}
            />
            <Circle cx="18" cy="40" r="3" fill={pal.eyeShine} />
            <Circle cx="46" cy="40" r="3" fill={pal.eyeShine} />
            <Rect x="26" y="42" width="12" height="4" rx="1" fill={pal.bodyDark} />
            <Circle cx="22" cy="50" r="5" fill="#333" />
            <Circle cx="42" cy="50" r="5" fill="#333" />
            <Circle cx="22" cy="50" r="2" fill="#666" />
            <Circle cx="42" cy="50" r="2" fill="#666" />
            <Rect x="30" y="18" width="4" height="30" fill={pal.bodyLight} opacity="0.5" />
          </G>
        );

      case 'navi':
        return (
          <G>
            <Ellipse cx="32" cy="36" rx="20" ry="22" fill={pal.bodyLight} opacity="0.3" />
            <Ellipse cx="32" cy="56" rx="10" ry="3" fill="rgba(0,0,0,0.1)" />
            <Ellipse cx="32" cy="36" rx="14" ry="16" fill={pal.body} />
            <Ellipse cx="32" cy="34" rx="10" ry="12" fill={pal.bodyLight} opacity="0.5" />
            <Ellipse cx="32" cy="34" rx="6" ry="7" fill={pal.bodyLight} />
            <Ellipse cx="16" cy="32" rx="8" ry="12" fill={pal.bodyLight} opacity="0.6" />
            <Ellipse cx="48" cy="32" rx="8" ry="12" fill={pal.bodyLight} opacity="0.6" />
            <Path d="M12 28 Q16 32 12 36" stroke={pal.body} strokeWidth="1" fill="none" opacity="0.5" />
            <Path d="M52 28 Q48 32 52 36" stroke={pal.body} strokeWidth="1" fill="none" opacity="0.5" />
          </G>
        );

      case 'fish':
        return (
          <G>
            {/* Shadow */}
            <Ellipse cx="32" cy="56" rx="12" ry="3" fill="rgba(0,0,0,0.15)" />
            {/* Tail */}
            <Path
              d="M12 36 Q8 28 14 24 Q10 32 8 36 Q10 40 14 48 Q8 44 12 36 Z"
              fill={pal.bodyLight}
              opacity="0.8"
            />
            {/* Body */}
            <Ellipse cx="32" cy="36" rx="18" ry="14" fill={pal.body} />
            <Ellipse cx="34" cy="36" rx="14" ry="10" fill={pal.bodyLight} opacity="0.6" />
            {/* Fins */}
            <Ellipse cx="26" cy="46" rx="6" ry="4" fill={pal.bodyLight} opacity="0.7" />
            <Ellipse cx="38" cy="46" rx="6" ry="4" fill={pal.bodyLight} opacity="0.7" />
            {/* Dorsal fin */}
            <Path d="M32 22 Q28 26 32 30 Q36 26 32 22 Z" fill={pal.bodyLight} opacity="0.8" />
            {/* Scales pattern */}
            <Circle cx="28" cy="32" r="2" fill={pal.bodyLight} opacity="0.3" />
            <Circle cx="36" cy="34" r="2" fill={pal.bodyLight} opacity="0.3" />
            <Circle cx="32" cy="38" r="2" fill={pal.bodyLight} opacity="0.3" />
          </G>
        );

      case 'butterfly':
        return (
          <G>
            {/* Shadow */}
            <Ellipse cx="32" cy="56" rx="10" ry="3" fill="rgba(0,0,0,0.15)" />
            {/* Top left wing */}
            <Path
              d="M32 32 Q18 18 12 24 Q8 28 12 32 Q18 36 24 32 Q28 28 32 32 Z"
              fill={pal.body}
            />
            {/* Top right wing */}
            <Path
              d="M32 32 Q46 18 52 24 Q56 28 52 32 Q46 36 40 32 Q36 28 32 32 Z"
              fill={pal.body}
            />
            {/* Bottom left wing */}
            <Path
              d="M32 36 Q20 44 14 48 Q10 50 12 54 Q16 56 22 52 Q28 46 32 36 Z"
              fill={pal.bodyDark}
            />
            {/* Bottom right wing */}
            <Path
              d="M32 36 Q44 44 50 48 Q54 50 52 54 Q48 56 42 52 Q36 46 32 36 Z"
              fill={pal.bodyDark}
            />
            {/* Wing patterns - left */}
            <Circle cx="18" cy="28" r="3" fill={pal.accent} opacity="0.8" />
            <Circle cx="20" cy="44" r="2" fill={pal.cheek} opacity="0.7" />
            {/* Wing patterns - right */}
            <Circle cx="46" cy="28" r="3" fill={pal.accent} opacity="0.8" />
            <Circle cx="44" cy="44" r="2" fill={pal.cheek} opacity="0.7" />
            {/* Body */}
            <Ellipse cx="32" cy="36" rx="3" ry="12" fill={pal.bodyDark} />
            <Ellipse cx="32" cy="24" rx="3.5" ry="4" fill={pal.bodyDark} />
            {/* Antennae */}
            <Path d="M31 20 Q28 16 26 14" stroke={pal.bodyDark} strokeWidth="1" fill="none" strokeLinecap="round" />
            <Path d="M33 20 Q36 16 38 14" stroke={pal.bodyDark} strokeWidth="1" fill="none" strokeLinecap="round" />
            <Circle cx="26" cy="14" r="1.5" fill={pal.cheek} />
            <Circle cx="38" cy="14" r="1.5" fill={pal.cheek} />
          </G>
        );

      case 'star':
        return (
          <G>
            {/* Shadow */}
            <Ellipse cx="32" cy="56" rx="12" ry="3" fill="rgba(0,0,0,0.15)" />
            {/* Main star body - 5-pointed star */}
            <Path
              d="M32 18 L36 30 L48 32 L38 40 L40 52 L32 46 L24 52 L26 40 L16 32 L28 30 Z"
              fill={pal.body}
            />
            {/* Inner glow */}
            <Path
              d="M32 24 L34 30 L40 32 L35 36 L36 42 L32 38 L28 42 L29 36 L24 32 L30 30 Z"
              fill={pal.bodyLight}
              opacity="0.9"
            />
            {/* Star points highlights */}
            <Circle cx="32" cy="20" r="2" fill={pal.bodyLight} opacity="0.7" />
            <Circle cx="46" cy="32" r="2" fill={pal.accent} opacity="0.6" />
            <Circle cx="18" cy="32" r="2" fill={pal.accent} opacity="0.6" />
            <Circle cx="38" cy="50" r="2" fill={pal.bodyDark} opacity="0.5" />
            <Circle cx="26" cy="50" r="2" fill={pal.bodyDark} opacity="0.5" />
            {/* Center sparkle */}
            <Circle cx="32" cy="32" r="4" fill={pal.bodyLight} />
            <Path
              d="M32 28 L32.5 30.5 L35 31 L32.5 31.5 L32 34 L31.5 31.5 L29 31 L31.5 30.5 Z"
              fill={pal.accent}
            />
          </G>
        );

      case 'deer':
        return (
          <G>
            {/* Shadow */}
            <Ellipse cx="32" cy="56" rx="14" ry="3" fill="rgba(0,0,0,0.15)" />
            {/* Body */}
            <Ellipse cx="32" cy="42" rx="14" ry="16" fill={pal.body} />
            {/* Chest/belly highlight */}
            <Ellipse cx="32" cy="46" rx="10" ry="10" fill={pal.bodyLight} opacity="0.7" />
            {/* Neck */}
            <Ellipse cx="32" cy="28" rx="6" ry="8" fill={pal.body} />
            {/* Head */}
            <Ellipse cx="32" cy="20" rx="7" ry="8" fill={pal.body} />
            <Ellipse cx="32" cy="22" rx="5" ry="6" fill={pal.bodyLight} opacity="0.6" />
            {/* Snout */}
            <Ellipse cx="32" cy="24" rx="3.5" ry="3" fill={pal.bodyLight} opacity="0.8" />
            <Circle cx="32" cy="25" r="1.5" fill={pal.bodyDark} />
            {/* Ears */}
            <Ellipse cx="27" cy="14" rx="2.5" ry="5" fill={pal.body} />
            <Ellipse cx="37" cy="14" rx="2.5" ry="5" fill={pal.body} />
            <Ellipse cx="27" cy="15" rx="1.5" ry="3" fill={pal.bodyLight} opacity="0.5" />
            <Ellipse cx="37" cy="15" rx="1.5" ry="3" fill={pal.bodyLight} opacity="0.5" />
            {/* Antlers - simple branches */}
            <Path d="M27 12 L25 6 M27 12 L23 10" stroke={pal.bodyDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <Path d="M37 12 L39 6 M37 12 L41 10" stroke={pal.bodyDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Legs */}
            <Rect x="24" y="50" width="3" height="8" rx="1.5" fill={pal.bodyDark} />
            <Rect x="37" y="50" width="3" height="8" rx="1.5" fill={pal.bodyDark} />
            {/* Tail */}
            <Path d="M44 40 Q48 38 48 42 Q48 44 46 44" fill={pal.body} />
            <Circle cx="46" cy="42" r="2" fill={pal.bodyLight} opacity="0.6" />
            {/* Spots (optional detail) */}
            <Circle cx="28" cy="40" r="1.5" fill={pal.bodyLight} opacity="0.4" />
            <Circle cx="36" cy="38" r="1.5" fill={pal.bodyLight} opacity="0.4" />
          </G>
        );

      case 'tiger':
        return (
          <G>
            {/* Shadow */}
            <Ellipse cx="32" cy="56" rx="15" ry="4" fill="rgba(0,0,0,0.2)" />
            {/* Body */}
            <Ellipse cx="32" cy="42" rx="15" ry="17" fill={pal.body} />
            {/* Tiger stripes on body */}
            <Path d="M22 35 Q18 38 20 42" stroke={pal.bodyDark} strokeWidth="2" fill="none" strokeLinecap="round" />
            <Path d="M26 38 Q24 42 26 46" stroke={pal.bodyDark} strokeWidth="2" fill="none" strokeLinecap="round" />
            <Path d="M38 38 Q40 42 38 46" stroke={pal.bodyDark} strokeWidth="2" fill="none" strokeLinecap="round" />
            <Path d="M42 35 Q46 38 44 42" stroke={pal.bodyDark} strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Belly highlight */}
            <Ellipse cx="32" cy="48" rx="10" ry="8" fill={pal.cheek} opacity="0.8" />
            {/* Neck */}
            <Ellipse cx="32" cy="26" rx="7" ry="9" fill={pal.body} />
            {/* Head */}
            <Ellipse cx="32" cy="18" rx="9" ry="9" fill={pal.body} />
            {/* Stripes on head */}
            <Path d="M24 16 Q22 18 24 20" stroke={pal.bodyDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <Path d="M40 16 Q42 18 40 20" stroke={pal.bodyDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <Path d="M28 14 Q28 16 30 16" stroke={pal.bodyDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <Path d="M36 14 Q36 16 34 16" stroke={pal.bodyDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Snout */}
            <Ellipse cx="32" cy="22" rx="4" ry="3.5" fill={pal.cheek} />
            <Circle cx="32" cy="24" r="1.5" fill={pal.bodyDark} />
            {/* Ears */}
            <Ellipse cx="25" cy="12" rx="3" ry="4" fill={pal.body} />
            <Ellipse cx="39" cy="12" rx="3" ry="4" fill={pal.body} />
            <Ellipse cx="25" cy="13" rx="1.5" ry="2" fill={pal.bodyDark} />
            <Ellipse cx="39" cy="13" rx="1.5" ry="2" fill={pal.bodyDark} />
            {/* Legs */}
            <Rect x="23" y="52" width="4" height="8" rx="2" fill={pal.body} />
            <Rect x="37" y="52" width="4" height="8" rx="2" fill={pal.body} />
            <Path d="M24 54 L25 56" stroke={pal.bodyDark} strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M39 54 L38 56" stroke={pal.bodyDark} strokeWidth="1.5" strokeLinecap="round" />
            {/* Tail */}
            <Path d="M46 40 Q52 38 54 42 Q54 46 50 48" fill={pal.body} stroke={pal.body} strokeWidth="3" strokeLinecap="round" />
            <Path d="M50 38 L52 40 M52 44 L50 46" stroke={pal.bodyDark} strokeWidth="1.5" strokeLinecap="round" />
          </G>
        );

      case 'lion':
        return (
          <G>
            {/* Shadow */}
            <Ellipse cx="32" cy="56" rx="14" ry="3" fill="rgba(0,0,0,0.15)" />
            {/* Body */}
            <Ellipse cx="32" cy="42" rx="14" ry="16" fill={pal.body} />
            {/* Chest highlight */}
            <Ellipse cx="32" cy="46" rx="9" ry="10" fill={pal.bodyLight} opacity="0.6" />
            {/* Neck - thicker for mane connection */}
            <Ellipse cx="32" cy="26" rx="8" ry="9" fill={pal.body} />

            {/* PROMINENT MANE - Large layered design */}
            {/* Base mane layer - large circle */}
            <Circle cx="32" cy="18" r="14" fill={pal.bodyDark} opacity="0.9" />

            {/* Mane spikes - bigger and more prominent */}
            <Circle cx="21" cy="10" r="4" fill={pal.bodyDark} />
            <Circle cx="26" cy="7" r="3.5" fill={pal.bodyDark} />
            <Circle cx="32" cy="5" r="4" fill={pal.bodyDark} />
            <Circle cx="38" cy="7" r="3.5" fill={pal.bodyDark} />
            <Circle cx="43" cy="10" r="4" fill={pal.bodyDark} />
            <Circle cx="18" cy="15" r="3.5" fill={pal.bodyDark} />
            <Circle cx="46" cy="15" r="3.5" fill={pal.bodyDark} />
            <Circle cx="16" cy="21" r="3" fill={pal.bodyDark} />
            <Circle cx="48" cy="21" r="3" fill={pal.bodyDark} />

            {/* Secondary mane texture */}
            <Circle cx="24" cy="12" r="2.5" fill={pal.bodyDark} opacity="0.7" />
            <Circle cx="32" cy="9" r="2.5" fill={pal.bodyDark} opacity="0.7" />
            <Circle cx="40" cy="12" r="2.5" fill={pal.bodyDark} opacity="0.7" />

            {/* Head - over the mane */}
            <Circle cx="32" cy="19" r="9" fill={pal.body} />
            {/* Face details */}
            <Ellipse cx="32" cy="21" rx="6" ry="5" fill={pal.bodyLight} opacity="0.7" />
            {/* Snout */}
            <Ellipse cx="32" cy="23" rx="4" ry="3.5" fill={pal.bodyLight} />
            <Circle cx="32" cy="24" r="1.5" fill={pal.bodyDark} />
            {/* Whisker marks */}
            <Circle cx="28" cy="22" r="1" fill={pal.bodyDark} opacity="0.4" />
            <Circle cx="36" cy="22" r="1" fill={pal.bodyDark} opacity="0.4" />
            {/* Ears - visible through mane */}
            <Ellipse cx="25" cy="13" rx="3" ry="4" fill={pal.body} />
            <Ellipse cx="39" cy="13" rx="3" ry="4" fill={pal.body} />
            <Ellipse cx="25" cy="14" rx="1.5" ry="2" fill={pal.bodyLight} opacity="0.6" />
            <Ellipse cx="39" cy="14" rx="1.5" ry="2" fill={pal.bodyLight} opacity="0.6" />
            {/* Legs */}
            <Rect x="24" y="50" width="4" height="8" rx="2" fill={pal.body} />
            <Rect x="36" y="50" width="4" height="8" rx="2" fill={pal.body} />
            {/* Tail with tuft */}
            <Path d="M45 42 Q50 40 52 44 Q52 48 48 50" fill={pal.body} stroke={pal.body} strokeWidth="2.5" strokeLinecap="round" />
            <Circle cx="48" cy="50" r="3.5" fill={pal.bodyDark} />
          </G>
        );

      case 'dragon':
        return (
          <G>
            {/* Shadow */}
            <Ellipse cx="32" cy="56" rx="14" ry="3" fill="rgba(0,0,0,0.15)" />
            {/* Tail - serpentine curve */}
            <Path
              d="M14 48 Q10 44 12 40 Q14 36 16 34 Q18 32 20 32"
              fill="none"
              stroke={pal.body}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <Path
              d="M14 48 Q10 44 12 40 Q14 36 16 34"
              fill="none"
              stroke={pal.bodyLight}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Tail tip spikes */}
            <Path d="M10 46 L12 42 L14 46 Z" fill={pal.accent} />
            <Path d="M8 42 L10 38 L12 42 Z" fill={pal.accent} />

            {/* Body - serpentine lower body */}
            <Ellipse cx="28" cy="42" rx="10" ry="14" fill={pal.body} />
            <Ellipse cx="28" cy="44" rx="8" ry="10" fill={pal.bodyLight} opacity="0.6" />

            {/* Chest/neck */}
            <Ellipse cx="32" cy="28" rx="8" ry="12" fill={pal.body} />
            <Ellipse cx="32" cy="30" rx="6" ry="8" fill={pal.bodyLight} opacity="0.6" />

            {/* Head - dragon head with snout */}
            <Ellipse cx="32" cy="18" rx="9" ry="10" fill={pal.body} />
            <Ellipse cx="32" cy="19" rx="7" ry="8" fill={pal.bodyLight} opacity="0.5" />

            {/* Snout */}
            <Ellipse cx="32" cy="24" rx="5" ry="4" fill={pal.body} />
            <Ellipse cx="32" cy="24" rx="3.5" ry="3" fill={pal.bodyLight} opacity="0.7" />

            {/* Nostrils */}
            <Circle cx="30" cy="25" r="1" fill={pal.bodyDark} />
            <Circle cx="34" cy="25" r="1" fill={pal.bodyDark} />

            {/* Horns - curved back */}
            <Path d="M26 12 Q24 8 25 4" fill="none" stroke={pal.accent} strokeWidth="3" strokeLinecap="round" />
            <Path d="M38 12 Q40 8 39 4" fill="none" stroke={pal.accent} strokeWidth="3" strokeLinecap="round" />
            <Circle cx="25" cy="4" r="2" fill={pal.accent} />
            <Circle cx="39" cy="4" r="2" fill={pal.accent} />

            {/* Whiskers - thin curved lines */}
            <Path d="M26 22 Q20 20 18 22" fill="none" stroke={pal.accent} strokeWidth="1" />
            <Path d="M38 22 Q44 20 46 22" fill="none" stroke={pal.accent} strokeWidth="1" />

            {/* Wings - small dragon wings */}
            <Path
              d="M24 32 Q18 28 16 32 Q18 36 22 36 Q24 34 24 32 Z"
              fill={pal.bodyDark}
              opacity="0.8"
            />
            <Path
              d="M40 32 Q46 28 48 32 Q46 36 42 36 Q40 34 40 32 Z"
              fill={pal.bodyDark}
              opacity="0.8"
            />
            {/* Wing membrane details */}
            <Path d="M20 32 Q18 30 20 28" fill="none" stroke={pal.body} strokeWidth="1" opacity="0.5" />
            <Path d="M44 32 Q46 30 44 28" fill="none" stroke={pal.body} strokeWidth="1" opacity="0.5" />

            {/* Spine ridges - small spikes down back */}
            <Path d="M32 14 L33 12 L34 14 Z" fill={pal.accent} />
            <Path d="M32 20 L33 18 L34 20 Z" fill={pal.accent} />
            <Path d="M31 26 L32 24 L33 26 Z" fill={pal.accent} />
            <Path d="M30 32 L31 30 L32 32 Z" fill={pal.accent} />
            <Path d="M29 38 L30 36 L31 38 Z" fill={pal.accent} />

            {/* Belly scales pattern */}
            <Circle cx="30" cy="34" r="1.5" fill={pal.accent} opacity="0.3" />
            <Circle cx="26" cy="38" r="1.5" fill={pal.accent} opacity="0.3" />
            <Circle cx="30" cy="42" r="1.5" fill={pal.accent} opacity="0.3" />

            {/* Front legs */}
            <Rect x="24" y="50" width="3" height="7" rx="1.5" fill={pal.body} />
            <Rect x="37" y="50" width="3" height="7" rx="1.5" fill={pal.body} />
            {/* Claws */}
            <Path d="M24 57 L22 59 M25 57 L25 59 M27 57 L28 59" stroke={pal.accent} strokeWidth="1" strokeLinecap="round" />
            <Path d="M37 57 L36 59 M38 57 L38 59 M40 57 L41 59" stroke={pal.accent} strokeWidth="1" strokeLinecap="round" />
          </G>
        );

      case 'hawk':
        return (
          <G>
            {/* Shadow */}
            <Ellipse cx="32" cy="56" rx="12" ry="3" fill="rgba(0,0,0,0.2)" />
            {/* Body - compact bird body */}
            <Ellipse cx="32" cy="40" rx="11" ry="15" fill={pal.body} />
            {/* Chest/belly - lighter tan feathers */}
            <Ellipse cx="32" cy="43" rx="8" ry="11" fill={pal.bodyLight} />
            {/* Chest speckles - hawk pattern */}
            <Circle cx="30" cy="40" r="1" fill={pal.bodyDark} opacity="0.4" />
            <Circle cx="34" cy="41" r="1" fill={pal.bodyDark} opacity="0.4" />
            <Circle cx="32" cy="44" r="1" fill={pal.bodyDark} opacity="0.4" />
            <Circle cx="29" cy="46" r="1" fill={pal.bodyDark} opacity="0.4" />
            <Circle cx="35" cy="46" r="1" fill={pal.bodyDark} opacity="0.4" />

            {/* Wings - folded at sides */}
            <Ellipse cx="22" cy="40" rx="6" ry="13" fill={pal.bodyDark} transform="rotate(-10 22 40)" />
            <Ellipse cx="42" cy="40" rx="6" ry="13" fill={pal.bodyDark} transform="rotate(10 42 40)" />
            {/* Wing feather details */}
            <Path d="M18 36 L16 34 M18 40 L16 40 M18 44 L16 46" stroke={pal.body} strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M46 36 L48 34 M46 40 L48 40 M46 44 L48 46" stroke={pal.body} strokeWidth="1.5" strokeLinecap="round" />

            {/* Neck */}
            <Ellipse cx="32" cy="27" rx="5" ry="8" fill={pal.body} />
            {/* White neck band - hawk marking */}
            <Ellipse cx="32" cy="28" rx="4" ry="3" fill={pal.cheek} opacity="0.8" />

            {/* Head - rounded hawk head */}
            <Circle cx="32" cy="18" r="8" fill={pal.body} />
            {/* Crown - darker brown */}
            <Ellipse cx="32" cy="14" rx="6" ry="5" fill={pal.bodyDark} />
            {/* Face disk - lighter */}
            <Ellipse cx="32" cy="19" rx="6" ry="6" fill={pal.bodyLight} opacity="0.6" />

            {/* Beak - sharp hooked hawk beak */}
            <Path d="M32 21 L35 24 L32 24 Z" fill="#8B7355" />
            <Path d="M32 24 Q35 25 36 27" stroke="#8B7355" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Eye stripe - dark line through eye (hawk feature) */}
            <Path d="M26 18 Q28 18 30 18" stroke={pal.bodyDark} strokeWidth="2" strokeLinecap="round" />
            <Path d="M34 18 Q36 18 38 18" stroke={pal.bodyDark} strokeWidth="2" strokeLinecap="round" />

            {/* Legs - strong talons */}
            <Rect x="28" y="51" width="3" height="6" rx="1.5" fill="#D4AF37" />
            <Rect x="33" y="51" width="3" height="6" rx="1.5" fill="#D4AF37" />
            {/* Talons */}
            <Path d="M28 57 L26 59 M29 57 L29 59 M31 57 L32 59" stroke={pal.bodyDark} strokeWidth="1" strokeLinecap="round" />
            <Path d="M33 57 L32 59 M34 57 L34 59 M36 57 L37 59" stroke={pal.bodyDark} strokeWidth="1" strokeLinecap="round" />

            {/* Tail feathers - fanned */}
            <Path d="M30 52 L26 58 L28 54 Z" fill={pal.bodyDark} />
            <Path d="M32 52 L32 58 L32 54 Z" fill={pal.bodyDark} />
            <Path d="M34 52 L38 58 L36 54 Z" fill={pal.bodyDark} />
            {/* Tail bands - hawk pattern */}
            <Path d="M28 54 L36 54" stroke={pal.body} strokeWidth="1" opacity="0.6" />
          </G>
        );

      default:
        return <Circle cx="32" cy="36" r="18" fill={pal.body} />;
    }
  };

  // Render expressive eyes based on mood and species
  const renderEyes = () => {
    const eyeY = species === 'droplet' ? 32 : species === 'robot' ? 24 : species === 'deer' ? 20 : species === 'fish' ? 36 : species === 'butterfly' ? 28 : species === 'star' ? 32 : species === 'tiger' ? 18 : species === 'lion' ? 18 : species === 'hawk' ? 18 : species === 'dragon' ? 19 : 34;
    const eyeSpacing = species === 'robot' ? 6 : species === 'deer' ? 6 : species === 'fish' ? 10 : species === 'tiger' ? 6 : species === 'lion' ? 6 : species === 'hawk' ? 5 : species === 'dragon' ? 6 : 8;

    // Robot - digital/LCD eyes
    if (species === 'robot') {
      return (
        <G>
          {mood === 'happy' || mood === 'excited' || mood === 'celebrate' ? (
            <>
              <Path d={`M${32 - eyeSpacing - 2} ${eyeY} L${32 - eyeSpacing} ${eyeY - 2} L${32 - eyeSpacing + 2} ${eyeY}`} stroke={pal.eye} strokeWidth="2" fill="none" />
              <Path d={`M${32 + eyeSpacing - 2} ${eyeY} L${32 + eyeSpacing} ${eyeY - 2} L${32 + eyeSpacing + 2} ${eyeY}`} stroke={pal.eye} strokeWidth="2" fill="none" />
            </>
          ) : (
            <>
              <Rect x={32 - eyeSpacing - 2} y={eyeY - 2} width="4" height="4" fill={pal.eye} />
              <Rect x={32 + eyeSpacing - 2} y={eyeY - 2} width="4" height="4" fill={pal.eye} />
            </>
          )}
        </G>
      );
    }

    // Navi - glowing fairy eyes
    if (species === 'navi') {
      return (
        <G>
          <Circle cx={32 - 4} cy={32} r="2" fill={pal.eye} />
          <Circle cx={32 + 4} cy={32} r="2" fill={pal.eye} />
        </G>
      );
    }

    // Deer - large doe eyes with lashes
    if (species === 'deer') {
      return (
        <G>
          {mood === 'happy' || mood === 'excited' || mood === 'celebrate' ? (
            <>
              {/* Closed happy eyes with lashes */}
              <Path d={`M${32 - eyeSpacing - 4} ${eyeY} Q${32 - eyeSpacing} ${eyeY - 4} ${32 - eyeSpacing + 4} ${eyeY}`} stroke={pal.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
              <Path d={`M${32 + eyeSpacing - 4} ${eyeY} Q${32 + eyeSpacing} ${eyeY - 4} ${32 + eyeSpacing + 4} ${eyeY}`} stroke={pal.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Eyelashes */}
              <Path d={`M${32 - eyeSpacing - 4} ${eyeY - 1} L${32 - eyeSpacing - 5} ${eyeY - 2}`} stroke={pal.eye} strokeWidth="1" strokeLinecap="round" />
              <Path d={`M${32 + eyeSpacing + 4} ${eyeY - 1} L${32 + eyeSpacing + 5} ${eyeY - 2}`} stroke={pal.eye} strokeWidth="1" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Large gentle eyes */}
              <Ellipse cx={32 - eyeSpacing} cy={eyeY} rx="3.5" ry="5" fill={pal.eye} />
              <Circle cx={32 - eyeSpacing + 1} cy={eyeY - 1} r="1.5" fill={pal.eyeShine} />
              <Ellipse cx={32 + eyeSpacing} cy={eyeY} rx="3.5" ry="5" fill={pal.eye} />
              <Circle cx={32 + eyeSpacing + 1} cy={eyeY - 1} r="1.5" fill={pal.eyeShine} />
              {/* Subtle eyelashes */}
              <Path d={`M${32 - eyeSpacing - 3} ${eyeY - 3} L${32 - eyeSpacing - 4} ${eyeY - 4}`} stroke={pal.eye} strokeWidth="0.8" strokeLinecap="round" />
              <Path d={`M${32 + eyeSpacing + 3} ${eyeY - 3} L${32 + eyeSpacing + 4} ${eyeY - 4}`} stroke={pal.eye} strokeWidth="0.8" strokeLinecap="round" />
            </>
          )}
        </G>
      );
    }

    // Fish - single side-facing eye (profile view)
    if (species === 'fish') {
      return (
        <G>
          <Circle cx={42} cy={34} r="3.5" fill={pal.eye} />
          <Circle cx={43} cy={33} r="1.2" fill={pal.eyeShine} />
        </G>
      );
    }

    // Butterfly - tiny delicate eyes
    if (species === 'butterfly') {
      return (
        <G>
          <Circle cx={32 - 4} cy={28} r="2" fill={pal.eye} />
          <Circle cx={32 + 4} cy={28} r="2" fill={pal.eye} />
        </G>
      );
    }

    // Star - sparkly star eyes
    if (species === 'star') {
      if (mood === 'happy' || mood === 'excited' || mood === 'celebrate') {
        return (
          <G>
            {/* Star-shaped sparkle eyes */}
            <Path d={`M${32 - 8} ${32 - 3} L${32 - 8} ${32 - 1} L${32 - 6} ${32} L${32 - 8} ${32 + 1} L${32 - 8} ${32 + 3} L${32 - 9} ${32 + 1} L${32 - 11} ${32} L${32 - 9} ${32 - 1} Z`} fill={pal.eye} />
            <Path d={`M${32 + 8} ${32 - 3} L${32 + 8} ${32 - 1} L${32 + 10} ${32} L${32 + 8} ${32 + 1} L${32 + 8} ${32 + 3} L${32 + 7} ${32 + 1} L${32 + 5} ${32} L${32 + 7} ${32 - 1} Z`} fill={pal.eye} />
          </G>
        );
      }
      return (
        <G>
          <Circle cx={32 - 8} cy={32} r="2.5" fill={pal.eye} />
          <Circle cx={32 - 8} cy={32 - 1} r="1" fill={pal.eyeShine} />
          <Circle cx={32 + 8} cy={32} r="2.5" fill={pal.eye} />
          <Circle cx={32 + 8} cy={32 - 1} r="1" fill={pal.eyeShine} />
        </G>
      );
    }

    // Carmech - headlight eyes
    if (species === 'carmech') {
      return null; // Eyes already rendered in body as headlights
    }

    // Pixel - square pixelated eyes
    if (species === 'pixel') {
      if (mood === 'happy' || mood === 'excited' || mood === 'celebrate') {
        return (
          <G>
            {/* Happy pixelated eyes - horizontal rectangles */}
            <Rect x={32 - eyeSpacing - 3} y={eyeY - 1} width="6" height="2" fill={pal.eye} />
            <Rect x={32 + eyeSpacing - 3} y={eyeY - 1} width="6" height="2" fill={pal.eye} />
          </G>
        );
      }
      return (
        <G>
          {/* Square pixelated eyes */}
          <Rect x={32 - eyeSpacing - 2} y={eyeY - 2} width="4" height="4" fill={pal.eye} />
          <Rect x={32 - eyeSpacing - 1} y={eyeY - 1} width="2" height="2" fill={pal.eyeShine} />
          <Rect x={32 + eyeSpacing - 2} y={eyeY - 2} width="4" height="4" fill={pal.eye} />
          <Rect x={32 + eyeSpacing - 1} y={eyeY - 1} width="2" height="2" fill={pal.eyeShine} />
        </G>
      );
    }

    // Paper - simple origami-style dot eyes
    if (species === 'paper') {
      if (mood === 'happy' || mood === 'excited' || mood === 'celebrate') {
        return (
          <G>
            {/* V-shaped happy eyes */}
            <Path d={`M${32 - eyeSpacing - 3} ${eyeY - 2} L${32 - eyeSpacing} ${eyeY + 1} L${32 - eyeSpacing + 3} ${eyeY - 2}`} stroke={pal.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
            <Path d={`M${32 + eyeSpacing - 3} ${eyeY - 2} L${32 + eyeSpacing} ${eyeY + 1} L${32 + eyeSpacing + 3} ${eyeY - 2}`} stroke={pal.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          </G>
        );
      }
      return (
        <G>
          {/* Simple dot eyes */}
          <Circle cx={32 - eyeSpacing} cy={eyeY} r="2.5" fill={pal.eye} />
          <Circle cx={32 + eyeSpacing} cy={eyeY} r="2.5" fill={pal.eye} />
        </G>
      );
    }

    // Droplet - water droplet teardrop eyes
    if (species === 'droplet') {
      if (mood === 'happy' || mood === 'excited' || mood === 'celebrate') {
        return (
          <G>
            {/* Happy curved eyes */}
            <Path d={`M${32 - eyeSpacing - 3} ${eyeY} Q${32 - eyeSpacing} ${eyeY - 4} ${32 - eyeSpacing + 3} ${eyeY}`} stroke={pal.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
            <Path d={`M${32 + eyeSpacing - 3} ${eyeY} Q${32 + eyeSpacing} ${eyeY - 4} ${32 + eyeSpacing + 3} ${eyeY}`} stroke={pal.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          </G>
        );
      }
      return (
        <G>
          {/* Teardrop-shaped eyes */}
          <Path d={`M${32 - eyeSpacing} ${eyeY - 3} Q${32 - eyeSpacing + 2} ${eyeY} ${32 - eyeSpacing} ${eyeY + 3} Q${32 - eyeSpacing - 2} ${eyeY} ${32 - eyeSpacing} ${eyeY - 3} Z`} fill={pal.eye} />
          <Circle cx={32 - eyeSpacing + 1} cy={eyeY - 1} r="1" fill={pal.eyeShine} />
          <Path d={`M${32 + eyeSpacing} ${eyeY - 3} Q${32 + eyeSpacing + 2} ${eyeY} ${32 + eyeSpacing} ${eyeY + 3} Q${32 + eyeSpacing - 2} ${eyeY} ${32 + eyeSpacing} ${eyeY - 3} Z`} fill={pal.eye} />
          <Circle cx={32 + eyeSpacing + 1} cy={eyeY - 1} r="1" fill={pal.eyeShine} />
        </G>
      );
    }

    // Slime - gooey oval eyes with multiple shines
    if (species === 'slime') {
      if (mood === 'happy' || mood === 'excited' || mood === 'celebrate') {
        return (
          <G>
            {/* Happy gooey eyes - melted look */}
            <Path d={`M${32 - eyeSpacing - 4} ${eyeY} Q${32 - eyeSpacing} ${eyeY - 3} ${32 - eyeSpacing + 4} ${eyeY} L${32 - eyeSpacing + 3} ${eyeY + 1} L${32 - eyeSpacing - 3} ${eyeY + 1} Z`} fill={pal.eye} />
            <Path d={`M${32 + eyeSpacing - 4} ${eyeY} Q${32 + eyeSpacing} ${eyeY - 3} ${32 + eyeSpacing + 4} ${eyeY} L${32 + eyeSpacing + 3} ${eyeY + 1} L${32 + eyeSpacing - 3} ${eyeY + 1} Z`} fill={pal.eye} />
          </G>
        );
      }
      return (
        <G>
          {/* Gooey oval eyes with multiple shines */}
          <Ellipse cx={32 - eyeSpacing} cy={eyeY} rx="3.5" ry="4.5" fill={pal.eye} />
          <Circle cx={32 - eyeSpacing + 1} cy={eyeY - 1.5} r="1.5" fill={pal.eyeShine} />
          <Circle cx={32 - eyeSpacing - 1} cy={eyeY + 1} r="0.8" fill={pal.eyeShine} opacity="0.7" />
          <Ellipse cx={32 + eyeSpacing} cy={eyeY} rx="3.5" ry="4.5" fill={pal.eye} />
          <Circle cx={32 + eyeSpacing + 1} cy={eyeY - 1.5} r="1.5" fill={pal.eyeShine} />
          <Circle cx={32 + eyeSpacing - 1} cy={eyeY + 1} r="0.8" fill={pal.eyeShine} opacity="0.7" />
        </G>
      );
    }

    // Blob - classic round eyes (default style but kept for clarity)
    switch (mood) {
      case 'idle':
      case 'curious':
        return (
          <G>
            <Ellipse cx={32 - eyeSpacing} cy={eyeY} rx="4" ry={mood === 'curious' ? 5 : 4} fill={pal.eye} />
            <Circle cx={32 - eyeSpacing + 1} cy={eyeY - 1} r="1.5" fill={pal.eyeShine} />
            <Ellipse cx={32 + eyeSpacing} cy={eyeY} rx="4" ry={mood === 'curious' ? 5 : 4} fill={pal.eye} />
            <Circle cx={32 + eyeSpacing + 1} cy={eyeY - 1} r="1.5" fill={pal.eyeShine} />
          </G>
        );

      case 'happy':
        return (
          <G>
            <Path 
              d={`M${32 - eyeSpacing - 4} ${eyeY} Q${32 - eyeSpacing} ${eyeY - 5} ${32 - eyeSpacing + 4} ${eyeY}`} 
              stroke={pal.eye} 
              strokeWidth="2.5" 
              fill="none"
              strokeLinecap="round"
            />
            <Path 
              d={`M${32 + eyeSpacing - 4} ${eyeY} Q${32 + eyeSpacing} ${eyeY - 5} ${32 + eyeSpacing + 4} ${eyeY}`} 
              stroke={pal.eye} 
              strokeWidth="2.5" 
              fill="none"
              strokeLinecap="round"
            />
          </G>
        );

      case 'excited':
        return (
          <G>
            <Ellipse cx={32 - eyeSpacing} cy={eyeY} rx="5" ry="5" fill={pal.eye} />
            <Circle cx={32 - eyeSpacing} cy={eyeY - 1} r="2" fill={pal.eyeShine} />
            <Circle cx={32 - eyeSpacing + 2} cy={eyeY + 1} r="1" fill={pal.eyeShine} />
            <Ellipse cx={32 + eyeSpacing} cy={eyeY} rx="5" ry="5" fill={pal.eye} />
            <Circle cx={32 + eyeSpacing} cy={eyeY - 1} r="2" fill={pal.eyeShine} />
            <Circle cx={32 + eyeSpacing + 2} cy={eyeY + 1} r="1" fill={pal.eyeShine} />
          </G>
        );

      case 'celebrate':
        return (
          <G>
            <Path 
              d={`M${32 - eyeSpacing} ${eyeY - 4} L${32 - eyeSpacing + 1} ${eyeY - 1} L${32 - eyeSpacing + 4} ${eyeY} L${32 - eyeSpacing + 1} ${eyeY + 1} L${32 - eyeSpacing} ${eyeY + 4} L${32 - eyeSpacing - 1} ${eyeY + 1} L${32 - eyeSpacing - 4} ${eyeY} L${32 - eyeSpacing - 1} ${eyeY - 1} Z`}
              fill={pal.eye}
            />
            <Path 
              d={`M${32 + eyeSpacing} ${eyeY - 4} L${32 + eyeSpacing + 1} ${eyeY - 1} L${32 + eyeSpacing + 4} ${eyeY} L${32 + eyeSpacing + 1} ${eyeY + 1} L${32 + eyeSpacing} ${eyeY + 4} L${32 + eyeSpacing - 1} ${eyeY + 1} L${32 + eyeSpacing - 4} ${eyeY} L${32 + eyeSpacing - 1} ${eyeY - 1} Z`}
              fill={pal.eye}
            />
          </G>
        );

      default:
        return (
          <G>
            <Circle cx={32 - eyeSpacing} cy={eyeY} r="3" fill={pal.eye} />
            <Circle cx={32 + eyeSpacing} cy={eyeY} r="3" fill={pal.eye} />
          </G>
        );
    }
  };

  // Render mouth based on mood
  const renderMouth = () => {
    const mouthY = species === 'droplet' ? 42 : species === 'robot' ? 0 : species === 'deer' ? 26 : species === 'fish' ? 40 : species === 'butterfly' ? 32 : species === 'star' ? 40 : 44;

    // Skip mouth for these species (they have mouths built into renderBody)
    if (species === 'robot' || species === 'navi' || species === 'carmech' || species === 'fish' || species === 'butterfly' || species === 'star' || species === 'tiger' || species === 'lion' || species === 'hawk' || species === 'dragon') return null;

    // Deer - gentle smile
    if (species === 'deer') {
      if (mood === 'happy' || mood === 'excited' || mood === 'celebrate') {
        return (
          <Path
            d={`M28 ${mouthY} Q32 ${mouthY + 3} 36 ${mouthY}`}
            stroke={pal.eye}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        );
      }
      return (
        <Path
          d={`M30 ${mouthY} Q32 ${mouthY + 1} 34 ${mouthY}`}
          stroke={pal.eye}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      );
    }

    switch (mood) {
      case 'idle':
        return (
          <Path 
            d={`M28 ${mouthY} Q32 ${mouthY + 2} 36 ${mouthY}`} 
            stroke={pal.eye} 
            strokeWidth="2" 
            fill="none"
            strokeLinecap="round"
          />
        );

      case 'curious':
        return <Ellipse cx="32" cy={mouthY} rx="2" ry="3" fill={pal.eye} />;

      case 'happy':
        return (
          <Path 
            d={`M26 ${mouthY - 2} Q32 ${mouthY + 6} 38 ${mouthY - 2}`} 
            stroke={pal.eye} 
            strokeWidth="2" 
            fill="none"
            strokeLinecap="round"
          />
        );

      case 'excited':
        return (
          <G>
            <Path 
              d={`M26 ${mouthY - 2} Q32 ${mouthY + 8} 38 ${mouthY - 2}`} 
              stroke={pal.eye} 
              strokeWidth="2.5" 
              fill="none"
              strokeLinecap="round"
            />
            <Ellipse cx="32" cy={mouthY + 2} rx="4" ry="3" fill={pal.eye} />
          </G>
        );

      case 'celebrate':
        return (
          <G>
            <Ellipse cx="32" cy={mouthY} rx="6" ry="5" fill={pal.eye} />
            <Ellipse cx="32" cy={mouthY + 2} rx="3" ry="2" fill="#E57373" />
          </G>
        );

      default:
        return (
          <Path 
            d={`M28 ${mouthY} Q32 ${mouthY + 2} 36 ${mouthY}`} 
            stroke={pal.eye} 
            strokeWidth="2" 
            fill="none"
            strokeLinecap="round"
          />
        );
    }
  };

  // Render blush cheeks
  const renderCheeks = () => {
    if (species === 'robot' || species === 'navi') return null;
    
    const cheekY = species === 'droplet' ? 38 : 40;
    const showCheeks = mood === 'happy' || mood === 'excited' || mood === 'celebrate';
    
    if (!showCheeks) return null;

    return (
      <G opacity="0.6">
        <Ellipse cx="22" cy={cheekY} rx="4" ry="2" fill={pal.cheek} />
        <Ellipse cx="42" cy={cheekY} rx="4" ry="2" fill={pal.cheek} />
      </G>
    );
  };

  // Render sparkles for 5+ completions
  const renderSparkles = () => {
    if (completionsToday < 5) return null;

    return (
      <G>
        <Path d="M10 20 L11 22 L13 22 L11.5 23.5 L12 26 L10 24.5 L8 26 L8.5 23.5 L7 22 L9 22 Z" fill="#FFD700" />
        <Path d="M54 18 L55 20 L57 20 L55.5 21.5 L56 24 L54 22.5 L52 24 L52.5 21.5 L51 20 L53 20 Z" fill="#FFD700" />
        <Path d="M50 44 L51 46 L53 46 L51.5 47.5 L52 50 L50 48.5 L48 50 L48.5 47.5 L47 46 L49 46 Z" fill="#FFD700" />
        <Path d="M12 48 L13 50 L15 50 L13.5 51.5 L14 54 L12 52.5 L10 54 L10.5 51.5 L9 50 L11 50 Z" fill="#FFD700" />
      </G>
    );
  };

  // Render hat
  const renderHat = () => {
    // Adjust hat position based on pet species head position/size
    let hatY = 14; // Default for blob, slime, paper
    let hatScale = 1; // Scale multiplier for hat size

    switch (species) {
      case 'droplet':
        hatY = 8; // Top of droplet
        break;
      case 'robot':
        hatY = 4; // Top of robot antenna
        break;
      case 'pixel':
        hatY = 14; // Top of pixel head
        break;
      case 'navi':
        hatY = 18; // Top of navi glow
        break;
      case 'deer':
        hatY = 8; // Above antlers
        hatScale = 0.9; // Slightly smaller for deer
        break;
      case 'fish':
        hatY = 18; // Top of fish
        hatScale = 0.95;
        break;
      case 'butterfly':
        hatY = 16; // Above butterfly head
        hatScale = 0.85; // Smaller for butterfly
        break;
      case 'star':
        hatY = 14; // Top star point
        hatScale = 0.95;
        break;
      case 'carmech':
        hatY = 14; // Top of car
        hatScale = 1.1; // Larger for car
        break;
      case 'tiger':
        hatY = 5; // Above tiger ears
        hatScale = 0.95;
        break;
      case 'lion':
        hatY = -2; // Above lion's large mane
        hatScale = 0.85; // Smaller to fit above mane
        break;
      case 'hawk':
        hatY = 6; // Above hawk crown
        hatScale = 0.9;
        break;
      case 'dragon':
        hatY = 0; // Above dragon horns
        hatScale = 0.85;
        break;
    }

    switch (hat) {
      case 'cap':
        return (
          <G transform={`translate(${32 * (1 - hatScale)}, ${hatY * (1 - hatScale)}) scale(${hatScale})`} origin="32, 32">
            <Ellipse cx="32" cy={hatY + 8} rx="14" ry="4" fill="#1E88E5" />
            <Path d={`M18 ${hatY + 8} Q18 ${hatY} 32 ${hatY} Q46 ${hatY} 46 ${hatY + 8}`} fill="#1E88E5" />
            <Path d={`M46 ${hatY + 8} L56 ${hatY + 10} L54 ${hatY + 14} L46 ${hatY + 10}`} fill="#1565C0" />
          </G>
        );
        
      case 'beanie':
        return (
          <G transform={`translate(${32 * (1 - hatScale)}, ${hatY * (1 - hatScale)}) scale(${hatScale})`} origin="32, 32">
            <Path d={`M18 ${hatY + 10} Q18 ${hatY - 2} 32 ${hatY - 4} Q46 ${hatY - 2} 46 ${hatY + 10}`} fill="#E53935" />
            <Rect x="18" y={hatY + 6} width="28" height="6" fill="#C62828" />
            <Circle cx="32" cy={hatY - 6} r="4" fill="#E53935" />
          </G>
        );

      case 'crown':
        return (
          <G transform={`translate(${32 * (1 - hatScale)}, ${hatY * (1 - hatScale)}) scale(${hatScale})`} origin="32, 32">
            <Path d={`M18 ${hatY + 8} L22 ${hatY - 4} L28 ${hatY + 4} L32 ${hatY - 6} L36 ${hatY + 4} L42 ${hatY - 4} L46 ${hatY + 8} Z`} fill="#FFD700" />
            <Rect x="18" y={hatY + 8} width="28" height="4" fill="#FFC107" />
            <Circle cx="32" cy={hatY - 2} r="2" fill="#E53935" />
            <Circle cx="24" cy={hatY + 2} r="1.5" fill="#2196F3" />
            <Circle cx="40" cy={hatY + 2} r="1.5" fill="#4CAF50" />
          </G>
        );

      case 'wizard':
        return (
          <G transform={`translate(${32 * (1 - hatScale)}, ${hatY * (1 - hatScale)}) scale(${hatScale})`} origin="32, 32">
            <Path d={`M32 ${hatY - 14} L44 ${hatY + 10} L20 ${hatY + 10} Z`} fill="#5E35B1" />
            <Ellipse cx="32" cy={hatY + 10} rx="14" ry="4" fill="#4527A0" />
            <Circle cx="32" cy={hatY - 10} r="3" fill="#FFD700" />
            <Circle cx="28" cy={hatY - 2} r="1.5" fill="#FFD700" />
            <Circle cx="36" cy={hatY + 4} r="1" fill="#FFD700" />
          </G>
        );

      case 'party':
        return (
          <G transform={`translate(${32 * (1 - hatScale)}, ${hatY * (1 - hatScale)}) scale(${hatScale})`} origin="32, 32">
            <Path d={`M32 ${hatY - 12} L42 ${hatY + 10} L22 ${hatY + 10} Z`} fill="#E91E63" />
            <Circle cx="32" cy={hatY - 12} r="3" fill="#FFEB3B" />
            <Path d={`M30 ${hatY - 6} L26 ${hatY + 8}`} stroke="#FFEB3B" strokeWidth="2" />
            <Path d={`M34 ${hatY - 6} L38 ${hatY + 8}`} stroke="#4CAF50" strokeWidth="2" />
          </G>
        );

      case 'tophat':
        return (
          <G transform={`translate(${32 * (1 - hatScale)}, ${hatY * (1 - hatScale)}) scale(${hatScale})`} origin="32, 32">
            <Rect x="22" y={hatY - 8} width="20" height="18" rx="2" fill="#212121" />
            <Ellipse cx="32" cy={hatY + 10} rx="16" ry="4" fill="#212121" />
            <Ellipse cx="32" cy={hatY - 8} rx="10" ry="3" fill="#424242" />
            <Rect x="24" y={hatY + 2} width="16" height="3" fill="#E53935" />
          </G>
        );

      case 'halo':
        return (
          <G transform={`translate(${32 * (1 - hatScale)}, ${hatY * (1 - hatScale)}) scale(${hatScale})`} origin="32, 32">
            <Ellipse cx="32" cy={hatY} rx="16" ry="4" fill="none" stroke="#FFD700" strokeWidth="3" />
            <Ellipse cx="32" cy={hatY} rx="16" ry="4" fill="none" stroke="#FFF59D" strokeWidth="1" />
          </G>
        );

      case 'laurel':
        return (
          <G transform={`translate(${32 * (1 - hatScale)}, ${hatY * (1 - hatScale)}) scale(${hatScale})`} origin="32, 32">
            {/* Laurel wreath - victory crown */}
            <Path d={`M20 ${hatY + 8} Q20 ${hatY - 2} 28 ${hatY - 4} Q32 ${hatY - 6} 36 ${hatY - 4} Q44 ${hatY - 2} 44 ${hatY + 8}`} fill="none" stroke="#4CAF50" strokeWidth="3" />
            <Circle cx="22" cy={hatY + 4} r="2" fill="#66BB6A" />
            <Circle cx="26" cy={hatY - 2} r="2" fill="#66BB6A" />
            <Circle cx="32" cy={hatY - 4} r="2" fill="#FFD700" />
            <Circle cx="38" cy={hatY - 2} r="2" fill="#66BB6A" />
            <Circle cx="42" cy={hatY + 4} r="2" fill="#66BB6A" />
          </G>
        );

      case 'sombrero':
        return (
          <G transform={`translate(${32 * (1 - hatScale)}, ${hatY * (1 - hatScale)}) scale(${hatScale})`} origin="32, 32">
            {/* Mexican sombrero - wide brim hat */}
            <Ellipse cx="32" cy={hatY + 8} rx="22" ry="6" fill="#D84315" />
            <Ellipse cx="32" cy={hatY + 8} rx="18" ry="4" fill="#FF5722" />
            <Path d={`M32 ${hatY - 10} L40 ${hatY + 8} L24 ${hatY + 8} Z`} fill="#FFB74D" />
            <Circle cx="30" cy={hatY + 2} r="1" fill="#4CAF50" />
            <Circle cx="34" cy={hatY + 2} r="1" fill="#E53935" />
            <Circle cx="32" cy={hatY + 4} r="1" fill="#2196F3" />
          </G>
        );

      case 'viking':
        return (
          <G transform={`translate(${32 * (1 - hatScale)}, ${hatY * (1 - hatScale)}) scale(${hatScale})`} origin="32, 32">
            {/* Viking helmet with horns */}
            <Ellipse cx="32" cy={hatY + 8} rx="12" ry="4" fill="#757575" />
            <Path d={`M20 ${hatY + 8} Q20 ${hatY - 4} 32 ${hatY - 6} Q44 ${hatY - 4} 44 ${hatY + 8}`} fill="#9E9E9E" />
            {/* Left horn */}
            <Path d={`M22 ${hatY + 4} Q18 ${hatY - 4} 16 ${hatY - 10}`} fill="none" stroke="#FFF8DC" strokeWidth="3" />
            {/* Right horn */}
            <Path d={`M42 ${hatY + 4} Q46 ${hatY - 4} 48 ${hatY - 10}`} fill="none" stroke="#FFF8DC" strokeWidth="3" />
            {/* Nose guard */}
            <Rect x="30" y={hatY + 8} width="4" height="6" fill="#757575" />
          </G>
        );

      case 'astronaut':
        return (
          <G transform={`translate(${32 * (1 - hatScale)}, ${hatY * (1 - hatScale)}) scale(${hatScale})`} origin="32, 32">
            {/* Space helmet */}
            <Circle cx="32" cy={hatY + 4} r="14" fill="none" stroke="#B0BEC5" strokeWidth="2" />
            <Ellipse cx="32" cy={hatY + 4} rx="12" ry="10" fill="rgba(33, 150, 243, 0.3)" />
            {/* Antenna */}
            <Path d={`M32 ${hatY - 10} L32 ${hatY - 14}`} stroke="#FF5722" strokeWidth="2" />
            <Circle cx="32" cy={hatY - 14} r="2" fill="#FF5722" />
            {/* Reflection */}
            <Ellipse cx="28" cy={hatY} rx="3" ry="4" fill="rgba(255, 255, 255, 0.6)" />
          </G>
        );

      default:
        return null;
    }
  };

  const wiggleInterpolate = wiggleRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3deg', '0deg', '3deg'],
  });

  const headTiltInterpolate = headTilt.interpolate({
    inputRange: [0, 5],
    outputRange: ['0deg', '5deg'],
  });

  // Handle tap interaction
  const handleTap = () => {
    // Bounce animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(tapBounce, {
          toValue: -15,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(tapScale, {
          toValue: 1.1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(tapBounce, {
          toValue: 0,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(tapScale, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Call the original onPress if provided
    if (onPress) {
      onPress();
    }
  };

  const content = (
    <Animated.View
      style={{
        transform: [
          { translateY: Animated.add(Animated.add(bobY, bounceY), tapBounce) },
          { scale: Animated.multiply(Animated.multiply(breatheScale, celebrationScale), tapScale) },
          { rotate: Animated.add(wiggleInterpolate as any, headTiltInterpolate as any) },
        ],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {renderBody()}
        <AnimatedG opacity={blinkOpacity}>
          {renderEyes()}
        </AnimatedG>
        {renderMouth()}
        {renderCheeks()}
        {renderHat()}
        {renderSparkles()}
      </Svg>
    </Animated.View>
  );

  // Always wrap in TouchableOpacity if we want tap interactions
  return (
    <TouchableOpacity
      onPress={handleTap}
      style={styles.container}
      activeOpacity={0.8}
      disabled={!onPress && size <= 32} // Disable tap for small pets (previews)
    >
      {content}
    </TouchableOpacity>
  );
}

// Helper to determine mood based on completion percentage
export function getMoodFromProgress(percent: number): PetMood {
  if (percent >= 1) return 'celebrate';
  if (percent >= 0.75) return 'excited';
  if (percent >= 0.5) return 'happy';
  if (percent >= 0.25) return 'curious';
  return 'idle';
}

// Helper to get unlocked hats based on total completions
export function getUnlockedHats(totalCompletions: number): HatType[] {
  const hats: HatType[] = ['none'];

  // First week - unlock hats every 1-2 days to encourage engagement
  if (totalCompletions >= 1) hats.push('cap');
  if (totalCompletions >= 3) hats.push('beanie');
  if (totalCompletions >= 5) hats.push('party');
  if (totalCompletions >= 7) hats.push('tophat');

  // Second week
  if (totalCompletions >= 10) hats.push('wizard');
  if (totalCompletions >= 14) hats.push('crown');

  // Third week and beyond
  if (totalCompletions >= 21) hats.push('halo');
  if (totalCompletions >= 30) hats.push('laurel');
  if (totalCompletions >= 45) hats.push('sombrero');
  if (totalCompletions >= 60) hats.push('viking');
  if (totalCompletions >= 100) hats.push('astronaut');

  return hats;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

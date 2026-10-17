// ============================================
// EVOLUTION MODAL
// ============================================
// Shown once each time the pet reaches a new stage. The stage is permanent,
// so this is a real milestone — make it feel like one.
// ============================================

import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../theme';
import { Pet } from './Pet';
import { PetSpecies, HatType } from '../types';
import { STAGE_NAMES, STAGE_THRESHOLDS, PetStage } from '../utils/evolution';
import { petSubject } from '../utils/petName';

interface Props {
  visible: boolean;
  species: PetSpecies;
  hat: HatType;
  stage: PetStage;
  petName?: string;
  onClose: () => void;
}

const blurb = (stage: PetStage, who: string): string =>
  ({
    0: '',
    1: `A week of showing up. ${who} has stopped wondering whether you'll come back — it knows.`,
    2: `Thirty days. This isn't a streak anymore, it's who you are. ${who} glows with it.`,
    3: `One hundred days. Almost nobody gets here. ${who} is a legend, and so are you.`,
  })[stage];

export function EvolutionModal({ visible, species, hat, stage, petName, onClose }: Props) {
  const who = petSubject(petName);
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.6);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  if (stage === 0) return null;
  const threshold = STAGE_THRESHOLDS[stage - 1];
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider, opacity, transform: [{ scale }] }]}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>EVOLUTION</Text>
          <View style={styles.petWrap}>
            <Animated.View style={[styles.glow, { backgroundColor: stage >= 3 ? '#FFD700' : colors.accent, opacity: glowOpacity }]} />
            <Pet species={species} mood="celebrate" hat={hat} size={120} stage={stage} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{who} is now a {STAGE_NAMES[stage]}</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>{threshold}-day streak reached</Text>
          <Text style={[styles.body, { color: colors.text }]}>{blurb(stage, who)}</Text>
          <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={onClose}>
            <Text style={[styles.buttonText, { color: colors.textOnAccent }]}>Keep going</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 380, borderRadius: 28, borderWidth: 1, padding: 28, alignItems: 'center' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  petWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  glow: { position: 'absolute', width: 150, height: 150, borderRadius: 75 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 14, marginTop: 4, marginBottom: 14 },
  body: { fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 22 },
  button: { paddingVertical: 13, paddingHorizontal: 32, borderRadius: 999 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});

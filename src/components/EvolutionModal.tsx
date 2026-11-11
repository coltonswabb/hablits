// ============================================
// EVOLUTION SCREEN
// ============================================
// Shown once each time the pet reaches a new stage. The stage is permanent,
// so this is a real milestone and gets the whole screen:
//
//   the old form, stirring → a flash of light → the new form and its name
//
// For pets with an evolution line the pet really changes shape here. For the
// rest, the old and new drawing are the same and only the title changes.
// Reduce Motion: no stirring and no flash, just a cross-fade.
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../theme';
import { Pet } from './Pet';
import { TouchableScale } from './TouchableScale';
import { PetSpecies, HatType } from '../types';
import { STAGE_NAMES, STAGE_THRESHOLDS, PetStage } from '../utils/evolution';
import { petSubject } from '../utils/petName';
import { ShareCard, canShare } from './ShareCard';
import { BRANCH_REASON, BRANCH_STAGE, hasEvolutionLine, PetBranch, petForm } from '../pets/forms';
import { useReduceMotion } from '../utils/motion';
import { successTap } from '../utils/haptics';
import { radii, fontSizes } from '../theme/tokens';

interface Props {
  visible: boolean;
  species: PetSpecies;
  hat: HatType;
  stage: PetStage;
  /** Which way the pet evolved; null before the adult stage */
  branch: PetBranch | null;
  petName?: string;
  onClose: () => void;
}

const PET_SIZE = 168;
const BACKDROP = '#0B0B14';
const STIR_MS = 260;
const FLASH_IN_MS = 220;
const FLASH_OUT_MS = 520;

const blurb = (stage: PetStage, who: string): string =>
  ({
    0: '',
    1: `A week of showing up. ${who} has stopped wondering whether you'll come back. It knows.`,
    2: `Thirty days. This isn't a streak anymore, it's who you are.`,
    3: `One hundred days. Almost nobody gets here. ${who} is a legend, and so are you.`,
  })[stage];

export function EvolutionModal({ visible, species, hat, stage, branch, petName, onClose }: Props) {
  const who = petSubject(petName);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  // The new form is only drawn once the flash covers the screen
  const [revealed, setRevealed] = useState(false);

  const oldOpacity = useRef(new Animated.Value(1)).current;
  const stir = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const newOpacity = useRef(new Animated.Value(0)).current;
  const newScale = useRef(new Animated.Value(0.96)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textRise = useRef(new Animated.Value(12)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setRevealed(false);
    oldOpacity.setValue(1);
    stir.setValue(1);
    flash.setValue(0);
    newOpacity.setValue(0);
    newScale.setValue(0.96);
    textOpacity.setValue(0);
    textRise.setValue(reduceMotion ? 0 : 12);

    const timing = (v: Animated.Value, toValue: number, duration: number, easing = Easing.out(Easing.quad)) =>
      Animated.timing(v, { toValue, duration, easing, useNativeDriver: true });

    const showText = Animated.parallel([timing(textOpacity, 1, 300), timing(textRise, 0, 300)]);

    let sequence: Animated.CompositeAnimation;
    if (reduceMotion) {
      setRevealed(true);
      newScale.setValue(1);
      sequence = Animated.sequence([
        Animated.delay(500),
        Animated.parallel([timing(oldOpacity, 0, 300), timing(newOpacity, 1, 300)]),
        showText,
      ]);
    } else {
      // A fresh animation each time: one instance cannot be played twice in a sequence
      const stirOnce = (peak: number, speed: number) =>
        Animated.sequence([timing(stir, peak, STIR_MS * speed), timing(stir, 1, STIR_MS * speed)]);
      sequence = Animated.sequence([
        Animated.delay(400),
        // The old form stirs, faster each time
        stirOnce(1.08, 1),
        stirOnce(1.08, 1),
        stirOnce(1.12, 0.7),
        // Light fills the screen and the swap happens behind it
        timing(flash, 1, FLASH_IN_MS, Easing.in(Easing.quad)),
      ]);
    }

    sequence.start(({ finished }) => {
      if (!finished || reduceMotion) return;
      setRevealed(true);
      oldOpacity.setValue(0);
      newOpacity.setValue(1);
      successTap();
      Animated.sequence([
        Animated.parallel([timing(flash, 0, FLASH_OUT_MS), timing(newScale, 1, FLASH_OUT_MS)]),
        showText,
      ]).start();
    });

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    glowLoop.start();
    return () => {
      sequence.stop();
      glowLoop.stop();
    };
  }, [visible]);

  if (stage === 0) return null;

  const previousStage = (stage - 1) as PetStage;
  const threshold = STAGE_THRESHOLDS[stage - 1];
  const hasLine = hasEvolutionLine(species);
  const formName = petForm(species, stage, branch)?.name;
  const headline = hasLine && formName ? `${who} evolved into ${formName}!` : `${who} is now a ${STAGE_NAMES[stage]}`;
  // Say why it went this way, the first time the path shows
  const reason = hasLine && stage === BRANCH_STAGE && branch ? BRANCH_REASON[branch] : null;
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] });

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.screen}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>EVOLUTION</Text>

        <View style={styles.petStage}>
          <Animated.View style={[styles.glow, { backgroundColor: stage >= 3 ? '#FFD700' : colors.accent, opacity: Animated.multiply(newOpacity, glowOpacity) }]} />
          {/* The form it was */}
          <Animated.View style={[styles.petLayer, { opacity: oldOpacity, transform: [{ scale: stir }] }]}>
            <Pet species={species} mood="idle" hat={hat} size={PET_SIZE} stage={previousStage} branch={branch} isStatic />
          </Animated.View>
          {/* The form it is now */}
          {revealed && (
            <Animated.View style={[styles.petLayer, { opacity: newOpacity, transform: [{ scale: newScale }] }]}>
              <Pet species={species} mood="celebrate" hat={hat} size={PET_SIZE} stage={stage} branch={branch} />
            </Animated.View>
          )}
        </View>

        <Animated.View style={[styles.text, { opacity: textOpacity, transform: [{ translateY: textRise }] }]}>
          <Text style={styles.title}>{headline}</Text>
          <Text style={styles.sub}>{threshold}-day streak reached</Text>
          {reason && <Text style={[styles.reason, { color: colors.accent }]}>{reason}</Text>}
          <Text style={styles.body}>{blurb(stage, who)}</Text>
          <View style={styles.buttons}>
            {canShare && (
              <ShareCard
                content={{ eyebrow: 'EVOLUTION', headline, stat: `${threshold}-day streak`, mood: 'celebrate' }}
                species={species}
                hat={hat}
                stage={stage}
              />
            )}
            <TouchableScale style={[styles.button, { backgroundColor: colors.accent }]} onPress={onClose} accessibilityRole="button">
              <Text style={[styles.buttonText, { color: colors.textOnAccent }]}>Keep going</Text>
            </TouchableScale>
          </View>
        </Animated.View>

        {/* The flash of light that hides the change */}
        <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BACKDROP, alignItems: 'center', justifyContent: 'center', padding: 28 },
  eyebrow: { fontSize: fontSizes.xs, fontWeight: '800', letterSpacing: 3, marginBottom: 24 },
  petStage: { width: PET_SIZE + 40, height: PET_SIZE + 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  petLayer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: PET_SIZE + 20, height: PET_SIZE + 20, borderRadius: radii.pill },
  text: { alignItems: 'center', maxWidth: 360 },
  title: { fontSize: fontSizes.xxl, fontWeight: '800', textAlign: 'center', color: '#FFFFFF' },
  sub: { fontSize: fontSizes.sm, marginTop: 6, marginBottom: 14, color: '#A9ABBD' },
  reason: { fontSize: fontSizes.sm, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  body: { fontSize: fontSizes.md, lineHeight: 23, textAlign: 'center', marginBottom: 24, color: '#E7E8F2' },
  buttons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  button: { paddingVertical: 13, paddingHorizontal: 32, borderRadius: radii.pill },
  buttonText: { fontSize: fontSizes.md, fontWeight: '700' },
  flash: { ...StyleSheet.absoluteFill, backgroundColor: '#FFFFFF' },
});

// ============================================
// EVOLUTION SCREEN
// ============================================
// Shown once each time the pet reaches a new stage. The stage is permanent,
// so this is a real milestone and gets the whole screen:
//
//   the old form stirs → it turns into a glowing white silhouette →
//   the silhouette flickers between the old shape and the new one, faster
//   and faster → a flash of light → the new form in colour, and its name
//
// At the adult stage the pet's path splits three ways. The sequence pauses on
// the glowing silhouette and asks which way it should grow, with the path the
// owner's habits point to marked as suggested.
//
// Reduce Motion: no stirring, flicker or flash, just cross-fades.
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../theme';
import { Pet } from './Pet';
import { TouchableScale } from './TouchableScale';
import { PetSpecies, HatType } from '../types';
import { STAGE_THRESHOLDS, PetStage } from '../utils/evolution';
import { petSubject } from '../utils/petName';
import { ShareCard, canShare } from './ShareCard';
import { BRANCH_HINT, BRANCH_LABEL, BRANCH_REASON, BRANCH_STAGE, PET_BRANCHES, PetBranch, petForm } from '../pets/forms';
import { useReduceMotion } from '../utils/motion';
import { selectionTap, successTap } from '../utils/haptics';
import { radii, fontSizes } from '../theme/tokens';

interface Props {
  visible: boolean;
  species: PetSpecies;
  hat: HatType;
  stage: PetStage;
  /** The path the pet is on. At the adult stage this is the suggestion, which the owner can change here. */
  branch: PetBranch | null;
  petName?: string;
  /** The owner picked a path on this screen */
  onChooseBranch?: (branch: PetBranch) => void;
  onClose: () => void;
}

type Phase = 'intro' | 'choose' | 'morph' | 'done';

const PET_SIZE = 168;
const CHOICE_PET_SIZE = 64;
const BACKDROP = '#0B0B14';
const LIGHT = '#FFFFFF';
const STIR_MS = 260;
const TO_LIGHT_MS = 420;
const FLASH_IN_MS = 200;
const FLASH_OUT_MS = 560;
/** How long each flicker between the old shape and the new one lasts; they speed up */
const FLICKER_MS = [340, 280, 220, 170, 130, 100, 80];

const blurb = (stage: PetStage, who: string): string =>
  ({
    0: '',
    1: `Day one, done. ${who} grew because you showed up. Come back tomorrow and it keeps growing.`,
    2: `Three days in a row. ${who} is picking up your rhythm. Four more and it reaches its final form.`,
    3: `A full week. ${who} is a legend now, and you kept every day of it.`,
  })[stage];

export function EvolutionModal({ visible, species, hat, stage, branch, petName, onChooseBranch, onClose }: Props) {
  const who = petSubject(petName);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const [phase, setPhase] = useState<Phase>('intro');
  // The path shown on this screen: the suggestion until the owner picks one
  const [picked, setPicked] = useState<PetBranch | null>(branch);
  // The path the habits pointed to when this screen opened. Picking another
  // changes `branch` itself, so it is remembered here.
  const [suggested, setSuggested] = useState<PetBranch | null>(branch);
  const path = picked ?? branch;
  const asksForPath = stage === BRANCH_STAGE;

  const oldOpacity = useRef(new Animated.Value(1)).current;
  const oldLight = useRef(new Animated.Value(0)).current;
  const newLight = useRef(new Animated.Value(0)).current;
  const newOpacity = useRef(new Animated.Value(0)).current;
  const petScale = useRef(new Animated.Value(1)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const haloPulse = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const choiceOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textRise = useRef(new Animated.Value(12)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);

  const timing = (v: Animated.Value, toValue: number, duration: number, easing = Easing.out(Easing.quad)) =>
    Animated.timing(v, { toValue, duration, easing, useNativeDriver: true });

  const play = (animation: Animated.CompositeAnimation, then?: () => void) => {
    running.current = animation;
    animation.start(({ finished }) => finished && then?.());
  };

  const showText = () => {
    setPhase('done');
    play(Animated.parallel([timing(textOpacity, 1, 300), timing(textRise, 0, 300)]));
  };

  // The glowing shape becomes the new form
  const morph = () => {
    setPhase('morph');
    if (reduceMotion) {
      petScale.setValue(1);
      play(Animated.parallel([timing(oldLight, 0, 300), timing(oldOpacity, 0, 300), timing(newOpacity, 1, 300)]), showText);
      return;
    }
    // Old shape, new shape, old shape… each swap quicker than the last
    const flickers = FLICKER_MS.map((ms, i) => {
      const toNew = i % 2 === 0;
      return Animated.parallel([
        timing(oldLight, toNew ? 0 : 1, ms, Easing.inOut(Easing.quad)),
        timing(newLight, toNew ? 1 : 0, ms, Easing.inOut(Easing.quad)),
        timing(petScale, toNew ? 1.1 : 0.96, ms, Easing.inOut(Easing.quad)),
      ]);
    });
    play(
      Animated.sequence([
        timing(choiceOpacity, 0, 150),
        ...flickers,
        // Light fills the screen and the colour arrives behind it
        Animated.parallel([timing(flash, 1, FLASH_IN_MS, Easing.in(Easing.quad)), timing(petScale, 1.18, FLASH_IN_MS)]),
      ]),
      () => {
        oldLight.setValue(0);
        newLight.setValue(0);
        newOpacity.setValue(1);
        successTap();
        play(
          Animated.parallel([
            timing(flash, 0, FLASH_OUT_MS),
            Animated.spring(petScale, { toValue: 1, stiffness: 180, damping: 16, mass: 1, useNativeDriver: true }),
            timing(halo, 0.6, FLASH_OUT_MS),
          ]),
          showText
        );
      }
    );
  };

  useEffect(() => {
    if (!visible) return;
    setPhase('intro');
    setPicked(branch);
    setSuggested(branch);
    oldOpacity.setValue(1);
    oldLight.setValue(0);
    newLight.setValue(0);
    newOpacity.setValue(0);
    petScale.setValue(1);
    halo.setValue(0);
    flash.setValue(0);
    choiceOpacity.setValue(0);
    textOpacity.setValue(0);
    textRise.setValue(reduceMotion ? 0 : 12);

    const afterIntro = () => {
      if (!asksForPath) return morph();
      setPhase('choose');
      play(timing(choiceOpacity, 1, 300));
    };

    if (reduceMotion) {
      play(Animated.delay(500), afterIntro);
    } else {
      // A fresh animation each time: one instance cannot be played twice in a sequence
      const stirOnce = (peak: number, speed: number) =>
        Animated.sequence([timing(petScale, peak, STIR_MS * speed), timing(petScale, 1, STIR_MS * speed)]);
      play(
        Animated.sequence([
          Animated.delay(400),
          stirOnce(1.08, 1),
          stirOnce(1.1, 0.8),
          // The colour drains into light and a glow swells behind it
          Animated.parallel([
            timing(oldLight, 1, TO_LIGHT_MS, Easing.inOut(Easing.quad)),
            timing(oldOpacity, 0, TO_LIGHT_MS, Easing.in(Easing.quad)),
            timing(halo, 1, TO_LIGHT_MS),
          ]),
        ]),
        afterIntro
      );
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(haloPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(haloPulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    if (!reduceMotion) pulse.start();
    return () => {
      running.current?.stop();
      pulse.stop();
    };
  }, [visible]);

  if (stage === 0) return null;

  const choose = (choice: PetBranch) => {
    if (phase !== 'choose') return;
    selectionTap();
    setPicked(choice);
    if (choice !== suggested) onChooseBranch?.(choice);
    morph();
  };

  const previousStage = (stage - 1) as PetStage;
  const threshold = STAGE_THRESHOLDS[stage - 1];
  const milestone = threshold === 1 ? 'First day done' : `${threshold}-day streak`;
  const formName = petForm(species, stage, path)?.name;
  const headline = `${who} evolved into ${formName}!`;
  // Say why it went this way, when it went the way the habits pointed
  const reason = asksForPath && path && path === suggested ? BRANCH_REASON[path] : null;
  const haloColor = stage >= 3 ? '#FFD700' : colors.accent;
  const haloScale = haloPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const drawNew = phase === 'morph' || phase === 'done';

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.screen}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>EVOLUTION</Text>

        <View style={styles.petStage}>
          {/* Two soft rings of light behind the pet */}
          <Animated.View
            style={[styles.halo, styles.haloOuter, { backgroundColor: haloColor, opacity: Animated.multiply(halo, 0.16), transform: [{ scale: haloScale }] }]}
          />
          <Animated.View
            style={[styles.halo, { backgroundColor: haloColor, opacity: Animated.multiply(halo, 0.34), transform: [{ scale: haloScale }] }]}
          />
          <Animated.View style={[styles.petLayer, { transform: [{ scale: petScale }] }]}>
            {/* The form it was, in colour and then as light */}
            <Animated.View style={[styles.petLayer, { opacity: oldOpacity }]}>
              <Pet species={species} mood="idle" hat={hat} size={PET_SIZE} stage={previousStage} branch={path} isStatic />
            </Animated.View>
            <Animated.View style={[styles.petLayer, { opacity: oldLight }]}>
              <Pet species={species} mood="idle" hat={hat} size={PET_SIZE} stage={previousStage} branch={path} silhouette={LIGHT} isStatic />
            </Animated.View>
            {/* The form it is becoming, as light and then in colour */}
            {drawNew && (
              <>
                <Animated.View style={[styles.petLayer, { opacity: newLight }]}>
                  <Pet species={species} mood="idle" hat={hat} size={PET_SIZE} stage={stage} branch={path} silhouette={LIGHT} isStatic />
                </Animated.View>
                <Animated.View style={[styles.petLayer, { opacity: newOpacity }]}>
                  <Pet species={species} mood="celebrate" hat={hat} size={PET_SIZE} stage={stage} branch={path} />
                </Animated.View>
              </>
            )}
          </Animated.View>
        </View>

        <View style={styles.below}>
          {/* Which way should it grow? */}
          {/* Stays mounted while it fades out: unmounting a view stops the animation on its value, which would halt the whole sequence */}
          {asksForPath && phase !== 'done' && (
            <Animated.View
              pointerEvents={phase === 'choose' ? 'auto' : 'none'}
              style={[styles.text, styles.overlay, { opacity: choiceOpacity }]}
            >
              <Text style={styles.title}>Choose its path</Text>
              <Text style={styles.sub}>{who} is ready to grow. Which way?</Text>
              <View style={styles.choices}>
                {PET_BRANCHES.map((choice) => (
                  <TouchableScale
                    key={choice}
                    style={[styles.choice, { borderColor: choice === suggested ? colors.accent : '#2A2B3D' }]}
                    onPress={() => choose(choice)}
                    accessibilityRole="button"
                    accessibilityLabel={`${BRANCH_LABEL[choice]} path: ${petForm(species, stage, choice)?.name}. ${BRANCH_HINT[choice]}${choice === suggested ? '. Suggested' : ''}`}
                  >
                    <View pointerEvents="none">
                      <Pet species={species} mood="idle" hat={hat} size={CHOICE_PET_SIZE} stage={stage} branch={choice} isStatic />
                    </View>
                    <Text style={styles.choiceName}>{petForm(species, stage, choice)?.name}</Text>
                    <Text style={styles.choiceHint}>{BRANCH_HINT[choice]}</Text>
                    <Text style={[styles.choiceTag, { color: colors.accent, opacity: choice === suggested ? 1 : 0 }]}>Suggested</Text>
                  </TouchableScale>
                ))}
              </View>
            </Animated.View>
          )}

          <Animated.View
            pointerEvents={phase === 'done' ? 'auto' : 'none'}
            style={[styles.text, { opacity: textOpacity, transform: [{ translateY: textRise }] }]}
          >
            <Text style={styles.title}>{headline}</Text>
            <Text style={styles.sub}>{threshold === 1 ? milestone : `${milestone} reached`}</Text>
            {reason && <Text style={[styles.reason, { color: colors.accent }]}>{reason}</Text>}
            <Text style={styles.body}>{blurb(stage, who)}</Text>
            <View style={styles.buttons}>
              {canShare && (
                <ShareCard
                  content={{ eyebrow: 'EVOLUTION', headline, stat: milestone, mood: 'celebrate' }}
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
        </View>

        {/* The flash of light that hides the change */}
        <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Laid out from the top so the pet stays put while the words under it change
  screen: { flex: 1, backgroundColor: BACKDROP, alignItems: 'center', padding: 20, paddingTop: '22%' },
  eyebrow: { fontSize: fontSizes.xs, fontWeight: '800', letterSpacing: 3, marginBottom: 24 },
  petStage: { width: PET_SIZE + 80, height: PET_SIZE + 80, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  petLayer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: PET_SIZE + 10, height: PET_SIZE + 10, borderRadius: radii.pill },
  haloOuter: { width: PET_SIZE + 76, height: PET_SIZE + 76 },
  below: { alignSelf: 'stretch', alignItems: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, maxWidth: undefined },
  text: { alignItems: 'center', maxWidth: 360 },
  title: { fontSize: fontSizes.xxl, fontWeight: '800', textAlign: 'center', color: '#FFFFFF' },
  sub: { fontSize: fontSizes.sm, marginTop: 6, marginBottom: 14, color: '#A9ABBD', textAlign: 'center' },
  reason: { fontSize: fontSizes.sm, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  body: { fontSize: fontSizes.md, lineHeight: 23, textAlign: 'center', marginBottom: 24, color: '#E7E8F2' },
  buttons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  button: { paddingVertical: 13, paddingHorizontal: 32, borderRadius: radii.pill },
  buttonText: { fontSize: fontSizes.md, fontWeight: '700' },
  choices: { flexDirection: 'row', gap: 8, alignSelf: 'stretch', justifyContent: 'center' },
  choice: {
    flex: 1,
    maxWidth: 124,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: radii.lg,
    borderWidth: 2,
    backgroundColor: '#15162A',
  },
  choiceName: { fontSize: fontSizes.sm, fontWeight: '800', color: '#FFFFFF', marginTop: 8, textAlign: 'center' },
  choiceHint: { fontSize: fontSizes.xs, color: '#A9ABBD', marginTop: 2, textAlign: 'center' },
  choiceTag: { fontSize: fontSizes.xs, fontWeight: '800', marginTop: 6 },
  flash: { ...StyleSheet.absoluteFill, backgroundColor: '#FFFFFF' },
});

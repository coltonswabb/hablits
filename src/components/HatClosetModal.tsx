// ============================================
// HAT CLOSET MODAL
// ============================================
// Modal for selecting pet hats and species.
// Shows unlocked hats based on progress.
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  Easing,
  TextInput,
} from 'react-native';
import { PetSpecies, HatType } from '../types';
import { useTheme } from '../theme';
import { Pet, getUnlockedHats } from './Pet';
import { STAGE_NAMES, STAGE_THRESHOLDS, daysToNextStage } from '../utils/evolution';
import { MAX_PET_NAME } from '../utils/petName';
import { radii, fontSizes } from '../theme/tokens';
import { isReduceMotion } from '../utils/motion';
import { BRANCH_HINT, BRANCH_STAGE, PET_BRANCHES, PetBranch, petForm } from '../pets/forms';

interface HatClosetModalProps {
  visible: boolean;
  currentSpecies: PetSpecies;
  currentHat: HatType;
  totalCompletions: number;
  /** The form on show (stage 0-3) and the best streak behind it */
  petStage?: number;
  /** How far the pet has grown. Any form up to here can be put on show. */
  earnedStage?: number;
  onSelectStage?: (stage: number) => void;
  bestStreak?: number;
  petName?: string;
  onRenamePet?: (name: string) => void;
  onSelectSpecies: (species: PetSpecies) => void;
  onSelectHat: (hat: HatType) => void;
  /** The path the pet is on, once it has reached the adult stage */
  petBranch?: PetBranch | null;
  onSelectBranch?: (branch: PetBranch) => void;
  onClose: () => void;
}

const ALL_SPECIES: PetSpecies[] = ['blob', 'pixel', 'paper', 'robot', 'droplet', 'slime', 'carmech', 'navi', 'fish', 'butterfly', 'star', 'deer', 'tiger', 'lion', 'hawk', 'dragon', 'delilah'];
const FORM_STAGES = [0, 1, 2, 3] as const;
const ALL_HATS: HatType[] = ['none', 'cap', 'beanie', 'party', 'tophat', 'wizard', 'crown', 'halo', 'laurel', 'sombrero', 'viking', 'astronaut'];

const HAT_UNLOCK_REQUIREMENTS: Record<HatType, number> = {
  none: 0,
  cap: 1,
  beanie: 3,
  party: 5,
  tophat: 7,
  wizard: 10,
  crown: 14,
  halo: 21,
  laurel: 30,
  sombrero: 45,
  viking: 60,
  astronaut: 100,
  // Unimplemented hats - not shown
  visor: 999,
  beret: 999,
  fedora: 999,
  snapback: 999,
  flatcap: 999,
  jester: 999,
  cone: 999,
  bowler: 999,
  sorcerer: 999,
  mage: 999,
  tiara: 999,
  safari: 999,
  straw: 999,
  circlet: 999,
  sun: 999,
};

/**
 * A pet in a picker tile. Touches pass straight through to the tile, so
 * tapping the pet picks it, and the pet pops once when it becomes the choice.
 */
function TilePet({ selected, children }: { selected: boolean; children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const wasSelected = useRef(selected);

  useEffect(() => {
    const justSelected = selected && !wasSelected.current;
    wasSelected.current = selected;
    if (!justSelected || isReduceMotion()) return;
    scale.setValue(1.3);
    Animated.spring(scale, { toValue: 1, stiffness: 320, damping: 14, mass: 1, useNativeDriver: true }).start();
  }, [selected, scale]);

  return (
    <Animated.View pointerEvents="none" style={{ transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
}

export function HatClosetModal({
  visible,
  currentSpecies,
  currentHat,
  totalCompletions,
  petStage = 0,
  earnedStage = petStage,
  onSelectStage,
  bestStreak = 0,
  petName = '',
  onRenamePet,
  onSelectSpecies,
  onSelectHat,
  petBranch = null,
  onSelectBranch,
  onClose,
}: HatClosetModalProps) {
  const { colors, radius } = useTheme();
  const [nameDraft, setNameDraft] = useState(petName);
  useEffect(() => setNameDraft(petName), [petName, visible]);
  // The path tiles show a form where paths differ, even while a baby is on show
  const pathStage = Math.max(petStage, BRANCH_STAGE);
  const unlockedHats = getUnlockedHats(totalCompletions);
  // How many hats were unlocked the last time the closet was open. Unknown
  // until it has been opened once: counting from before the saved data loads
  // made every first open look like a new unlock.
  const previousUnlockedCount = useRef<number | null>(null);

  // Entrance animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.96)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Celebration animation for newly unlocked hat
  const celebrationScale = useRef(new Animated.Value(1)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Check if new hat was unlocked
      const hasNewUnlock = previousUnlockedCount.current !== null && unlockedHats.length > previousUnlockedCount.current;

      if (hasNewUnlock) {
        // Play celebration animation
        Animated.sequence([
          Animated.parallel([
            Animated.spring(celebrationScale, {
              toValue: 1.2,
              tension: 100,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.timing(celebrationOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.spring(celebrationScale, {
              toValue: 1,
              tension: 200,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.timing(celebrationOpacity, {
              toValue: 0,
              duration: 400,
              delay: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }

      // Update previous count
      previousUnlockedCount.current = unlockedHats.length;

      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Solid almost at once: a slow fade is what let the app show through
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset for next opening
      backdropOpacity.setValue(0);
      modalScale.setValue(0.96);
      modalOpacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* The dim fades in on its own layer. The card sits above it and is
            solid from its first frame, so the app never shows through it. */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: colors.card,
              borderColor: colors.divider,
              borderRadius: radius.lg,
              opacity: modalOpacity,
              transform: [{ scale: modalScale }],
            }
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>Hat Closet</Text>
          
          {/* Current Pet Preview */}
          <View style={[styles.preview, { backgroundColor: colors.bg, borderColor: colors.divider }]}>
            <Pet species={currentSpecies} mood="happy" hat={currentHat} size={80} stage={petStage} />
            <TextInput
              style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.divider }]}
              value={nameDraft}
              onChangeText={(t) => {
                const next = t.slice(0, MAX_PET_NAME);
                setNameDraft(next);
                onRenamePet?.(next); // reducer trims; committing live means closing can't lose it
              }}
              placeholder="Name your pet"
              placeholderTextColor={colors.muted}
              maxLength={MAX_PET_NAME}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              accessibilityLabel="Pet name"
            />
            <Text style={[styles.previewLabel, { color: colors.text, fontWeight: '700' }]}>
              {STAGE_NAMES[earnedStage]}
            </Text>
            <Text style={[styles.previewLabel, { color: colors.muted }]}>
              {(() => {
                const next = daysToNextStage(bestStreak);
                return next
                  ? `${next.needed} more streak day${next.needed === 1 ? '' : 's'} to ${STAGE_NAMES[next.nextStage]}`
                  : 'Max stage reached';
              })()}
              {'  ·  '}{totalCompletions} completions
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Form: every stage of this pet. Earned ones can be worn again. */}
            {onSelectStage && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Form</Text>
                <View style={styles.grid}>
                  {FORM_STAGES.map((formStage) => {
                    const isEarned = formStage <= earnedStage;
                    const isShown = formStage === petStage;
                    const name = petForm(currentSpecies, formStage, petBranch)?.name ?? STAGE_NAMES[formStage];
                    const unlockDay = STAGE_THRESHOLDS[formStage - 1];
                    return (
                      <Pressable
                        key={formStage}
                        style={({ pressed }) => [
                          styles.gridItem,
                          { backgroundColor: colors.bg, borderColor: colors.divider },
                          isShown && { borderColor: colors.accent, borderWidth: 2 },
                          isEarned && { transform: [{ scale: pressed ? 0.92 : 1 }] },
                        ]}
                        onPress={() => isEarned && onSelectStage(formStage)}
                        disabled={!isEarned}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isShown, disabled: !isEarned }}
                        accessibilityLabel={isEarned ? name : `Locked form. Unlocks at a ${unlockDay}-day streak`}
                      >
                        <TilePet selected={isShown}>
                          <Pet
                            species={currentSpecies}
                            mood="idle"
                            hat="none"
                            size={40}
                            stage={formStage}
                            silhouette={isEarned ? undefined : colors.divider}
                          />
                        </TilePet>
                        <Text style={[styles.gridItemLabel, { color: isEarned ? colors.text : colors.muted }]}>
                          {isEarned ? name : `Day ${unlockDay}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Path: which way the pet grew. Only once it has grown that far. */}
            {earnedStage >= BRANCH_STAGE && onSelectBranch && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Path</Text>
                <View style={styles.grid}>
                  {PET_BRANCHES.map((branch) => (
                    <Pressable
                      key={branch}
                      style={({ pressed }) => [
                        styles.gridItem,
                        { backgroundColor: colors.bg, borderColor: colors.divider },
                        petBranch === branch && { borderColor: colors.accent, borderWidth: 2 },
                        { transform: [{ scale: pressed ? 0.92 : 1 }] },
                      ]}
                      onPress={() => onSelectBranch(branch)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: petBranch === branch }}
                      accessibilityLabel={`${petForm(currentSpecies, pathStage, branch)?.name}. ${BRANCH_HINT[branch]}`}
                    >
                      <TilePet selected={petBranch === branch}>
                        <Pet species={currentSpecies} mood="idle" hat="none" size={40} stage={pathStage} branch={branch} />
                      </TilePet>
                      <Text style={[styles.gridItemLabel, { color: colors.text }]}>
                        {petForm(currentSpecies, pathStage, branch)?.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Species Selection */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Species</Text>
            <View style={styles.grid}>
              {ALL_SPECIES.map((species) => (
                <Pressable
                  key={species}
                  style={({ pressed }) => [
                    styles.gridItem,
                    { backgroundColor: colors.bg, borderColor: colors.divider },
                    currentSpecies === species && { borderColor: colors.accent, borderWidth: 2 },
                    { transform: [{ scale: pressed ? 0.92 : 1 }] }
                  ]}
                  onPress={() => onSelectSpecies(species)}
                >
                  <TilePet selected={currentSpecies === species}>
                    <Pet species={species} mood="idle" hat="none" size={40} stage={petStage} />
                  </TilePet>
                  <Text style={[styles.gridItemLabel, { color: colors.text }]}>
                    {species.charAt(0).toUpperCase() + species.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Hat Selection */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hats</Text>
            <View style={styles.grid}>
              {ALL_HATS.map((hat) => {
                const isUnlocked = unlockedHats.includes(hat);
                const requirement = HAT_UNLOCK_REQUIREMENTS[hat];

                return (
                  <Pressable
                    key={hat}
                    style={({ pressed }) => [
                      styles.gridItem,
                      { backgroundColor: colors.bg, borderColor: colors.divider },
                      currentHat === hat && { borderColor: colors.accent, borderWidth: 2 },
                      !isUnlocked && styles.locked,
                      isUnlocked && { transform: [{ scale: pressed ? 0.92 : 1 }] }
                    ]}
                    onPress={() => isUnlocked && onSelectHat(hat)}
                    disabled={!isUnlocked}
                  >
                    {isUnlocked ? (
                      <TilePet selected={currentHat === hat}>
                        <Pet species={currentSpecies} mood="idle" hat={hat} size={40} stage={petStage} />
                      </TilePet>
                    ) : (
                      <View style={styles.lockedIcon}>
                        <Text style={styles.lockedText}>🔒</Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.gridItemLabel,
                        { color: isUnlocked ? colors.text : colors.muted },
                      ]}
                    >
                      {hat === 'none' ? 'None' : hat.charAt(0).toUpperCase() + hat.slice(1)}
                    </Text>
                    {!isUnlocked && (
                      <Text style={[styles.unlockLabel, { color: colors.muted }]}>
                        {requirement} ✓
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Close Button */}
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: colors.accent },
              { transform: [{ scale: pressed ? 0.96 : 1 }] }
            ]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: colors.textOnAccent }]}>Done</Text>
          </Pressable>

          {/* New Hat Unlocked Celebration Overlay */}
          <Animated.View
            style={[
              styles.celebrationOverlay,
              {
                opacity: celebrationOpacity,
                transform: [{ scale: celebrationScale }],
              }
            ]}
            pointerEvents="none"
          >
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={[styles.celebrationText, { color: colors.accent2 }]}>
              New Hat Unlocked!
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  nameInput: { fontSize: fontSizes.xl, fontWeight: '800', textAlign: 'center', borderBottomWidth: 1, paddingVertical: 4, paddingHorizontal: 12, minWidth: 160, marginTop: 6 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  preview: {
    alignItems: 'center',
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewLabel: {
    marginTop: 8,
    fontSize: fontSizes.xs,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  gridItem: {
    width: 70,
    alignItems: 'center',
    padding: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  gridItemLabel: {
    fontSize: fontSizes.micro,
    marginTop: 4,
    textAlign: 'center',
  },
  locked: {
    opacity: 0.5,
  },
  lockedIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedText: {
    fontSize: fontSizes.xl,
  },
  unlockLabel: {
    fontSize: fontSizes.micro,
    marginTop: 2,
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: radii.lg,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  celebrationText: {
    fontSize: fontSizes.xxl,
    fontWeight: '900',
    textAlign: 'center',
  },
});

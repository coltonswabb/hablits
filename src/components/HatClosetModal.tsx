// ============================================
// HAT CLOSET MODAL
// ============================================
// Modal for selecting pet hats and species.
// Shows unlocked hats based on progress.
// ============================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { PetSpecies, HatType } from '../types';
import { useTheme } from '../theme';
import { Pet, getUnlockedHats } from './Pet';

interface HatClosetModalProps {
  visible: boolean;
  currentSpecies: PetSpecies;
  currentHat: HatType;
  totalCompletions: number;
  onSelectSpecies: (species: PetSpecies) => void;
  onSelectHat: (hat: HatType) => void;
  onClose: () => void;
}

const ALL_SPECIES: PetSpecies[] = ['blob', 'pixel', 'paper', 'robot', 'droplet', 'slime', 'carmech', 'navi', 'fish', 'butterfly', 'star', 'deer', 'tiger', 'lion', 'hawk'];
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

export function HatClosetModal({
  visible,
  currentSpecies,
  currentHat,
  totalCompletions,
  onSelectSpecies,
  onSelectHat,
  onClose,
}: HatClosetModalProps) {
  const { colors } = useTheme();
  const unlockedHats = getUnlockedHats(totalCompletions);
  const previousUnlockedCount = useRef(unlockedHats.length);

  // Entrance animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Celebration animation for newly unlocked hat
  const celebrationScale = useRef(new Animated.Value(1)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Check if new hat was unlocked
      const hasNewUnlock = unlockedHats.length > previousUnlockedCount.current;

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
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 200,
          friction: 20,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset for next opening
      backdropOpacity.setValue(0);
      modalScale.setValue(0.9);
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
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: colors.card,
              borderColor: colors.divider,
              opacity: modalOpacity,
              transform: [{ scale: modalScale }],
            }
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>Hat Closet</Text>
          
          {/* Current Pet Preview */}
          <View style={[styles.preview, { backgroundColor: colors.bg, borderColor: colors.divider }]}>
            <Pet species={currentSpecies} mood="happy" hat={currentHat} size={80} />
            <Text style={[styles.previewLabel, { color: colors.muted }]}>
              {totalCompletions} total completions
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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
                  <Pet species={species} mood="idle" hat="none" size={40} />
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
                      <Pet species={currentSpecies} mood="idle" hat={hat} size={40} />
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
            <Text style={styles.closeButtonText}>Done</Text>
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
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  preview: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewLabel: {
    marginTop: 8,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
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
    borderRadius: 10,
    borderWidth: 1,
  },
  gridItemLabel: {
    fontSize: 10,
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
    fontSize: 20,
  },
  unlockLabel: {
    fontSize: 9,
    marginTop: 2,
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
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
    borderRadius: 14,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  celebrationText: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
});

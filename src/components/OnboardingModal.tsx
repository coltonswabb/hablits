// ============================================
// ONBOARDING MODAL COMPONENT
// ============================================
// First-time user guide explaining app features
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { TouchableScale } from './TouchableScale';
import { useTheme } from '../theme';
import { Pet } from './Pet';
import { PetSpecies, HatType } from '../types';
import { NAME_SUGGESTIONS, MAX_PET_NAME } from '../utils/petName';
import { radii, fontSizes } from '../theme/tokens';

interface OnboardingModalProps {
  visible: boolean;
  species: PetSpecies;
  hat: HatType;
  /** Called with the chosen pet name ('' if skipped) */
  onComplete: (petName: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const slides = [
  {
    title: '👋 Welcome to Hablits!',
    description: 'Build better habits through identity-based tracking.',
    details: [
      'Track habits daily',
      'Organize by identity (e.g., "Athlete", "Artist")',
      'Set weekly goals',
      'Build streaks',
    ],
  },
  {
    title: '✅ Track Your Progress',
    description: 'Simple, powerful completion tracking.',
    details: [
      'Tap checkbox to mark complete ✓',
      'Tap again to skip –',
      'Tap again to mark failed ×',
      'Add notes to completed habits 📝',
    ],
  },
  {
    title: '📊 View Your Stats',
    description: 'See your progress over time.',
    details: [
      'Completion trends and patterns',
      'Weekly performance breakdown',
      'Identity-based analytics',
      'Best streaks and averages',
    ],
  },
  {
    title: '🎨 Customize Everything',
    description: 'Make it yours with themes and identities.',
    details: [
      'Choose from 18 themes, each with its own pet',
      'Create custom identities',
      'Earn pet hats by completing habits',
      'Plan your day with scheduled habits',
    ],
  },
  {
    title: 'Meet your pet',
    description: 'It gets happier as you complete habits, and it grows for good when your streaks do. Give it a name?',
    details: [],
    isNaming: true,
  },
];

export function OnboardingModal({ visible, species, hat, onComplete }: OnboardingModalProps) {
  const { colors } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [petName, setPetName] = useState('');

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete(petName);
    }
  };

  const handleSkip = () => {
    // Skip the tour but still offer the name
    setCurrentSlide(slides.length - 1);
  };

  const slide = slides[currentSlide];
  const naming = 'isNaming' in slide && slide.isNaming;

  return (
    <Modal visible={visible} animationType="fade">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Slide indicator */}
          <View style={styles.indicators}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor:
                      index === currentSlide ? colors.accent : colors.divider,
                  },
                ]}
              />
            ))}
          </View>

          {/* Content */}
          <View style={styles.slideContent}>
            <Text style={[styles.title, { color: colors.text }]}>
              {slide.title}
            </Text>

            <Text style={[styles.description, { color: colors.muted }]}>
              {slide.description}
            </Text>

            <View style={styles.detailsList}>
              {slide.details.map((detail, index) => (
                <View key={index} style={styles.detailItem}>
                  <View
                    style={[styles.bullet, { backgroundColor: colors.accent }]}
                  />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {detail}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {naming ? (
            <View style={[styles.illustration, { backgroundColor: colors.card, borderColor: colors.divider, paddingVertical: 24 }]}>
              <Pet species={species} mood={petName.trim() ? 'excited' : 'curious'} hat={hat} size={120} />
              <TextInput
                style={[styles.nameInput, { color: colors.text, borderColor: colors.divider, backgroundColor: colors.bg }]}
                placeholder="Name your pet"
                placeholderTextColor={colors.muted}
                value={petName}
                onChangeText={(t) => setPetName(t.slice(0, MAX_PET_NAME))}
                maxLength={MAX_PET_NAME}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleNext}
                accessibilityLabel="Pet name"
              />
              <View style={styles.suggestions}>
                {NAME_SUGGESTIONS[species].map((n) => (
                  <TouchableScale key={n} onPress={() => setPetName(n)} style={[styles.chip, { borderColor: colors.divider, backgroundColor: petName === n ? colors.accent : 'transparent' }]}>
                    <Text style={[styles.chipText, { color: petName === n ? colors.textOnAccent : colors.text }]}>{n}</Text>
                  </TouchableScale>
                ))}
              </View>
              <Text style={[styles.hint, { color: colors.muted }]}>You can change this any time from the Hat Closet.</Text>
            </View>
          ) : (
            <View
              style={[
                styles.illustration,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.divider,
                },
              ]}
            >
              <Text style={styles.illustrationEmoji}>
                {currentSlide === 0 && '🎯'}
                {currentSlide === 1 && '✅'}
                {currentSlide === 2 && '📈'}
                {currentSlide === 3 && '🎨'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.footer}>
          {currentSlide < slides.length - 1 && (
            <TouchableScale
              style={[styles.skipButton]}
              onPress={handleSkip}
            >
              <Text style={[styles.skipText, { color: colors.muted }]}>
                Skip
              </Text>
            </TouchableScale>
          )}

          <TouchableScale
            style={[
              styles.nextButton,
              { backgroundColor: colors.accent },
              currentSlide === slides.length - 1 && { flex: 1 },
            ]}
            onPress={handleNext}
          >
            <Text style={[styles.nextText, { color: colors.textOnAccent }]}>
              {naming ? (petName.trim() ? `Meet ${petName.trim()}` : 'Maybe later') : 'Next'}
            </Text>
          </TouchableScale>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  nameInput: {
    marginTop: 18,
    width: '80%',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  suggestions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  chip: { borderWidth: 1, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12 },
  chipText: { fontSize: fontSizes.sm, fontWeight: '600' },
  hint: { fontSize: fontSizes.xs, marginTop: 14, textAlign: 'center' },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 120,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
    marginTop: 40,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: radii.xs,
  },
  slideContent: {
    marginBottom: 32,
  },
  title: {
    fontSize: fontSizes.hero,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSizes.lg,
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsList: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: radii.xs,
  },
  detailText: {
    fontSize: fontSizes.md,
    flex: 1,
  },
  illustration: {
    height: 200,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  illustrationEmoji: {
    fontSize: 80,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
});

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
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
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
      'Choose from 9 beautiful themes',
      'Create custom identities',
      'Earn pet hats by completing habits',
      'Plan your day with scheduled habits',
    ],
  },
];

export function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const { colors } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];

  return (
    <Modal visible={visible} animationType="fade">
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
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

          {/* Illustration placeholder */}
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
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.footer}>
          {currentSlide < slides.length - 1 && (
            <TouchableOpacity
              style={[styles.skipButton]}
              onPress={handleSkip}
            >
              <Text style={[styles.skipText, { color: colors.muted }]}>
                Skip
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: colors.accent },
              currentSlide === slides.length - 1 && { flex: 1 },
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextText}>
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 4,
  },
  slideContent: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
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
    borderRadius: 4,
  },
  detailText: {
    fontSize: 16,
    flex: 1,
  },
  illustration: {
    height: 200,
    borderRadius: 16,
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
    fontSize: 16,
    fontWeight: '700',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});

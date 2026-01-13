// ============================================
// ONBOARDING SCREEN
// ============================================
// First-time user walkthrough explaining
// how Hablits works
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme';
import { Pet } from '../components';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Hablits!',
      description: 'Build better habits with your virtual pet companion',
      pet: { species: 'blob' as const, mood: 'happy' as const },
    },
    {
      title: 'Track Your Habits',
      description: 'Add daily habits and check them off as you complete them. Swipe right to complete, left to skip.',
      pet: { species: 'blob' as const, mood: 'curious' as const },
    },
    {
      title: 'Your Pet Reacts',
      description: 'Complete your habits to make your pet happy! The more you complete, the happier they become.',
      pet: { species: 'blob' as const, mood: 'celebrate' as const },
    },
    {
      title: 'Customize Everything',
      description: 'Choose from 12 pet species, 13 beautiful themes, and 20+ hats. Make Hablits your own!',
      pet: { species: 'blob' as const, mood: 'excited' as const },
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Skip button */}
      {!isLastStep && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Pet visualization */}
        <View style={styles.petContainer}>
          <Pet
            species={currentStepData.pet.species}
            mood={currentStepData.pet.mood}
            size={120}
            hat="none"
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {currentStepData.title}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.muted }]}>
          {currentStepData.description}
        </Text>

        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentStep ? colors.accent : colors.divider,
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      {/* Next/Get Started button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.accent }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 40,
  },
  petContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomContainer: {
    padding: 20,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

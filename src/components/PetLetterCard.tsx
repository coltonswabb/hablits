// ============================================
// PET LETTER CARD
// ============================================
// The weekly note from the pet, shown at the top of Today on Monday and
// Tuesday. Dismissing it remembers the week so it doesn't come back.
// ============================================

import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme';
import { Pet } from './Pet';
import { PetSpecies, HatType } from '../types';
import { PetLetter } from '../utils/petLetter';

interface Props {
  letter: PetLetter;
  species: PetSpecies;
  hat: HatType;
  stage: number;
  onDismiss: () => void;
}

export function PetLetterCard({ letter, species, hat, stage, onDismiss }: Props) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider, opacity, transform: [{ translateY }] }]}>
      <View style={styles.header}>
        <Pet species={species} mood={letter.mood} hat={hat} size={44} stage={stage} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>A NOTE FROM YOUR PET</Text>
          <Text style={[styles.greeting, { color: colors.text }]}>{letter.greeting}</Text>
        </View>
      </View>
      {letter.paragraphs.map((p, i) => (
        <Text key={i} style={[styles.body, { color: colors.text }]}>
          {p}
        </Text>
      ))}
      <Text style={[styles.signoff, { color: colors.muted }]}>{letter.signoff}</Text>
      <Pressable
        onPress={onDismiss}
        style={({ pressed }) => [styles.button, { borderColor: colors.divider, opacity: pressed ? 0.6 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel="Dismiss the weekly note"
      >
        <Text style={[styles.buttonText, { color: colors.muted }]}>Thanks, little one</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  greeting: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  signoff: { fontSize: 14, fontStyle: 'italic', marginTop: 2 },
  button: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, marginTop: 4 },
  buttonText: { fontSize: 13, fontWeight: '600' },
});

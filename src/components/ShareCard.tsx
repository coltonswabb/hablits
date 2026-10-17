// ============================================
// SHARE CARD
// ============================================
// A 1080×1350 (4:5, Instagram-friendly) card with the pet, a headline and
// a stat line in the current theme. Rendered off-screen at 1/3 scale and
// captured at 3x with react-native-view-shot, then handed to the share
// sheet. Nothing leaves the device unless the user picks a destination.
// ============================================

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../theme';
import { Pet } from './Pet';
import { PetSpecies, HatType, PetMood } from '../types';
import { lightTap } from '../utils/haptics';

export type ShareCardContent = {
  eyebrow: string; // e.g. "EVOLUTION" / "PERFECT WEEK"
  headline: string; // e.g. "Juniper is now a Veteran"
  stat: string; // e.g. "30-day streak"
  footnote?: string; // e.g. "Hablits"
  mood?: PetMood;
};

interface Props {
  content: ShareCardContent;
  species: PetSpecies;
  hat: HatType;
  stage: number;
  /** Rendered as the trigger; defaults to a "Share" pill */
  children?: React.ReactNode;
  onShared?: () => void;
}

// Card is laid out at this logical size and captured at 3x → 1080×1350
const W = 360;
const H = 450;

export function ShareCard({ content, species, hat, stage, children, onShared }: Props) {
  const { colors } = useTheme();
  const cardRef = useRef<React.ComponentRef<typeof View>>(null);
  const [busy, setBusy] = React.useState(false);

  const share = async () => {
    if (busy || !cardRef.current) return;
    setBusy(true);
    lightTap();
    try {
      const uri = await captureRef(cardRef as any, { format: 'png', quality: 1, result: 'tmpfile', width: W * 3, height: H * 3 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: content.headline, UTI: 'public.png' });
        onShared?.();
      }
    } catch (error) {
      console.warn('Share failed:', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable onPress={share} disabled={busy} accessibilityRole="button" accessibilityLabel="Share this moment">
        {children ?? (
          <View style={[styles.pill, { borderColor: colors.divider, backgroundColor: colors.card }]}>
            <Text style={[styles.pillText, { color: colors.text }]}>{busy ? 'Preparing…' : 'Share'}</Text>
          </View>
        )}
      </Pressable>

      {/* Off-screen card. collapsable={false} keeps the native view around for capture on Android. */}
      <View pointerEvents="none" style={styles.offscreen}>
        <View ref={cardRef} collapsable={false} style={[styles.card, { backgroundColor: colors.bg }]}>
          <View style={[styles.inner, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>{content.eyebrow}</Text>
            <View style={styles.petWrap}>
              <View style={[styles.glow, { backgroundColor: stage >= 3 ? '#FFD700' : colors.accent }]} />
              <Pet species={species} mood={content.mood ?? 'celebrate'} hat={hat} size={168} stage={stage} isStatic />
            </View>
            <Text style={[styles.headline, { color: colors.text }]}>{content.headline}</Text>
            <Text style={[styles.stat, { color: colors.muted }]}>{content.stat}</Text>
          </View>
          <Text style={[styles.footer, { color: colors.muted }]}>{content.footnote ?? 'Hablits · habits with a pet that remembers'}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  pill: { borderWidth: 1, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
  pillText: { fontSize: 14, fontWeight: '700' },
  offscreen: { position: 'absolute', left: -3000, top: -3000, width: W, height: H },
  card: { width: W, height: H, padding: 22, justifyContent: 'space-between' },
  inner: { flex: 1, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  eyebrow: { fontSize: 13, fontWeight: '800', letterSpacing: 3 },
  petWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, opacity: 0.18 },
  headline: { fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  stat: { fontSize: 16, fontWeight: '600' },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 14, letterSpacing: 0.5 },
});

export const canShare = Platform.OS !== 'web';

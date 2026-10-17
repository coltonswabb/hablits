// ============================================
// PET SNAPSHOT
// ============================================
// Renders the pet off-screen and rasterizes it to a PNG in the app-group
// folder that the home screen widget can read. WidgetKit can't run our SVG
// pet, so the widget shows this picture instead.
//
// One file per (species, hat, mood) so the widget never shows a stale image
// and we don't rewrite files that already exist.
// ============================================

import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import type Svg from 'react-native-svg';
import { Pet } from './Pet';
import { PetSpecies, PetMood, HatType } from '../types';

interface Props {
  species: PetSpecies;
  hat: HatType;
  mood: PetMood;
  stage?: number;
  /** Called with a file:// URI once the PNG for this combination exists */
  onCaptured: (uri: string) => void;
}

/** Pixel size of the rasterized PNG. Widgets show it at ≤ 96pt, so 3x is plenty. */
const PNG_SIZE = 288;

const written = new Set<string>();

export function PetSnapshot({ species, hat, mood, stage = 0, onCaptured }: Props) {
  const svgRef = useRef<Svg>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let cancelled = false;

    async function capture() {
      try {
        const { widgetsDirectory } = await import('expo-widgets');
        if (!widgetsDirectory) return; // no app group configured

        const FileSystem = await import('expo-file-system/legacy');
        const uri = `${widgetsDirectory}pet-${species}-${hat}-${mood}-s${stage}.png`;

        if (!written.has(uri)) {
          const info = await FileSystem.getInfoAsync(uri);
          if (!info.exists) {
            const svg = svgRef.current;
            if (!svg || cancelled) return;
            const base64 = await new Promise<string>((resolve) =>
              svg.toDataURL(resolve, { width: PNG_SIZE, height: PNG_SIZE })
            );
            if (cancelled) return;
            await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
          }
          written.add(uri);
        }
        if (!cancelled) onCaptured(uri);
      } catch (error) {
        console.warn('Pet snapshot failed:', error);
      }
    }

    // Short delay so the SVG has laid out; the first blink is ≥ 3s away,
    // so we never catch the pet with its eyes shut.
    const t = setTimeout(capture, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [species, hat, mood, stage, onCaptured]);

  if (Platform.OS !== 'ios') return null;

  // Parked off-screen: still laid out and drawable, never visible or tappable.
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -1000, top: -1000, opacity: 0 }}>
      <Pet species={species} mood={mood} hat={hat} size={96} svgRef={svgRef} stage={stage} />
    </View>
  );
}

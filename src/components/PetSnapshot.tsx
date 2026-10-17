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

import React, { useEffect, useRef, useState } from 'react';
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

/**
 * Size of the off-screen Pet AND the PNG. On iOS react-native-svg's
 * toDataURL draws the view at its own bounds, so the Pet must be rendered at
 * the pixel size we want — passing width/height options only grows the canvas.
 * Widgets show it at ≤ 96pt; 288 covers 3x.
 */
const PNG_SIZE = 288;

/** Bump when the pet art changes so cached PNGs in the app group are regenerated. */
const ART_VERSION = 2;

const written = new Set<string>();

export function PetSnapshot({ species, hat, mood, stage = 0, onCaptured }: Props) {
  const svgRef = useRef<Svg>(null);
  const key = `${species}|${hat}|${mood}|${stage}`;
  // Once this combination is captured, unmount the hidden Pet (no idle work)
  const [doneKey, setDoneKey] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let cancelled = false;

    async function capture() {
      try {
        const { widgetsDirectory } = await import('expo-widgets');
        if (!widgetsDirectory) return; // no app group configured

        const FileSystem = await import('expo-file-system/legacy');
        const uri = `${widgetsDirectory}pet-v${ART_VERSION}-${species}-${hat}-${mood}-s${stage}.png`;

        if (!written.has(uri)) {
          const info = await FileSystem.getInfoAsync(uri);
          if (!info.exists) {
            const svg = svgRef.current;
            if (!svg || cancelled) return;
            const base64 = await new Promise<string>((resolve) => svg.toDataURL(resolve));
            if (cancelled) return;
            await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
          }
          written.add(uri);
        }
        if (!cancelled) {
          setDoneKey(key);
          onCaptured(uri);
        }
      } catch (error) {
        console.warn('Pet snapshot failed:', error);
      }
    }

    // Short delay so the SVG has laid out. The Pet is rendered static, so
    // there's no blink to race.
    const t = setTimeout(capture, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [species, hat, mood, stage, onCaptured]);

  if (Platform.OS !== 'ios' || doneKey === key) return null;

  // Parked off-screen: still laid out and drawable, never visible or tappable.
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -2000, top: -2000, opacity: 0 }}>
      <Pet species={species} mood={mood} hat={hat} size={PNG_SIZE} svgRef={svgRef} stage={stage} isStatic />
    </View>
  );
}

// ============================================
// LOGO COMPONENT
// ============================================
// The pixel pet from the app icon, drawn from the same 14x12 grid as the icon
// artwork (docs/icon-options/D-pixel-black.svg) so the two always match.
// Used in the header and on the launch screen.
// ============================================

import React from 'react';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '../theme';

// W = body, K = eyes and mouth, C = cheeks, . = empty
const ICON_GRID = [
  '..WW......WW..',
  '.WWWW....WWWW.',
  '.WWWWWWWWWWWW.',
  'WWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWW',
  'WWWKKWWWWKKWWW',
  'WWWKKWWWWKKWWW',
  'WWWWWWWWWWWWWW',
  'WCCWWWKKWWWCCW',
  'WWWWWWWWWWWWWW',
  '.WWWWWWWWWWWW.',
  '..WWW....WWW..',
];
const COLUMNS = 14;
const ROWS = 12;
// The icon's drop shadow is the same shape, half a pixel lower
const SHADOW_OFFSET = 0.5;

interface LogoProps {
  size?: number;
  /** Body colour. Defaults to the theme's text colour. */
  body?: string;
  /** Eyes and mouth. Defaults to the theme's background colour. */
  face?: string;
  /** Cheeks. Defaults to the theme's muted colour. */
  cheek?: string;
  /** Drop shadow under the pet, as on the app icon. Left out, there is no shadow. */
  shadow?: string;
}

export function Logo({ size = 24, body, face, cheek, shadow }: LogoProps) {
  const { colors } = useTheme();
  const fills = {
    W: body ?? colors.text,
    K: face ?? colors.bg,
    C: cheek ?? colors.muted,
  };

  // Each row is drawn as runs of same-coloured pixels. The body goes down first
  // as solid rows that overlap their neighbours, so no hairline seams show
  // between pixels at small sizes; the face and cheeks are drawn on top.
  const BLEED = 0.12;
  const shadows: React.ReactNode[] = [];
  const bodyRuns: React.ReactNode[] = [];
  const details: React.ReactNode[] = [];
  ICON_GRID.forEach((row, y) => {
    let x = 0;
    while (x < COLUMNS) {
      if (row[x] === '.') {
        x += 1;
        continue;
      }
      // A run of filled pixels (any colour) is one body rectangle
      let end = x;
      while (end < COLUMNS && row[end] !== '.') end += 1;
      const width = end - x;
      if (shadow) {
        shadows.push(<Rect key={`s${x}-${y}`} x={x} y={y + SHADOW_OFFSET} width={width} height={1 + BLEED} fill={shadow} />);
      }
      bodyRuns.push(<Rect key={`b${x}-${y}`} x={x} y={y - BLEED / 2} width={width} height={1 + BLEED} fill={fills.W} />);
      x = end;
    }
    row.split('').forEach((cell, cx) => {
      if (cell !== 'K' && cell !== 'C') return;
      // Face pixels sit next to each other in pairs; bleed sideways so pairs join
      details.push(<Rect key={`d${cx}-${y}`} x={cx - BLEED / 2} y={y - BLEED / 2} width={1 + BLEED} height={1 + BLEED} fill={fills[cell]} />);
    });
  });
  const cells = [...shadows, ...bodyRuns, ...details];

  return (
    <Svg width={size} height={size} viewBox={`0 ${(ROWS + SHADOW_OFFSET - COLUMNS) / 2} ${COLUMNS} ${COLUMNS}`}>
      {cells}
    </Svg>
  );
}

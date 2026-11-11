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

  const cells: React.ReactNode[] = [];
  ICON_GRID.forEach((row, y) => {
    row.split('').forEach((cell, x) => {
      if (cell === '.') return;
      if (shadow) {
        cells.unshift(<Rect key={`s${x}-${y}`} x={x} y={y + SHADOW_OFFSET} width={1.02} height={1.02} fill={shadow} />);
      }
      // Slightly over 1 wide so neighbouring pixels leave no hairline gaps
      cells.push(<Rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fills[cell as 'W' | 'K' | 'C']} />);
    });
  });

  return (
    <Svg width={size} height={size} viewBox={`0 ${(ROWS + SHADOW_OFFSET - COLUMNS) / 2} ${COLUMNS} ${COLUMNS}`}>
      {cells}
    </Svg>
  );
}

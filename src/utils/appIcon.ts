// ============================================
// APP ICON CHOICE
// ============================================
// Lets the user pick which Hablits icon sits on their Home Screen.
// The icons are declared in app.json (expo-alternate-app-icons plugin) and
// baked in at build time, so this only works in a build that includes them:
// not on web, and not in an older build running newer JavaScript.
// ============================================

import { ImageSourcePropType } from 'react-native';

export type AppIconChoice = {
  /** Name registered in app.json; null is the default icon */
  name: string | null;
  label: string;
  preview: ImageSourcePropType;
};

export const APP_ICONS: AppIconChoice[] = [
  { name: null, label: 'Black', preview: require('../../assets/icon.png') },
  { name: 'White', label: 'White', preview: require('../../assets/icons/white.png') },
  { name: 'Violet', label: 'Violet', preview: require('../../assets/icons/violet.png') },
  { name: 'Mint', label: 'Mint', preview: require('../../assets/icons/mint.png') },
];

type AlternateIcons = {
  supportsAlternateIcons: boolean;
  setAlternateAppIcon: (name: string | null) => Promise<string | null>;
  getAppIconName: () => string | null;
};

// The native module is missing on web and in builds made before the icons
// were added, and requiring it there throws.
function loadModule(): AlternateIcons | null {
  try {
    return require('expo-alternate-app-icons') as AlternateIcons;
  } catch {
    return null;
  }
}

const alternateIcons = loadModule();

/** True when this build and device can switch icons. */
export function canChangeAppIcon(): boolean {
  return alternateIcons?.supportsAlternateIcons === true;
}

/** The icon in use now; null is the default. */
export function currentAppIcon(): string | null {
  if (!canChangeAppIcon()) return null;
  try {
    return alternateIcons?.getAppIconName() ?? null;
  } catch {
    return null;
  }
}

/** Switch icon. Resolves to false if the system refused. */
export async function setAppIcon(name: string | null): Promise<boolean> {
  if (!alternateIcons || !canChangeAppIcon()) return false;
  try {
    await alternateIcons.setAlternateAppIcon(name);
    return true;
  } catch {
    return false;
  }
}

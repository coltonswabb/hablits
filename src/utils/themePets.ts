// ============================================
// THEME DEFAULT PETS
// ============================================
// Default pet species for each theme
// ============================================

import { ThemeName, PetSpecies } from '../types';

export const themeDefaultPets: Record<ThemeName, PetSpecies> = {
  light: 'blob',
  dark: 'navi',
  retro: 'pixel',
  chibi: 'droplet',
  sunshine: 'slime',
  gameboy: 'pixel',
  fzero: 'carmech',
  paper: 'paper',
  mmbn: 'robot',
  ocean: 'fish',
  sunset: 'butterfly',
  cosmic: 'star',
  forest: 'deer',
};

export function getDefaultPetForTheme(theme: ThemeName): PetSpecies {
  return themeDefaultPets[theme];
}

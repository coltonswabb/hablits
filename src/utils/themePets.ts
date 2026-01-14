// ============================================
// THEME DEFAULT PETS
// ============================================
// Default pet species for each theme
// ============================================

import { ThemeName, PetSpecies } from '../types';

export const themeDefaultPets: Record<ThemeName, PetSpecies> = {
  light: 'blob',
  dark: 'navi',
  superdark: 'robot',
  retro: 'pixel',
  chibi: 'droplet',
  sunshine: 'slime',
  gameboy: 'pixel',
  racer: 'carmech',
  paper: 'paper',
  cyber: 'robot',
  ocean: 'fish',
  sunset: 'butterfly',
  cosmic: 'star',
  forest: 'deer',
  bengal: 'tiger',
  lion: 'lion',
  ladyhawke: 'hawk',
  sakura: 'dragon',
};

export function getDefaultPetForTheme(theme: ThemeName): PetSpecies {
  return themeDefaultPets[theme];
}

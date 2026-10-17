// ============================================
// PET NAME
// ============================================
// Everything that talks about the pet goes through here so copy reads
// "Juniper is thrilled" when there's a name and "your pet is thrilled"
// when there isn't.
// ============================================

import { PetSpecies } from '../types';

export const MAX_PET_NAME = 20;

/** Display name, or the fallback phrase. */
export function petDisplayName(name: string | undefined, fallback = 'your pet'): string {
  const n = (name || '').trim();
  return n.length > 0 ? n : fallback;
}

/** Capitalised for sentence starts: "Your pet is…" / "Juniper is…". */
export function petSubject(name: string | undefined): string {
  const n = (name || '').trim();
  return n.length > 0 ? n : 'Your pet';
}

/** A few tap-to-pick suggestions per species for onboarding. */
export const NAME_SUGGESTIONS: Record<PetSpecies, string[]> = {
  blob: ['Bloop', 'Pudding', 'Mochi'],
  pixel: ['Bit', 'Pixel', 'Dot'],
  paper: ['Origami', 'Folio', 'Crane'],
  robot: ['Beep', 'Rivet', 'Volt'],
  droplet: ['Dew', 'Puddle', 'Misty'],
  slime: ['Goop', 'Jelly', 'Ooze'],
  carmech: ['Turbo', 'Piston', 'Nitro'],
  navi: ['Byte', 'Link', 'Nova'],
  fish: ['Finn', 'Bubbles', 'Coral'],
  butterfly: ['Flutter', 'Iris', 'Mariposa'],
  star: ['Twinkle', 'Nova', 'Lumen'],
  deer: ['Fern', 'Willow', 'Hazel'],
  tiger: ['Ember', 'Stripe', 'Rajah'],
  lion: ['Leo', 'Sol', 'Mane'],
  hawk: ['Juniper', 'Sky', 'Talon'],
  dragon: ['Cinder', 'Pyre', 'Wyrm'],
};

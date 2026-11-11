// ============================================
// PET BRANCH CONTEXT
// ============================================
// The user's pet is drawn in many places (header, launch, hat closet, widget
// snapshot). This hands every one of them the branch it evolved along, so
// they all show the same form without each having to be told.
// ============================================

import { createContext, useContext } from 'react';
import { PetBranch } from './forms';

const PetBranchContext = createContext<PetBranch | null>(null);

export const PetBranchProvider = PetBranchContext.Provider;

/** The branch the user's pet took, or null if it has not reached that stage. */
export function usePetBranch(): PetBranch | null {
  return useContext(PetBranchContext);
}

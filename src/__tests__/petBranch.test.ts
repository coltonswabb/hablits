import { branchForIdentity, decideBranch } from '../utils/petBranch';
import { hasEvolutionLine, petForm } from '../pets/forms';
import { AppState } from '../types';

const now = new Date(2026, 10, 11);
const day = (offset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const state = (logs: Record<string, string[]>) =>
  ({
    identities: [
      { id: 'i-health', name: 'Health', color: '#000000' },
      { id: 'i-mind', name: 'Reader', color: '#000000' },
      { id: 'i-home', name: 'Home', color: '#000000' },
    ],
    habits: [
      { id: 'run', identityId: 'i-health' },
      { id: 'read', identityId: 'i-mind' },
      { id: 'tidy', identityId: 'i-home' },
    ],
    logs,
  }) as unknown as AppState;

describe('branchForIdentity', () => {
  it('sorts identities by what their name sounds like', () => {
    expect(branchForIdentity('Athlete')).toBe('body');
    expect(branchForIdentity('Health')).toBe('body');
    expect(branchForIdentity('Reader')).toBe('mind');
    expect(branchForIdentity('Mind')).toBe('mind');
    expect(branchForIdentity('General')).toBeNull();
    expect(branchForIdentity('Home')).toBeNull();
  });
});

describe('decideBranch', () => {
  it('is heart with no history', () => {
    expect(decideBranch(state({}), now)).toBe('heart');
  });

  it('follows a clear majority', () => {
    expect(decideBranch(state({ [day(0)]: ['run'], [day(1)]: ['run'], [day(2)]: ['read'] }), now)).toBe('body');
    expect(decideBranch(state({ [day(0)]: ['read'], [day(1)]: ['read'], [day(2)]: ['tidy'] }), now)).toBe('mind');
  });

  it('is heart when nothing reaches half', () => {
    expect(decideBranch(state({ [day(0)]: ['run', 'read', 'tidy'] }), now)).toBe('heart');
    expect(decideBranch(state({ [day(0)]: ['tidy'], [day(1)]: ['tidy'] }), now)).toBe('heart');
  });

  it('is heart on an even split between body and mind', () => {
    expect(decideBranch(state({ [day(0)]: ['run', 'read'] }), now)).toBe('heart');
  });

  it('ignores anything older than the window', () => {
    expect(decideBranch(state({ [day(45)]: ['run', 'run'], [day(1)]: ['read'] }), now)).toBe('mind');
  });
});

describe('petForm', () => {
  it('walks the blob line through its stages', () => {
    expect(petForm('blob', 0)?.name).toBe('Pip');
    expect(petForm('blob', 1)?.name).toBe('Blob');
    expect(petForm('blob', 2, 'body')?.name).toBe('Stout');
    expect(petForm('blob', 2, 'mind')?.name).toBe('Wisp');
    expect(petForm('blob', 2, 'heart')?.name).toBe('Bloom');
    expect(petForm('blob', 3, 'body')?.name).toBe('Bulwark');
    expect(petForm('blob', 3, 'mind')?.name).toBe('Lumen');
    expect(petForm('blob', 3, 'heart')?.name).toBe('Evergrow');
  });

  it('shows the heart form until a branch is chosen', () => {
    expect(petForm('blob', 2)?.name).toBe('Bloom');
    expect(petForm('blob', 3, null)?.name).toBe('Evergrow');
  });

  it('keeps single-form pets the same at every stage', () => {
    expect(petForm('pixel', 0)?.name).toBe('Pixel');
    expect(petForm('pixel', 3, 'body')?.name).toBe('Pixel');
    expect(petForm('robot', 1)?.name).toBe('Robot');
    expect(hasEvolutionLine('blob')).toBe(true);
    expect(hasEvolutionLine('pixel')).toBe(false);
  });
});

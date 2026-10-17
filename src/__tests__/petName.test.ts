import { petDisplayName, petSubject, NAME_SUGGESTIONS } from '../utils/petName';

describe('petName helpers', () => {
  it('falls back when unnamed', () => {
    expect(petDisplayName(undefined)).toBe('your pet');
    expect(petDisplayName('   ')).toBe('your pet');
    expect(petDisplayName(' Juniper ')).toBe('Juniper');
    expect(petSubject('')).toBe('Your pet');
    expect(petSubject('Bit')).toBe('Bit');
  });
  it('has suggestions for every species', () => {
    for (const list of Object.values(NAME_SUGGESTIONS)) expect(list.length).toBeGreaterThanOrEqual(3);
  });
});

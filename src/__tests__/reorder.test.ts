import { applyVisibleOrder, moveItem } from '../utils/reorder';

describe('moveItem', () => {
  it('moves an item down and up', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('clamps the target and leaves the input alone', () => {
    const list = ['a', 'b', 'c'];
    expect(moveItem(list, 0, 99)).toEqual(['b', 'c', 'a']);
    expect(moveItem(list, 1, 1)).toEqual(['a', 'b', 'c']);
    expect(moveItem(list, 5, 0)).toEqual(['a', 'b', 'c']);
    expect(list).toEqual(['a', 'b', 'c']);
  });
});

describe('applyVisibleOrder', () => {
  const all = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));

  it('reorders visible items and keeps hidden ones in their slots', () => {
    // b and d are not on screen today
    const next = applyVisibleOrder(all, ['e', 'a', 'c']);
    expect(next.map((h) => h.id)).toEqual(['e', 'b', 'a', 'd', 'c']);
  });

  it('is a no-op for the same order', () => {
    expect(applyVisibleOrder(all, ['a', 'c', 'e']).map((h) => h.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('ignores ids it does not know', () => {
    expect(applyVisibleOrder(all, ['c', 'zzz', 'a']).map((h) => h.id)).toEqual(['c', 'b', 'a', 'd', 'e']);
  });
});

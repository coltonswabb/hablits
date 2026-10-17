import { themes, contrastRatio, textOn } from '../theme/colors';

describe('theme contrast', () => {
  const names = Object.keys(themes) as (keyof typeof themes)[];

  it.each(names)('%s: body text is readable (≥ 4.5:1) on bg and card', (name) => {
    const c = themes[name];
    expect(contrastRatio(c.text, c.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.text, c.card)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(names)('%s: muted text is at least 3:1 on card', (name) => {
    const c = themes[name];
    expect(contrastRatio(c.muted, c.card)).toBeGreaterThanOrEqual(3);
  });

  it.each(names)('%s: accent and good read against their surfaces (≥ 3:1)', (name) => {
    const c = themes[name];
    expect(contrastRatio(c.accent, c.bg)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(c.good, c.card)).toBeGreaterThanOrEqual(3);
  });

  it.each(names)('%s: textOnAccent is readable on accent (≥ 4.5:1)', (name) => {
    const c = themes[name];
    expect(contrastRatio(c.textOnAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('textOn', () => {
  it('picks ink on light/neon surfaces and white on dark ones', () => {
    expect(textOn('#00ff00')).not.toBe('#ffffff');
    expect(textOn('#ffb7c5')).not.toBe('#ffffff');
    expect(textOn('#1d4ed8')).toBe('#ffffff');
    expect(textOn('#8b5a99')).toBe('#ffffff');
  });
  it('falls back to white for non-hex input', () => {
    expect(textOn('rgba(0,0,0,0.5)')).toBe('#ffffff');
  });
});

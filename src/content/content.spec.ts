import { CONTENT } from './index';

describe('portfolio content', () => {
  it('uses the same project slugs in every language', () => {
    expect(CONTENT.fr.projects.map((p) => p.slug)).toEqual(CONTENT.en.projects.map((p) => p.slug));
  });

  it('uses the same experience ids, order and tracks in every language', () => {
    const shape = (l: 'en' | 'fr') => CONTENT[l].experience.map((e) => `${e.id}/${e.track}/${e.period === null}`);
    expect(shape('fr')).toEqual(shape('en'));
    for (const e of CONTENT.en.experience) expect(e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('never gives parallel work invented dates', () => {
    for (const l of ['en', 'fr'] as const) for (const e of CONTENT[l].experience.filter((x) => x.track === 'parallel')) expect(e.period).toBeNull();
  });

  it('has unique, URL-safe project slugs', () => {
    const slugs = CONTENT.en.projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

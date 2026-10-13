import { CONTENT } from './index';

describe('portfolio content', () => {
  it('uses the same project slugs in every language', () => {
    expect(CONTENT.fr.projects.map((p) => p.slug)).toEqual(CONTENT.en.projects.map((p) => p.slug));
  });

  it('has unique, URL-safe project slugs', () => {
    const slugs = CONTENT.en.projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

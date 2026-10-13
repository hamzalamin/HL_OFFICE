import { langFromUrl, localizePath, stripLang } from './language.service';

describe('language routing helpers', () => {
  it('derives the language from the URL', () => {
    expect(langFromUrl('/')).toBe('en');
    expect(langFromUrl('/projects/x')).toBe('en');
    expect(langFromUrl('/fr')).toBe('fr');
    expect(langFromUrl('/fr/projects/x')).toBe('fr');
    expect(langFromUrl('/fr?area=lounge')).toBe('fr');
    expect(langFromUrl('/french-page')).toBe('en');
  });

  it('localises and strips paths, keeping query strings', () => {
    expect(localizePath('/', 'fr')).toBe('/fr');
    expect(localizePath('/about', 'fr')).toBe('/fr/about');
    expect(localizePath('/?area=library', 'fr')).toBe('/fr?area=library');
    expect(localizePath('/about', 'en')).toBe('/about');
    expect(stripLang('/fr')).toBe('/');
    expect(stripLang('/fr/projects/a')).toBe('/projects/a');
    expect(stripLang('/fr?area=lounge')).toBe('/?area=lounge');
  });
});

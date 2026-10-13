import { isPlaceholder, isProvided } from './placeholder';

describe('placeholders', () => {
  it('recognises YOUR_* markers', () => {
    expect(isPlaceholder('YOUR_NAME')).toBe(true);
    expect(isPlaceholder('YOUR_PROJECT_REPOSITORY_URL')).toBe(true);
    expect(isPlaceholder('Your name')).toBe(false);
    expect(isPlaceholder('A YOUR_NAME inside text')).toBe(false);
  });

  it('treats placeholders, blanks and empty lists as missing content', () => {
    expect(isProvided('YOUR_TITLE')).toBe(false);
    expect(isProvided('  ')).toBe(false);
    expect(isProvided(undefined)).toBe(false);
    expect(isProvided([])).toBe(false);
    expect(isProvided(['YOUR_SKILL'])).toBe(false);
    expect(isProvided(['YOUR_SKILL', 'Real skill'])).toBe(true);
    expect(isProvided('Real text')).toBe(true);
  });
});

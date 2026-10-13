import { UiStrings } from '../core/i18n/ui-strings';

export interface NavItem {
  key: keyof UiStrings['nav'];
  path: string;
  exact?: boolean;
}

/** Conventional navigation, in reading order. CV is shown as a separate button. */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'home', path: '/', exact: true },
  { key: 'about', path: '/about' },
  { key: 'skills', path: '/skills' },
  { key: 'experience', path: '/experience' },
  { key: 'projects', path: '/projects' },
  { key: 'education', path: '/education' },
  { key: 'contact', path: '/contact' },
];

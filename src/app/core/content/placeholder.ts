import { InjectionToken, isDevMode } from '@angular/core';

const PLACEHOLDER = /^YOUR_[A-Z0-9_]+$/;

/** True for `YOUR_*` markers that still need real content. */
export function isPlaceholder(value: unknown): value is string {
  return typeof value === 'string' && PLACEHOLDER.test(value.trim());
}

/** True when a value holds real content: not empty, not a placeholder. */
export function isProvided(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '' && !isPlaceholder(value);
  if (Array.isArray(value)) return value.some(isProvided);
  return true;
}

/**
 * When true, placeholders are rendered as visible badges so the layout can be
 * reviewed before real content exists. Defaults to dev mode; the production
 * build hides every placeholder from visitors.
 */
export const SHOW_PLACEHOLDERS = new InjectionToken<boolean>('SHOW_PLACEHOLDERS', {
  providedIn: 'root',
  factory: () => isDevMode(),
});

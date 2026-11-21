import { InjectionToken, isDevMode } from '@angular/core';

const PLACEHOLDER = /^YOUR_[A-Z0-9_]+$/;

export function isPlaceholder(value: unknown): value is string {
  return typeof value === 'string' && PLACEHOLDER.test(value.trim());
}

export function isProvided(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '' && !isPlaceholder(value);
  if (Array.isArray(value)) return value.some(isProvided);
  return true;
}

export const SHOW_PLACEHOLDERS = new InjectionToken<boolean>('SHOW_PLACEHOLDERS', {
  providedIn: 'root',
  factory: () => isDevMode(),
});

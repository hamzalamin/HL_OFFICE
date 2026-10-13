import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const KEY = 'portfolio.welcome-seen';

/** Minimal storage interface so tests can provide an in-memory fake. */
export type WelcomeStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const WELCOME_STORAGE = new InjectionToken<WelcomeStorage | null>('WELCOME_STORAGE', {
  providedIn: 'root',
  factory: () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return null;
    try {
      return window.localStorage;
    } catch {
      return null; // Storage blocked (private mode, disabled cookies…)
    }
  },
});

/**
 * Remembers whether this visitor has already closed the welcome popup, so it
 * only opens automatically on the first visit. A per-visitor convenience:
 * if storage is unavailable, the popup simply shows again.
 */
@Injectable({ providedIn: 'root' })
export class WelcomeMemory {
  private readonly storage = inject(WELCOME_STORAGE);

  hasSeen(): boolean {
    try {
      return this.storage?.getItem(KEY) === '1';
    } catch {
      return false;
    }
  }

  markSeen(): void {
    try {
      this.storage?.setItem(KEY, '1');
    } catch {
      // Ignore: nothing important is lost.
    }
  }
}

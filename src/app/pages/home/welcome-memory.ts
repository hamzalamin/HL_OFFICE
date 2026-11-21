import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const KEY = 'portfolio.welcome-seen';

export type WelcomeStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const WELCOME_STORAGE = new InjectionToken<WelcomeStorage | null>('WELCOME_STORAGE', {
  providedIn: 'root',
  factory: () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return null;
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  },
});

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

    }
  }
}

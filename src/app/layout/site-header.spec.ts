import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes';
import { SiteHeader } from './site-header';

describe('SiteHeader', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    return fixture;
  }

  it('keeps only discreet global actions: overview, directory, language, CV', async () => {
    const el = (await render()).nativeElement as HTMLElement;
    const header = el.querySelector('header')!;
    const visibleLinks = [...header.querySelectorAll('a')].filter((a) => !a.closest('.directory-menu'));
    expect(visibleLinks.map((a) => a.getAttribute('href'))).toEqual(['/', '/fr', '/cv']);
  });

  it('opens the directory of office areas on demand', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    const menu = el.querySelector('.directory-menu')!;
    expect(menu.hasAttribute('inert')).toBe(true);

    el.querySelector<HTMLButtonElement>('.directory-btn')!.click();
    await fixture.whenStable();
    expect(menu.hasAttribute('inert')).toBe(false);
    expect(menu.querySelectorAll('a').length).toBe(6);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    await fixture.whenStable();
    expect(menu.hasAttribute('inert')).toBe(true);
  });
});

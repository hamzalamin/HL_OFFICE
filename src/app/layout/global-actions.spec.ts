import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes';
import { ContentService } from '../core/content/content.service';
import { GlobalActions } from './global-actions';

describe('GlobalActions', () => {
  async function render(cvFile?: string) {
    const providers: unknown[] = [provideRouter(routes)];
    if (cvFile) providers.push({ provide: ContentService, useValue: { content: signal({ cv: { file: cvFile } }), real: (v: unknown) => v } });
    TestBed.configureTestingModule({ providers: providers as never[] });
    const fixture = TestBed.createComponent(GlobalActions);
    await fixture.whenStable();
    return fixture;
  }

  it('is only icons: no navigation links besides the language menu', async () => {
    const el = (await render()).nativeElement as HTMLElement;
    const visible = [...el.querySelectorAll('a, button')].filter((a) => !a.closest('.menu'));
    expect(visible.length).toBe(1);
    expect(visible[0].getAttribute('aria-label')).toBe('Language: English');
  });

  it('opens a compact language menu that marks the current language', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    const menu = el.querySelector('.menu')!;
    expect(menu.hasAttribute('inert')).toBe(true);
    el.querySelector<HTMLButtonElement>('.lang .action')!.click();
    await fixture.whenStable();
    expect(menu.hasAttribute('inert')).toBe(false);
    const links = [...menu.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/', '/fr']);
    expect(links[0].getAttribute('aria-current')).toBe('true');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    await fixture.whenStable();
    expect(menu.hasAttribute('inert')).toBe(true);
  });

  it('offers the CV download only when the file exists', async () => {
    expect((await render()).nativeElement.querySelector('[download]')).toBeNull();
    TestBed.resetTestingModule();
    const link = (await render('cv/cv-en.pdf')).nativeElement.querySelector('[download]') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/cv/cv-en.pdf');
    expect(link.getAttribute('aria-label')).toBe('Download CV');
  });
});

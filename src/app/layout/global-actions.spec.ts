import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes';
import { ContentService } from '../core/content/content.service';
import { GlobalActions } from './global-actions';

describe('GlobalActions', () => {
  async function render(cvFiles?: Record<string, string>) {
    const providers: unknown[] = [provideRouter(routes)];
    providers.push({ provide: ContentService, useValue: { content: signal({ cv: { files: cvFiles } }), real: (v: unknown) => v } });
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

  it('offers the CV only when files exist, and asks which version', async () => {
    expect((await render()).nativeElement.querySelector('.cv')).toBeNull();
    TestBed.resetTestingModule();
    const fixture = await render({ en: 'cv/HamzaLamin_SoftwareDeveloper_CV.pdf', fr: 'cv/HamzaLamin_DeveloppeurLogiciel_CV.pdf' });
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector<HTMLButtonElement>('.cv .action')!;
    expect(button.getAttribute('aria-label')).toBe('Download CV');
    button.click();
    await fixture.whenStable();
    const menu = el.querySelector('#cv-menu')!;
    expect(menu.hasAttribute('inert')).toBe(false);
    expect(menu.textContent).toContain('Which version would you like?');
    const links = [...menu.querySelectorAll('a')];
    expect(links.map((a) => [a.getAttribute('href'), a.getAttribute('download')])).toEqual([
      ['/cv/HamzaLamin_SoftwareDeveloper_CV.pdf', 'HamzaLamin_SoftwareDeveloper_CV.pdf'],
      ['/cv/HamzaLamin_DeveloppeurLogiciel_CV.pdf', 'HamzaLamin_DeveloppeurLogiciel_CV.pdf'],
    ]);
    expect(menu.querySelector('button')?.textContent).toContain('Both versions');
  });
});

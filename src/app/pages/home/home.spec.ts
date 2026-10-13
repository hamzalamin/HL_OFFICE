import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { SHOW_PLACEHOLDERS } from '../../core/content/placeholder';
import { WELCOME_STORAGE, WelcomeStorage } from './welcome-memory';

function memoryStorage(initial: Record<string, string> = {}): WelcomeStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
}

async function setup(showPlaceholders: boolean, storage: WelcomeStorage = memoryStorage()) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      { provide: SHOW_PLACEHOLDERS, useValue: showPlaceholders },
      { provide: WELCOME_STORAGE, useValue: storage },
    ],
  });
  return RouterTestingHarness.create();
}

describe('Home (office)', () => {
  const el = (h: RouterTestingHarness) => h.routeNativeElement!;
  const heading = (h: RouterTestingHarness) => el(h).querySelector('app-area-panel h2')?.textContent ?? '';
  const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

  it('lists every area as a link to its place in the office', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/');
    const links = el(harness).querySelectorAll<HTMLAnchorElement>('[data-area-link]');
    expect(links.length).toBe(6);
    expect(links[0].getAttribute('href')).toBe('/about');
  });

  it('opens an area from its URL and closes it again', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/cv');
    expect(heading(harness)).toContain('Library');
    await harness.navigateByUrl('/');
    expect(el(harness).querySelector('app-area-panel')).toBeNull();
  });

  it('keeps the same office while moving between areas and projects', async () => {
    const harness = await setup(true);
    await harness.navigateByUrl('/');
    const scene = el(harness).querySelector('app-office-scene');
    for (const url of ['/about', '/projects', '/projects/project-one', '/contact', '/']) {
      await harness.navigateByUrl(url);
      expect(el(harness).querySelector('app-office-scene'), url).toBe(scene);
    }
  });

  it('opens a project case study on its own URL, next to its board', async () => {
    const harness = await setup(true);
    await harness.navigateByUrl('/projects/project-one');
    expect(el(harness).querySelector('app-project-case-study')).not.toBeNull();
    expect(el(harness).querySelector('app-area-panel .back')?.getAttribute('href')).toBe('/projects');
    expect(el(harness).querySelector('.board.is-active')?.getAttribute('data-board')).toBe('project-one');
  });

  it('falls back to the project wall for an unknown project', async () => {
    const harness = await setup(true);
    await harness.navigateByUrl('/projects/nope');
    expect(heading(harness)).toContain('Project wall');
    expect(el(harness).querySelector('.notice')).not.toBeNull();
  });

  it('goes up one level with Escape: case study, project wall, overview', async () => {
    const harness = await setup(true);
    const router = TestBed.inject(Router);
    await harness.navigateByUrl('/projects/project-one');
    escape();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/projects');
    escape();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/');
  });

  it('shows full content in place instead of linking to section pages', async () => {
    const harness = await setup(true);
    await harness.navigateByUrl('/experience');
    expect(el(harness).querySelector('app-area-panel .timeline')).not.toBeNull();
    const hrefs = [...el(harness).querySelectorAll('app-area-panel a')].map((a) => a.getAttribute('href'));
    expect(hrefs.every((h) => h === '/' || ['/about', '/experience', '/projects', '/engineering', '/cv', '/contact'].includes(h!) || h!.startsWith('/projects/'))).toBe(true);
  });

  it('never shows placeholder identifiers to visitors in production mode', async () => {
    const harness = await setup(false);
    for (const url of ['/', '/about', '/experience', '/projects', '/engineering', '/cv', '/contact']) {
      await harness.navigateByUrl(url);
      expect(el(harness).textContent, url).not.toMatch(/YOUR_[A-Z_]+/);
    }
    expect(el(harness).querySelector('h1')?.textContent).toContain('Software development portfolio');
  });

  it('shows placeholders as badges while previewing', async () => {
    const harness = await setup(true);
    await harness.navigateByUrl('/');
    expect(el(harness).querySelector('h1 .placeholder-badge')?.textContent).toContain('YOUR_NAME');
  });

  it('serves the French interface under /fr', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/fr/contact');
    expect(heading(harness)).toContain('Salon');
    expect(el(harness).querySelector('[data-area-link]')?.getAttribute('href')).toBe('/fr/about');
  });

  it('still reports unknown pages', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/basement');
    expect(el(harness).querySelector('app-office-scene')).toBeNull();
    expect(el(harness).textContent).toContain('This room does not exist');
  });
});

describe('Home welcome popup', () => {
  const dock = (h: RouterTestingHarness) => h.routeNativeElement!.querySelector('.welcome-dock')!;

  it('opens on the first visit and collapses into a button once closed', async () => {
    const storage = memoryStorage();
    const harness = await setup(false, storage);
    await harness.navigateByUrl('/');
    await harness.fixture.whenStable();
    expect(dock(harness).classList).toContain('is-hidden');

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.welcome-close')!.click();
    await harness.fixture.whenStable();
    expect(dock(harness).classList).not.toContain('is-hidden');
    expect(dock(harness).classList).toContain('is-expanded');
    expect(storage.data['portfolio.welcome-seen']).toBe('1');
  });

  it('stays collapsed for returning visitors and can be reopened', async () => {
    const harness = await setup(false, memoryStorage({ 'portfolio.welcome-seen': '1' }));
    await harness.navigateByUrl('/');
    await harness.fixture.whenStable();
    expect(dock(harness).classList).not.toContain('is-hidden');

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.welcome-button')!.click();
    await harness.fixture.whenStable();
    expect(dock(harness).classList).toContain('is-hidden');
  });

  it('does not cover a shared link to an area', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/projects');
    await harness.fixture.whenStable();
    expect(dock(harness).classList).not.toContain('is-hidden');
  });
});

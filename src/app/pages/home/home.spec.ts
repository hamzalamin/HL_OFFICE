import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { BlogPostMeta } from '../../../content';
import { BLOG_SOURCE, BlogSource } from '../../core/content/blog.service';
import { SHOW_PLACEHOLDERS } from '../../core/content/placeholder';
import { PANEL_DELAY_FRAMES } from '../../office/office-focus';
import { WELCOME_STORAGE, WelcomeStorage } from './welcome-memory';

function memoryStorage(initial: Record<string, string> = {}): WelcomeStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
}

/** A draft post in English only, so the tests do not depend on real posts. */
const BLOG: BlogSource = {
  posts: [
    { slug: 'sample-post', lang: 'en', title: 'Sample post', date: '2026-11-21', summary: 'A sample.', tags: ['test'], minutes: 1, draft: true, source: 'file', updated: '' },
  ],
  bodies: { 'en/sample-post': () => Promise.resolve('<h3>Sample heading</h3><p>Body.</p>') },
  // No live API, as on the dev server: the built posts are used.
  live: { list: () => Promise.reject(new Error('offline')), body: () => Promise.reject(new Error('offline')) },
};

/** A database post that was in the build, and the live API as it is now. */
const built: BlogPostMeta = { slug: 'old-post', lang: 'en', title: 'Old post', date: '2026-11-01', summary: '', tags: [], minutes: 1, draft: false, source: 'db', updated: '2026-11-01T10:00:00.000Z' };
const fresh: BlogPostMeta = { ...built, slug: 'new-post', title: 'New post', date: '2026-11-22', updated: '2026-11-22T10:00:00.000Z' };
function liveBlog(live: BlogPostMeta[]): BlogSource {
  return {
    posts: [built],
    bodies: { 'en/old-post': () => Promise.resolve('<p>Built body.</p>') },
    live: { list: () => Promise.resolve([...live]), body: (slug) => Promise.resolve(`<p>Live body of ${slug}.</p>`) },
  };
}

let blogSource: BlogSource = BLOG;

async function setup(showPlaceholders: boolean, storage: WelcomeStorage = memoryStorage()) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      { provide: SHOW_PLACEHOLDERS, useValue: showPlaceholders },
      { provide: WELCOME_STORAGE, useValue: storage },
      { provide: BLOG_SOURCE, useFactory: () => blogSource },
      // Tests check the panel right after navigating: no frame delay.
      { provide: PANEL_DELAY_FRAMES, useValue: 0 },
    ],
  });
  return RouterTestingHarness.create();
}

describe('Home (office)', () => {
  const el = (h: RouterTestingHarness) => h.routeNativeElement!;
  const heading = (h: RouterTestingHarness) => el(h).querySelector('app-area-panel h2, app-focus-sheet h2')?.textContent ?? '';
  const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

  it('lists every area as a link to its place in the office', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/');
    const links = el(harness).querySelectorAll<HTMLAnchorElement>('[data-area-link]');
    expect(links.length).toBe(7);
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
    for (const url of ['/about', '/projects', '/projects/qatrat-hayat', '/contact', '/']) {
      await harness.navigateByUrl(url);
      expect(el(harness).querySelector('app-office-scene'), url).toBe(scene);
    }
  });

  it('opens a project case study on its own URL, in a sheet over its board', async () => {
    const harness = await setup(true);
    await harness.navigateByUrl('/projects/qatrat-hayat');
    expect(el(harness).querySelector('app-focus-sheet dialog app-project-case-study')).not.toBeNull();
    expect(el(harness).querySelector('app-focus-sheet .back')?.getAttribute('href')).toBe('/projects');
    expect(el(harness).querySelector('.board.is-active')?.getAttribute('data-board')).toBe('qatrat-hayat');
    // The room's folio steps aside while the sheet is open, and comes back after.
    expect(el(harness).querySelector('app-area-panel')).toBeNull();
    await harness.navigateByUrl('/projects');
    expect(el(harness).querySelector('app-focus-sheet')).toBeNull();
    expect(heading(harness)).toContain('Project wall');
  });

  it('keeps a dock of the seven rooms, marking the current one', async () => {
    const harness = await setup(false);
    const dock = () => el(harness).querySelector('app-room-dock')!;
    await harness.navigateByUrl('/');
    const links = [...dock().querySelectorAll<HTMLAnchorElement>('[data-dock-link]')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/about', '/skills', '/projects', '/experience', '/cv', '/blog', '/contact']);
    expect(dock().querySelector('[aria-current="page"]')?.classList).toContain('is-overview');
    for (const [url, id] of [['/cv', 'library'], ['/projects/itlens', 'projects'], ['/fr/experience', 'meeting']]) {
      await harness.navigateByUrl(url);
      expect(dock().querySelector('[aria-current="page"]')?.getAttribute('data-dock-link'), url).toBe(id);
    }
    expect(dock().querySelector('[data-dock-link="reception"]')?.getAttribute('href')).toBe('/fr/about');
  });

  describe('blog', () => {
    afterEach(() => (blogSource = BLOG));

    it('shows a post published after the build, from the live API', async () => {
      blogSource = liveBlog([fresh, built]);
      const harness = await setup(false);
      await harness.navigateByUrl('/blog/new-post');
      await harness.fixture.whenStable();
      expect(heading(harness)).toContain('New post');
      expect(el(harness).querySelector('.blog-post-prose')?.textContent).toContain('Live body of new-post.');
    });

    it('keeps the built copy of an unchanged post, and drops a deleted one', async () => {
      blogSource = liveBlog([built]);
      const harness = await setup(false);
      await harness.navigateByUrl('/blog/old-post');
      await harness.fixture.whenStable();
      expect(el(harness).querySelector('.blog-post-prose')?.textContent).toContain('Built body.');
      blogSource = liveBlog([]);
      TestBed.resetTestingModule();
      const again = await setup(false);
      await again.navigateByUrl('/blog/old-post');
      await again.fixture.whenStable();
      expect(el(again).querySelector('app-focus-sheet')).toBeNull();
      expect(el(again).querySelector('app-area-panel .notice')).not.toBeNull();
    });

    it('keeps drafts off the live site', async () => {
      const harness = await setup(false);
      await harness.navigateByUrl('/blog');
      expect(heading(harness)).toContain('Blog');
      expect(el(harness).querySelector('app-blog-list .post-card')).toBeNull();
      expect(el(harness).querySelector('app-blog-list .empty')).not.toBeNull();
      // A draft's link falls back to the blog, as an unknown post.
      await harness.navigateByUrl('/blog/sample-post');
      await harness.fixture.whenStable();
      expect(el(harness).querySelector('app-focus-sheet')).toBeNull();
      expect(el(harness).querySelector('app-area-panel .notice')).not.toBeNull();
    });

    it('lists posts and opens one in the reading sheet', async () => {
      const harness = await setup(true);
      await harness.navigateByUrl('/blog');
      const card = el(harness).querySelector<HTMLAnchorElement>('app-blog-list .post-card');
      expect(card?.getAttribute('href')).toBe('/blog/sample-post');
      await harness.navigateByUrl('/blog/sample-post');
      await harness.fixture.whenStable();
      expect(heading(harness)).toContain('Sample post');
      expect(el(harness).querySelector('app-focus-sheet .back')?.getAttribute('href')).toBe('/blog');
      expect(el(harness).querySelector('.blog-post-prose h3')?.textContent).toContain('Sample heading');
    });

    it('shows a post written in the other language, and says so', async () => {
      const harness = await setup(true);
      await harness.navigateByUrl('/fr/blog/sample-post');
      await harness.fixture.whenStable();
      expect(el(harness).querySelector('.blog-post-note')?.textContent).toContain('rédigé en anglais');
    });
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
    await harness.navigateByUrl('/projects/qatrat-hayat');
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
    expect(el(harness).querySelector('app-area-panel .journey')).not.toBeNull();
    const hrefs = [...el(harness).querySelectorAll('app-area-panel a')].map((a) => a.getAttribute('href'));
    expect(hrefs.every((h) => h === '/' || ['/about', '/skills', '/projects', '/experience', '/cv', '/blog', '/contact'].includes(h!) || h!.startsWith('/experience/'))).toBe(true);
  });

  it('never shows placeholder identifiers to visitors in production mode', async () => {
    const harness = await setup(false);
    for (const url of ['/', '/about', '/experience', '/projects', '/skills', '/cv', '/contact', '/projects/qatrat-hayat', '/projects/api-stress-lab', '/fr/projects/qatrat-hayat', '/fr/about']) {
      await harness.navigateByUrl(url);
      expect(el(harness).textContent, url).not.toMatch(/YOUR_[A-Z_]+/);
    }
    expect(el(harness).querySelector('h1')?.textContent).toContain('Hamza Lamin');
  });

  it('shows details still to confirm as badges while previewing', async () => {
    const harness = await setup(true);
    await harness.navigateByUrl('/projects/qatrat-hayat');
    expect(el(harness).querySelector('app-project-case-study .placeholder-badge')?.textContent).toContain('YOUR_PROJECT');
  });

  it('opens a real project from its URL, with only verified links', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/projects/api-stress-lab');
    expect(heading(harness)).toContain('API Stress Lab');
    const links = [...el(harness).querySelectorAll('app-project-case-study a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['https://github.com/hamzalamin/API-StressLab', 'https://hamzalamin.github.io/api-stress-lab-docs/']);

    await harness.navigateByUrl('/projects/qatrat-hayat');
    expect(heading(harness)).toContain('Qatrat Hayat');
    expect(el(harness).querySelector('[lang="ar"]')?.textContent).toContain('قطرة حياة');
    expect(el(harness).querySelectorAll('app-project-case-study a').length).toBe(0);
  });

  it('switches the content with the language', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/experience');
    expect(el(harness).querySelector('.journey .role-title')?.textContent).toContain('Software Developer');
    await harness.navigateByUrl('/fr/experience');
    expect(el(harness).querySelector('.journey .role-title')?.textContent).toContain('Développeur logiciel');
    await harness.navigateByUrl('/fr/projects/itlens');
    expect(el(harness).textContent).toContain('Développée selon les principes du développement piloté par les tests.');
  });

  it('serves the French interface under /fr', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/fr/contact');
    expect(heading(harness)).toContain('Salon');
    expect(el(harness).querySelector('[data-area-link]')?.getAttribute('href')).toBe('/fr/about');
  });

  it('renders the street around the office, with a way in', async () => {
    const harness = await setup(false);
    const router = TestBed.inject(Router);
    await harness.navigateByUrl('/');
    expect(el(harness).querySelectorAll('[data-ped]').length).toBeGreaterThan(10);
    el(harness).querySelector<SVGElement>('.entrance')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await harness.fixture.whenStable();
    expect(router.url).toBe('/about');
  });

  describe('meeting room: professional experience', () => {
    it('presents the journey: employers on the timeline, freelance on its own track', async () => {
      const harness = await setup(false);
      await harness.navigateByUrl('/experience');
      const panel = el(harness).querySelector('app-area-panel')!;
      expect([...panel.querySelectorAll('.employer')].map((e) => e.textContent!.trim())).toEqual(['Eurafric Information', 'Ecowatt']);
      const roles = [...panel.querySelectorAll('.role')].map((r) => r.getAttribute('href'));
      expect(roles).toEqual(['/experience/eurafric-developer', '/experience/eurafric-intern', '/experience/ecowatt-intern']);
      const parallel = panel.querySelector<HTMLElement>('.parallel')!;
      expect(parallel.getAttribute('href')).toBe('/experience/freelance');
      expect(parallel.textContent).toContain('Alongside my studies and internships');
      expect(parallel.textContent).not.toMatch(/20\d\d/); // No invented dates.
      // Drawn beside the two internships (rows 3 to 5), not the current position.
      expect(parallel.style.gridRow.replace(/\s/g, '')).toBe('3/6');
      expect(el(harness).querySelectorAll('.folder-hit').length).toBe(4);
    });

    it('opens an experience with an overview, then its responsibilities and technologies', async () => {
      const harness = await setup(false);
      await harness.navigateByUrl('/experience/eurafric-intern');
      const panel = () => el(harness).querySelector('app-focus-sheet')!;
      expect(heading(harness)).toContain('Software Developer Intern');
      expect(panel().textContent).toContain('April 2025 – July 2025');
      expect(panel().textContent).toContain('Banking settlement system');
      expect(panel().querySelector('.bullets')).toBeNull();
      panel().querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
      await harness.fixture.whenStable();
      expect(panel().querySelectorAll('.bullets li').length).toBe(5);
      expect([...panel().querySelectorAll('.chips li')].map((c) => c.textContent!.trim())).toEqual(['Java', 'Spring Boot', 'Angular', 'Oracle', 'JWT', 'Docker']);
      // Grouped with the later position at the same employer.
      expect(panel().querySelector('.also-link')?.getAttribute('href')).toBe('/experience/eurafric-developer');
    });

    it('shows freelance work without dates, stack or client details', async () => {
      const harness = await setup(false);
      await harness.navigateByUrl('/experience/freelance');
      const panel = () => el(harness).querySelector('app-focus-sheet')!;
      expect(panel().querySelector('.when')?.textContent).toContain('Alongside my studies and internships');
      expect(panel().querySelector('.scale')?.textContent).toContain('3+ client projects');
      panel().querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
      await harness.fixture.whenStable();
      expect(panel().querySelector('.chips')).toBeNull();
      expect(panel().querySelector('.note')?.textContent).toContain('Different technologies');
      expect(panel().querySelector('.projects')).toBeNull();
      expect(panel().textContent).not.toMatch(/20\d\d/);
    });

    it('goes back from an experience to the journey, and switches language in place', async () => {
      const harness = await setup(false);
      const router = TestBed.inject(Router);
      await harness.navigateByUrl('/experience/ecowatt-intern');
      escape();
      await harness.fixture.whenStable();
      expect(router.url).toBe('/experience');
      await harness.navigateByUrl('/fr/experience/eurafric-intern');
      expect(heading(harness)).toContain('Stagiaire développeur logiciel');
      expect(el(harness).textContent).toContain('Avril 2025 – Juillet 2025');
    });
  });

  it('offers both CV versions in the library, in either language', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/fr/cv');
    const links = [...el(harness).querySelectorAll('.cv-options a')].map((x) => x.getAttribute('href'));
    expect(links).toEqual(['/cv/HamzaLamin_SoftwareDeveloper_CV.pdf', '/cv/HamzaLamin_DeveloppeurLogiciel_CV.pdf']);
    expect(el(harness).querySelector('.cv-options button')?.textContent).toContain('Les deux versions');
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

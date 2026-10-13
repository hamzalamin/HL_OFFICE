import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { SHOW_PLACEHOLDERS } from '../../core/content/placeholder';

async function setup(showPlaceholders: boolean) {
  TestBed.configureTestingModule({
    providers: [provideRouter(routes), { provide: SHOW_PLACEHOLDERS, useValue: showPlaceholders }],
  });
  return RouterTestingHarness.create();
}

describe('Home (office)', () => {
  it('lists every area as a link to its panel', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/');
    const links = harness.routeNativeElement!.querySelectorAll<HTMLAnchorElement>('[data-area-link]');
    expect(links.length).toBe(6);
    expect(links[0].getAttribute('href')).toBe('/?area=reception');
  });

  it('opens the area panel from the URL and closes it again', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/?area=library');
    expect(harness.routeNativeElement!.querySelector('app-area-panel h2')?.textContent).toContain('Library');
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement!.querySelector('app-area-panel')).toBeNull();
  });

  it('ignores unknown areas', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/?area=basement');
    expect(harness.routeNativeElement!.querySelector('app-area-panel')).toBeNull();
  });

  it('never shows placeholder identifiers to visitors in production mode', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/?area=reception');
    expect(harness.routeNativeElement!.textContent).not.toMatch(/YOUR_[A-Z_]+/);
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toContain('Software development portfolio');
  });

  it('shows placeholders as badges while previewing', async () => {
    const harness = await setup(true);
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement!.querySelector('h1 .placeholder-badge')?.textContent).toContain('YOUR_NAME');
  });

  it('serves the French interface under /fr', async () => {
    const harness = await setup(false);
    await harness.navigateByUrl('/fr?area=lounge');
    expect(harness.routeNativeElement!.querySelector('app-area-panel h2')?.textContent).toContain('Salon');
    expect(harness.routeNativeElement!.querySelector('[data-area-link]')?.getAttribute('href')).toBe('/fr?area=reception');
  });
});

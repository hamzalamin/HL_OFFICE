import { Experience } from '../../content';
import { UiStrings } from '../core/i18n/ui-strings';

/**
 * How an experience's time is described: confirmed dates ("April 2025 –
 * July 2025", "September 2025 – Present"), or what it ran alongside when
 * the dates are not confirmed. Never an invented date.
 */
export function periodText(e: Experience, t: UiStrings): string {
  if (!e.period) return e.alongside ?? '';
  return `${e.period.start} – ${e.period.end ?? t.career.present}`;
}

export type JourneyRow = { kind: 'employer'; organization: string } | { kind: 'role'; experience: Experience; first: boolean };

/**
 * The career timeline as grid rows: an employer heading, then its roles,
 * newest first. Parallel work gets the rows it ran alongside, so its track
 * can be drawn beside exactly those entries without any dates.
 */
export function journey(list: readonly Experience[]): { rows: JourneyRow[]; parallel: { experience: Experience; from: number; to: number }[] } {
  const rows: JourneyRow[] = [];
  for (const g of careerTracks(list).employers) {
    rows.push({ kind: 'employer', organization: g.organization });
    g.roles.forEach((experience, i) => rows.push({ kind: 'role', experience, first: rows.length === 1 && i === 0 }));
  }
  const parallel = careerTracks(list).parallel.map((experience) => {
    const idx = rows.map((r, i) => (r.kind === 'role' && experience.overlaps?.includes(r.experience.id) ? i : -1)).filter((i) => i >= 0);
    // Without known overlaps, run beside the whole timeline.
    return { experience, from: idx.length ? idx[0] + 1 : 1, to: idx.length ? idx[idx.length - 1] + 2 : rows.length + 1 };
  });
  return { rows, parallel };
}

/** Timeline positions grouped by employer, in display order; parallel work kept apart. */
export function careerTracks(list: readonly Experience[]): { employers: { organization: string; roles: Experience[] }[]; parallel: Experience[] } {
  const employers: { organization: string; roles: Experience[] }[] = [];
  for (const e of list.filter((x) => x.track === 'timeline')) {
    const last = employers[employers.length - 1];
    if (last?.organization === e.organization) last.roles.push(e);
    else employers.push({ organization: e.organization, roles: [e] });
  }
  return { employers, parallel: list.filter((x) => x.track === 'parallel') };
}

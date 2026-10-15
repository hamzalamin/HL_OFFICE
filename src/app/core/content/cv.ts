import { Cv, Lang } from '../../../content';
import { isProvided } from './placeholder';

export interface CvOption {
  lang: Lang;
  href: string;
  /** File name kept on download (it already says who and what). */
  name: string;
}

const ORDER: readonly Lang[] = ['en', 'fr'];

/** The CV versions that actually exist, English first. */
export function cvOptions(cv: Cv): CvOption[] {
  return ORDER.filter((l) => isProvided(cv.files?.[l])).map((lang) => {
    const path = cv.files![lang]!;
    return { lang, href: '/' + path, name: path.split('/').pop()! };
  });
}

/**
 * Downloads several files from one click. Browsers handle one download per
 * click best, so they are started a moment apart.
 */
export function downloadAll(options: readonly CvOption[], doc: Document): void {
  options.forEach((o, i) =>
    setTimeout(() => {
      const a = doc.createElement('a');
      a.href = o.href;
      a.download = o.name;
      doc.body.appendChild(a);
      a.click();
      a.remove();
    }, i * 400),
  );
}

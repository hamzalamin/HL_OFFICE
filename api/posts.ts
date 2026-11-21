import { database, json, readingMinutes, renderMarkdown } from './_shared';

const CACHE = 'public, max-age=0, s-maxage=10, stale-while-revalidate=60';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface Row {
  slug: string;
  lang: 'en' | 'fr';
  title: string;
  date: string;
  summary: string;
  tags: string[];
  body: string;
  updated: string;
}

function meta(r: Row) {
  return {
    slug: r.slug,
    lang: r.lang,
    title: r.title,
    date: r.date,
    summary: r.summary,
    tags: r.tags,
    minutes: readingMinutes(r.body),
    draft: false,
    source: 'db' as const,
    updated: r.updated,
  };
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const lang = url.searchParams.get('lang');
  try {
    const sql = await database();
    if (slug !== null || lang !== null) {
      if (!slug || !SLUG.test(slug) || (lang !== 'en' && lang !== 'fr')) return json({ error: 'Unknown post.' }, 400);
      const rows = (await sql`
        SELECT slug, lang, title, to_char(date, 'YYYY-MM-DD') AS date, summary, tags, body,
               to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated
        FROM blog_posts WHERE slug = ${slug} AND lang = ${lang} AND NOT draft`) as Row[];
      if (!rows.length) return json({ error: 'Not found.' }, 404, CACHE);
      return json({ post: meta(rows[0]), html: await renderMarkdown(rows[0].body) }, 200, CACHE);
    }
    const rows = (await sql`
      SELECT slug, lang, title, to_char(date, 'YYYY-MM-DD') AS date, summary, tags, body,
             to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated
      FROM blog_posts WHERE NOT draft ORDER BY date DESC, slug`) as Row[];
    return json({ posts: rows.map(meta) }, 200, CACHE);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { Marked as MarkedType } from 'marked' with { 'resolution-mode': 'import' };

export type Sql = NeonQueryFunction<false, false>;

export async function database(): Promise<Sql> {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is not set.');
  const sql = neon(url);
  await sql`
    CREATE TABLE IF NOT EXISTS blog_posts (
      slug       text        NOT NULL,
      lang       text        NOT NULL CHECK (lang IN ('en', 'fr')),
      title      text        NOT NULL,
      date       date        NOT NULL,
      summary    text        NOT NULL DEFAULT '',
      tags       text[]      NOT NULL DEFAULT '{}',
      body       text        NOT NULL,
      draft      boolean     NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (slug, lang)
    )`;
  return sql;
}

export function json(body: unknown, status = 200, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });
}

let markdown: Promise<MarkedType> | undefined;
const loadMarkdown = () => (markdown ??= import('marked').then(({ Marked }) => new Marked({
  renderer: {
    heading({ tokens, depth }) {
      const level = Math.min(depth + 1, 6);
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const t = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
      const external = /^https?:\/\//.test(href) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${href.replace(/"/g, '%22')}"${t}${external}>${text}</a>`;
    },
  },
})));

export async function renderMarkdown(body: string): Promise<string> {
  return (await loadMarkdown()).parse(body, { async: false });
}

export function readingMinutes(body: string): number {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));
}

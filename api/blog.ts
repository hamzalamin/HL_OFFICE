// The blog's private write API (a Vercel function at /api/blog).
//
//   GET    /api/blog                       all posts, drafts included (for the /write page)
//   POST   /api/blog   { post }            create or update a post (by slug + lang)
//   DELETE /api/blog?slug=..&lang=..       delete a post
//
// Every request needs `Authorization: Bearer <BLOG_ADMIN_PASSWORD>`.
// After a change it calls the Vercel deploy hook: the site rebuilds and the
// build reads the posts from Neon (scripts/blog.mjs), so every post is a
// prerendered page.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   DATABASE_URL            Neon connection string
//   BLOG_ADMIN_PASSWORD     the /write password (at least 16 characters)
//   VERCEL_DEPLOY_HOOK_URL  Vercel → Settings → Git → Deploy Hooks

import { neon } from '@neondatabase/serverless';
import { createHash, timingSafeEqual } from 'node:crypto';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LANGS = ['en', 'fr'];

interface PostInput {
  slug: string;
  lang: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  body: string;
  draft: boolean;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** Constant-time password check. A wrong password also waits a second, to slow down guessing. */
async function authorized(request: Request): Promise<boolean> {
  const expected = process.env['BLOG_ADMIN_PASSWORD'] ?? '';
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const digest = (s: string) => createHash('sha256').update(s).digest();
  const ok = expected.length >= 16 && timingSafeEqual(digest(given), digest(expected));
  if (!ok) await new Promise((r) => setTimeout(r, 1000));
  return ok;
}

async function database() {
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

/** Asks Vercel to rebuild the site, so the change goes live. */
async function rebuild(): Promise<boolean> {
  const hook = process.env['VERCEL_DEPLOY_HOOK_URL'];
  if (!hook) return false;
  try {
    return (await fetch(hook, { method: 'POST' })).ok;
  } catch {
    return false;
  }
}

/** Checks and normalises a post sent by the /write page; returns an error message or the post. */
function validate(input: unknown): string | PostInput {
  if (!input || typeof input !== 'object') return 'Missing post.';
  const p = input as Record<string, unknown>;
  const str = (k: string) => (typeof p[k] === 'string' ? (p[k] as string).trim() : '');
  const post: PostInput = {
    slug: str('slug'),
    lang: str('lang'),
    title: str('title'),
    date: str('date'),
    summary: str('summary'),
    tags: Array.isArray(p['tags']) ? p['tags'].filter((t): t is string => typeof t === 'string').map((t) => t.trim()).filter(Boolean) : [],
    body: typeof p['body'] === 'string' ? p['body'] : '',
    draft: p['draft'] !== false,
  };
  if (!SLUG.test(post.slug) || post.slug.length > 100) return 'The link name must be lowercase words joined by dashes, e.g. my-first-idea.';
  if (!LANGS.includes(post.lang)) return 'Language must be en or fr.';
  if (!post.title || post.title.length > 200) return 'A title is required (200 characters at most).';
  if (!DATE.test(post.date) || Number.isNaN(Date.parse(post.date))) return 'The date must be YYYY-MM-DD.';
  if (post.summary.length > 500) return 'The summary is 500 characters at most.';
  if (post.tags.length > 10 || post.tags.some((t) => t.length > 40)) return 'At most 10 tags of 40 characters.';
  if (!post.body.trim()) return 'The post is empty.';
  if (post.body.length > 200_000) return 'The post is too long.';
  return post;
}

export async function GET(request: Request): Promise<Response> {
  if (!(await authorized(request))) return json({ error: 'Wrong password.' }, 401);
  try {
    const sql = await database();
    const posts = await sql`
      SELECT slug, lang, title, to_char(date, 'YYYY-MM-DD') AS date, summary, tags, body, draft, updated_at
      FROM blog_posts ORDER BY date DESC, slug`;
    return json({ posts });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!(await authorized(request))) return json({ error: 'Wrong password.' }, 401);
  let input: unknown;
  try {
    input = ((await request.json()) as { post?: unknown }).post;
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  const post = validate(input);
  if (typeof post === 'string') return json({ error: post }, 400);
  try {
    const sql = await database();
    await sql`
      INSERT INTO blog_posts (slug, lang, title, date, summary, tags, body, draft)
      VALUES (${post.slug}, ${post.lang}, ${post.title}, ${post.date}, ${post.summary}, ${post.tags}, ${post.body}, ${post.draft})
      ON CONFLICT (slug, lang) DO UPDATE SET
        title = EXCLUDED.title, date = EXCLUDED.date, summary = EXCLUDED.summary, tags = EXCLUDED.tags,
        body = EXCLUDED.body, draft = EXCLUDED.draft, updated_at = now()`;
    return json({ ok: true, rebuilding: await rebuild() });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  if (!(await authorized(request))) return json({ error: 'Wrong password.' }, 401);
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') ?? '';
  const lang = url.searchParams.get('lang') ?? '';
  if (!SLUG.test(slug) || !LANGS.includes(lang)) return json({ error: 'Unknown post.' }, 400);
  try {
    const sql = await database();
    await sql`DELETE FROM blog_posts WHERE slug = ${slug} AND lang = ${lang}`;
    return json({ ok: true, rebuilding: await rebuild() });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}

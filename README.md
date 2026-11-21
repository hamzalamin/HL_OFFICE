# Portfolio — interactive isometric office

An Angular 22 portfolio presented as an isometric software office. The office is drawn
as inline SVG from code (no image assets), every route is prerendered to static HTML,
and the site is available in English (`/`) and French (`/fr`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Dev server on http://localhost:4200 (placeholders visible as badges) |
| `npm run build` | Production build + prerender into `dist/portfolio/browser` |
| `npm test` | Unit and component tests (Vitest) |
| `npm run blog` | Regenerate the blog from its Markdown (runs automatically before the commands above) |

## Where things live

| Path | Contents |
| --- | --- |
| `src/content/` | **All personal content** (`en.ts`, `fr.ts`, `shared.ts`, `types.ts`) |
| `src/content/blog/` | **Blog posts** as Markdown (`en/`, `fr/`); `generated/` is built from them |
| `src/app/core/i18n/ui-strings.ts` | Interface text in both languages |
| `src/app/office/engine/` | Isometric projection and depth sorting |
| `src/app/office/scene/` | Furniture builders, office layout, area definitions |
| `src/app/office/office-scene/` | Scene component, camera, materials (colours) |
| `src/app/pages/` | Routed pages |

Values starting with `YOUR_` are placeholders: shown as dashed badges in development,
hidden from visitors in the production build. A full content guide follows in a later phase.


## Blog

The blog is the writing corner in the office (`/blog`). Posts come from two places, merged at
build time by `scripts/blog.mjs` into `src/content/blog/generated/` (not committed):

1. **Neon**, written from the private page **`/write`** (password protected, not linked, not indexed).
2. **Markdown files** in `src/content/blog/en/` and `src/content/blog/fr/` (optional).

Publishing from `/write` saves the post to Neon through the Vercel function `api/blog.ts`, then calls
a Vercel deploy hook: the site rebuilds, reads the posts from Neon and prerenders a page for each
one (live in about a minute). Drafts are only shown in local dev builds. A post written in one
language is shown in both, with a note saying which language it is in.

### One-time setup

1. **Neon**: create a project at neon.tech (or add the Neon integration from the Vercel
   Marketplace, which sets `DATABASE_URL` for you). The `blog_posts` table is created on the first save.
2. **Deploy hook**: Vercel → Project → Settings → Git → Deploy Hooks → create one for `main`.
3. **Environment variables** (Vercel → Project → Settings → Environment Variables, all environments):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon connection string (`postgresql://…?sslmode=require`) |
   | `BLOG_ADMIN_PASSWORD` | Your `/write` password, **16 characters or more** |
   | `VERCEL_DEPLOY_HOOK_URL` | The deploy hook URL from step 2 |

4. Redeploy once. `vercel.json` makes Vercel run `npm run build`, which generates the blog first.

Locally, copy `.env.example` to `.env` with your `DATABASE_URL` to see the database posts with
`npm start` (run `npm run blog` to pull new ones). `/write` itself needs the API, so it works on
Vercel (or with `vercel dev`), not with `ng serve`.

### Markdown posts (optional)

A file such as `src/content/blog/en/my-idea.md` is published at `/blog/my-idea`:

```
---
title: My first idea
date: 2026-11-21
summary: One or two sentences for the card in the office.
tags: [ideas, angular]
draft: true
---
```

`title` and `date` (YYYY-MM-DD) are required; `draft: true` keeps it off the live site. The same
link cannot exist both as a file and in the database.

## Demo
 https://hl-office-portfolio.vercel.app/

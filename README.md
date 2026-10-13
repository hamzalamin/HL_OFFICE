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

## Where things live

| Path | Contents |
| --- | --- |
| `src/content/` | **All personal content** (`en.ts`, `fr.ts`, `shared.ts`, `types.ts`) |
| `src/app/core/i18n/ui-strings.ts` | Interface text in both languages |
| `src/app/office/engine/` | Isometric projection and depth sorting |
| `src/app/office/scene/` | Furniture builders, office layout, area definitions |
| `src/app/office/office-scene/` | Scene component, camera, materials (colours) |
| `src/app/pages/` | Routed pages |

Values starting with `YOUR_` are placeholders: shown as dashed badges in development,
hidden from visitors in the production build. A full content guide follows in a later phase.

# Kalender

A shared, public year calendar (German UI) with Baden-Württemberg school holidays.
Months are laid out as columns, days as rows. Anyone who opens the site can add, edit and delete whole-day entries; there are no accounts.

## Stack

| Part | Choice | Why |
| --- | --- | --- |
| Frontend | React 19 + TypeScript + Vite | Largest ecosystem, easy to hand over |
| API | Cloudflare Pages Functions + [Hono](https://hono.dev) | One file (`functions/api/[[route]].ts`), deploys with the site |
| Database | Cloudflare D1 (SQLite) | Included in the Cloudflare free plan, plain SQL migrations |
| Icons | Heroicons (`@heroicons/react`) | |
| Typeface | Inter (self-hosted via `@fontsource-variable/inter`) | Self-hosted, so no requests go to Google Fonts (GDPR) |

No CSS framework: the styles live in one file (`src/styles.css`) with design tokens at the top.

## Project layout

```
functions/api/[[route]].ts   REST API: GET/POST /api/entries, PUT/DELETE /api/entries/:id
migrations/                  D1 schema (wrangler d1 migrations)
shared/entry.ts              Types, color presets and validation shared by app and API
src/App.tsx                  Shell, year picker, scrolling, sheets
src/components/              MonthColumn (grid + bars), EntryForm, EntryDetails, Sheet, YearPicker
src/data/schulferien-bw.ts   School holiday dates (update yearly, see source note in the file)
src/lib/                     Date helpers (Europe/Berlin), lane layout, API client
```

## Local development

```bash
npm install
npm run db:migrate:local   # creates the local D1 database in .wrangler/
```

Pick one of these:

- **Full stack, production-like:** `npm run preview` builds and serves `dist` plus the API on http://localhost:8788.
- **Frontend with hot reload:** run `npm run build` once, then `npm run dev:api` (API on :8788) and `npm run dev` (Vite on :5173, which proxies `/api`) side by side.

## Deploying to Cloudflare Pages (free plan)

```bash
npx wrangler login
npx wrangler d1 create kalender-db        # copy the printed database_id into wrangler.toml
npm run db:migrate:remote
npm run deploy                            # creates the Pages project on first run
```

As an alternative, connect the Git repo in the Cloudflare dashboard (build command `npm run build`, output `dist`) and add the D1 binding `DB` under *Settings → Bindings*.

## Behaviour notes

- **Dates** are stored as `YYYY-MM-DD` with no time. "Today" is computed in `Europe/Berlin`, whatever the visitor's device timezone is.
- **Bars** take up the right two thirds of a day cell, so day numbers and weekend colors stay visible. Overlapping entries are split into lanes per month.
- **Layout:** all years form one continuous row of months (Dezember 2026 → Januar 2027 → …), and each month header shows its year. The current month is scrolled to the left edge on load. A spacer column after the last month makes this possible for every month.
- **Years:** the timeline runs from 2026 to max(2028, current year). The year picker jumps to January of a year and highlights the year of the leftmost visible month. To show more years, add Schulferien dates for them.
- **Validation** runs in `shared/entry.ts` on both client and server: name 1–80 characters, preset colors only, end ≥ start, at most 366 days.
- **No abuse protection yet.** The write API is public by design. Before sharing the URL widely, consider a Cloudflare WAF rate-limiting rule on `/api/*` (available on the free plan).

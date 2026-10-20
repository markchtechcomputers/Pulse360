# Pulse360 — live news, sports, music & culture

Everything on the site is fetched automatically; there is no sample content.

## Run
```
npm install
npm start      # http://localhost:3000
```
Deploy on Vercel (framework preset **Other**) — `vercel.json` is already set up.

## How it works
`lib/feeds.js` merges, de-duplicates and caches (5 min) these sources:
- **Google News RSS** — any country (Kenya, Uganda, Tanzania, Rwanda, Ethiopia, Nigeria, Ghana, South Africa, Egypt, Africa, World, USA, UK, Europe, Asia, Middle East) × any topic (news, sports, music, culture, technology, business, agriculture, health, science) × any search text.
- **BBC, CNN, Al Jazeera** RSS (with photos).
- **Kenyans.co.ke** via your scrapers in `lib/kenyans/` (homepage, tracker, search, article).

## Reader features
- Click any story → a preview opens on Pulse360 (photo, summary, "Also reported by", related stories, Share) with a button to read the full story at the source.
- Feeds refresh every minute (server cache 60 s, browser auto-refresh 60 s). Pages paint instantly from the last saved copy.
- "Load more" shows more stories, then fetches older ones (30 days) and also loads automatically as you scroll.
- `public/pulse360-standalone.html` is a no-server version of the same site.

## API
- `GET /api/feed?category=sports&region=uganda&q=football&limit=40`
- `GET /api/search?q=...` (searches everywhere)
- `GET /api/preview?url=` (Kenyans.co.ke short summary)
- `GET /api/feed?...&days=30` (older stories)
- `GET /api/top` (hero stories) · `GET /api/ticker` (breaking ticker)
- `GET /api/kenyans`, `/api/kenyans/tracker`, `/api/kenyans/search?q=`, `/api/kenyans/article?url=`
- `GET /api/meta`, `GET /api/health`

## Notes
- Stories open on the original publisher's site; Pulse360 shows headline, photo and short excerpt only. Don't republish full articles from `/api/kenyans/article` without permission.
- Scrapers depend on the Kenyans.co.ke HTML layout; if it changes, the other sources keep working.
- Social links are placeholders (a "coming soon" toast) — set real URLs in `SOCIAL` in `public/js/layout.js`.
- `.github/workflows/laravel.yml` is for a Laravel project and will fail on this Node app; delete it.

# Pulse360 — News, Sports, Music & Culture

Pulse360 is a responsive news-site starter for Kenyan, African and international coverage. It uses HTML, CSS, browser JavaScript, Node.js and Express, with Vercel serverless routing.

## What works
- Responsive homepage with lead stories, latest stories and category sections
- News, sports, music/entertainment and technology filters
- Story detail pages with related-story cards
- Search endpoint and interactive search panel
- Persistent light/dark theme preference
- Mobile navigation and accessible focus states
- Express API endpoints for health, categories, story lists, search and story details
- Vercel deployment configuration and local Express server

## Run locally
1. Install Node.js 20 or newer.
2. In the project root run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## Deploy to Vercel
1. Import this repository in Vercel and select the `pulse360-vercel-site` branch (or merge its pull request into `main` first).
2. Framework preset: **Other**. Build command can be left blank; the app uses Vercel's Node runtime for `api/index.js`. Output directory is not required.
3. Deploy. Static files are served from `public/`; API routes are configured in `vercel.json`.

## API
- `GET /api/health`
- `GET /api/categories`
- `GET /api/stories?category=sports&q=football&limit=10`
- `GET /api/stories/:slug`
- `POST /api/newsletter` — currently returns HTTP 501 because no email provider/storage is configured.

## Important before public launch
The included stories are **demonstration content**, not a live news feed or verified current reporting. Replace them with sourced editorial content or connect a licensed news API/CMS. Images are remote Unsplash URLs and need a stable media strategy for production. Newsletter delivery, admin login, persistent content management, analytics and user accounts are not configured. Do not present the sample stories as verified breaking news.

The WordPress Kadence child theme remains separately in `wordpress-theme/pulse360-news/`; this Express version is the Vercel-ready website implementation.

# Pulse360 — News, Sports, Music & Culture

Pulse360 is a responsive news-site starter for Kenyan, African and international coverage. It uses HTML, CSS, browser JavaScript, Node.js and Express, with Vercel serverless routing.

## What works
- Responsive homepage with lead stories, latest stories and category sections
- News, sports, music/entertainment and technology filters
- Story detail pages with related-story cards
- Search endpoint, live headline discovery across Kenya/Africa/world, and publisher filters for Kenyans.co.ke, CNN Africa, BBC Africa, Al Jazeera, ESPN and Billboard
- Detailed Explore drawer for regional news, local/African/world sport, music and artists
- Social icon strip using the supplied icons; links show a coming-soon notice until official accounts exist
- About Us, Work with Us, Privacy Policy, Terms of Use, Advertise and Contact information pages
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
- `GET /api/discover?section=news&region=africa&q=politics&source=cnn_africa` — searches live headline RSS results; valid sections: `news`, `sports`, `music`, `entertainment`, `technology`; regions: `kenya`, `africa`, `world`; publisher sources include `all`, `kenyans`, `cnn_africa`, `bbc_africa`, `aljazeera`, `espn`, `billboard`
- `POST /api/newsletter` — currently returns HTTP 501 because no email provider/storage is configured.

## Important before public launch
The included homepage stories are **demonstration content**, not verified reporting. The new discovery page queries Google News RSS and links out to original publishers; feed availability and source coverage depend on the provider. It does not copy full articles. Images are remote Unsplash URLs and need a stable media strategy for production. Newsletter delivery, admin login, persistent content management, analytics, official social accounts and user accounts are not configured. Privacy/terms/careers/contact pages are starter copy and must be reviewed and completed before launch. Do not present sample stories as verified breaking news.

The WordPress Kadence child theme remains separately in `wordpress-theme/pulse360-news/`; this Express version is the Vercel-ready website implementation.

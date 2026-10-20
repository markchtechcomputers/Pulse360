const express = require("express");
const path = require("path");
const { getFeed, getTop, getTicker, getPreview, diagnose, REGIONS, CATEGORIES, K } = require("./lib/feeds");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);
app.use(express.json({ limit: "16kb" }));

// Minimal per-IP rate limit (per serverless instance) to protect upstream sources.
const hits = new Map();
function limiter(max = 120, win = 60000) {
  return (req, res, next) => {
    const ip = (req.headers["x-forwarded-for"] || req.ip || "").toString().split(",")[0].trim();
    const now = Date.now();
    let h = hits.get(ip);
    if (!h || now > h.reset) { h = { n: 0, reset: now + win }; hits.set(ip, h); }
    if (++h.n > max) return res.status(429).json({ error: "Too many requests. Please slow down." });
    if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    next();
  };
}
app.use("/api", limiter());

const send = (res, data, s = 60) => { res.set("Cache-Control", `public, s-maxage=${s}, stale-while-revalidate=${s * 3}`); res.json(data); };
const wrap = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (e) { console.error("[api]", req.path, e.message); res.status(502).json({ error: "Live news is temporarily unavailable. Please try again shortly." }); }
};

app.get("/api/health", (_q, res) => res.json({ ok: true, service: "Pulse360 API", version: "2.0.0", kenyansScrapers: Object.keys(K) }));
app.get("/api/diagnose", wrap(async (_q, res) => { res.set("Cache-Control", "no-store"); res.json({ checkedAt: new Date().toISOString(), results: await diagnose() }); }));
app.get("/api/meta", (_q, res) => send(res, {
  regions: Object.entries(REGIONS).map(([key, v]) => ({ key, label: v.label })),
  categories: Object.entries(CATEGORIES).map(([key, v]) => ({ key, label: v.label }))
}, 3600));

// Main feed: /api/feed?category=sports&region=uganda&q=football&limit=40
app.get("/api/feed", wrap(async (req, res) => send(res, await getFeed(req.query))));
// Search everywhere: /api/search?q=...
app.get("/api/search", wrap(async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 2) return res.json({ q, total: 0, items: [] });
  send(res, await getFeed({ q, region: "all", category: "all", limit: req.query.limit || 20 }), 60);
}));
app.get("/api/top", wrap(async (_q, res) => send(res, await getTop())));
app.get("/api/ticker", wrap(async (_q, res) => send(res, await getTicker(), 60)));

// Kenyans.co.ke scrapers
const needK = fn => (req, res, next) => (K[fn] ? next() : res.status(503).json({ error: "Scraper not available" }));
app.get("/api/kenyans", needK("kenyans"), wrap(async (_q, res) => send(res, await K.kenyans())));
app.get("/api/kenyans/tracker", needK("kenyanstrack"), wrap(async (_q, res) => send(res, await K.kenyanstrack(), 120)));
app.get("/api/kenyans/search", needK("kenyansearch"), wrap(async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 120);
  if (!q) return res.status(400).json({ error: "Missing q" });
  send(res, await K.kenyansearch(q), 120);
}));
app.get("/api/kenyans/article", needK("kenyandetails"), wrap(async (req, res) => {
  let u; try { u = new URL(String(req.query.url || "")); } catch { return res.status(400).json({ error: "Invalid url" }); }
  if (u.protocol !== "https:" || !/^(www\.)?kenyans\.co\.ke$/i.test(u.hostname)) return res.status(400).json({ error: "Only kenyans.co.ke article URLs are allowed." });
  send(res, await K.kenyandetails(u.toString()), 600);
}));

app.get("/api/preview", wrap(async (req, res) => {
  let u; try { u = new URL(String(req.query.url || "")); } catch { return res.status(400).json({ error: "Invalid url" }); }
  if (u.protocol !== "https:" || !/^(www\.)?kenyans\.co\.ke$/i.test(u.hostname)) return res.json({ summary: "" });
  send(res, await getPreview(u.toString()), 600);
}));

app.use("/api", (_q, res) => res.status(404).json({ error: "API endpoint not found" }));

app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.get("*path", (_q, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
// Keep the main feeds warm on long-running servers so pages appear instantly.
if (!process.env.VERCEL && require.main !== module) {
  const warm = () => { getTop().catch(() => {}); getTicker().catch(() => {}); };
  setTimeout(warm, 500); setInterval(warm, 60000).unref();
}
module.exports = app;

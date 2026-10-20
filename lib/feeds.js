// Pulse360 aggregation layer: Google News (any country/topic/search), BBC, CNN, Al Jazeera
// and the Kenyans.co.ke scrapers, merged, de-duplicated and cached.
const { parseRss, idOf } = require("./rss");

let K = {};
for (const n of ["kenyans", "kenyanstrack", "kenyansearch", "kenyandetails"]) {
  try { Object.assign(K, require("./kenyans/" + n)); }
  catch (e) { console.warn("[pulse360] Kenyans scraper '" + n + "' unavailable:", e.message); }
}

const UA = "Mozilla/5.0 (compatible; Pulse360/2.0; +https://pulse360.news)";
const TTL = 60 * 1000; // refresh sources at most once a minute

// ---------- metadata (whitelists) ----------
const ed = gl => ({ hl: "en-" + gl, gl, ceid: gl + ":en" });
const US = ed("US");
const REGIONS = {
  all:          { label: "Everywhere",   term: "" },
  kenya:        { label: "Kenya",        term: "Kenya", ed: ed("KE") },
  uganda:       { label: "Uganda",       term: "Uganda", ed: ed("UG") },
  tanzania:     { label: "Tanzania",     term: "Tanzania", ed: ed("TZ") },
  rwanda:       { label: "Rwanda",       term: "Rwanda", ed: ed("KE") },
  ethiopia:     { label: "Ethiopia",     term: "Ethiopia", ed: ed("ET") },
  nigeria:      { label: "Nigeria",      term: "Nigeria", ed: ed("NG") },
  ghana:        { label: "Ghana",        term: "Ghana", ed: ed("GH") },
  "south-africa": { label: "South Africa", term: '"South Africa"', ed: ed("ZA") },
  egypt:        { label: "Egypt",        term: "Egypt" },
  africa:       { label: "Africa",       term: "Africa" },
  world:        { label: "World",        term: "" },
  usa:          { label: "USA",          term: '"United States" OR USA' },
  uk:           { label: "UK",           term: '"United Kingdom" OR UK OR Britain' },
  europe:       { label: "Europe",       term: "Europe" },
  asia:         { label: "Asia",         term: "Asia" },
  "middle-east":{ label: "Middle East",  term: '"Middle East"' }
};
const CATEGORIES = {
  all:         { label: "All",         term: "" },
  news:        { label: "News",        term: "", topic: "WORLD" },
  sports:      { label: "Sports",      term: "sports OR football OR athletics OR rugby", topic: "SPORTS" },
  music:       { label: "Music",       term: "music OR musician OR album OR concert OR artist" },
  culture:     { label: "Culture",     term: "entertainment OR film OR celebrity OR culture OR arts", topic: "ENTERTAINMENT" },
  technology:  { label: "Technology",  term: "technology OR AI OR startup OR gadgets", topic: "TECHNOLOGY" },
  business:    { label: "Business",    term: "business OR economy OR markets OR finance", topic: "BUSINESS" },
  agriculture: { label: "Agriculture", term: "agriculture OR farming OR farmers OR agribusiness OR crops" },
  health:      { label: "Health",      term: "health OR medicine OR hospital", topic: "HEALTH" },
  science:     { label: "Science",     term: "science OR research OR climate OR space", topic: "SCIENCE" }
};

// Direct publisher feeds (these usually include photos). Failures are tolerated.
const BBC = "https://feeds.bbci.co.uk/";
const CNN = "https://rss.cnn.com/rss/";
const DIRECT = {
  "world:news":       [[BBC + "news/world/rss.xml", "BBC News"], ["https://www.aljazeera.com/xml/rss/all.xml", "Al Jazeera"], [CNN + "edition_world.rss", "CNN"]],
  "africa:news":      [[BBC + "news/world/africa/rss.xml", "BBC News"], [CNN + "edition_africa.rss", "CNN"]],
  "world:sports":     [[BBC + "sport/rss.xml", "BBC Sport"], [CNN + "edition_sport.rss", "CNN"]],
  "world:culture":    [[BBC + "news/entertainment_and_arts/rss.xml", "BBC News"], [CNN + "edition_entertainment.rss", "CNN"]],
  "world:technology": [[BBC + "news/technology/rss.xml", "BBC News"], [CNN + "edition_technology.rss", "CNN"]],
  "world:business":   [[BBC + "news/business/rss.xml", "BBC News"]],
  "world:health":     [[BBC + "news/health/rss.xml", "BBC News"]],
  "world:science":    [[BBC + "news/science_and_environment/rss.xml", "BBC News"]]
};

// ---------- cache + fetch ----------
const cache = new Map();
const inflight = new Map();
async function cached(key, ttl, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.v;
  if (inflight.has(key)) return inflight.get(key);
  const p = fn().then(v => {
    cache.set(key, { t: Date.now(), v });
    if (cache.size > 400) for (const [k, e] of cache) if (Date.now() - e.t > ttl) cache.delete(k);
    return v;
  }).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
async function fetchText(url, timeout = 5000) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
    signal: AbortSignal.timeout(timeout),
    redirect: "follow"
  });
  if (!r.ok) throw new Error("HTTP " + r.status + " for " + url);
  return r.text();
}

// ---------- sources ----------
const gnSearch = (q, e) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${e.hl}&gl=${e.gl}&ceid=${encodeURIComponent(e.ceid)}`;
const gnTopic = (t, e) => `https://news.google.com/rss/headlines/section/topic/${t}?hl=${e.hl}&gl=${e.gl}&ceid=${encodeURIComponent(e.ceid)}`;

async function googleItems({ region, category, q, days = 7 }) {
  const R = REGIONS[region], C = CATEGORIES[category];
  const e = R.ed || US;
  if (!R || !C) return [];

  // Some regional editions return HTTP 200 with an empty RSS document for a
  // tightly quoted query. Retry progressively broader queries before declaring
  // a country feed empty; preserve the requested locale whenever possible.
  const queries = [];
  if (!q && days <= 7 && region === "world" && C.topic) {
    queries.push({ url: gnTopic(C.topic, US), locale: US });
  } else {
    const parts = [];
    if (q) parts.push(q);
    if (R.term) parts.push("(" + R.term + ")");
    if (C.term) parts.push("(" + C.term + ")");
    if (!parts.length) parts.push("world news");
    if (!q || days > 7) parts.push("when:" + days + "d");
    queries.push({ url: gnSearch(parts.join(" "), e), locale: e });

    if (!q && R.term) {
      const broad = [R.label, days <= 7 ? "news" : "news when:" + days + "d"];
      queries.push({ url: gnSearch(broad.join(" "), e), locale: e });
      if (C.term) queries.push({ url: gnSearch([R.label, C.term, "when:" + days + "d"].join(" "), e), locale: e });
    }
  }

  let lastError;
  for (const attempt of queries) {
    try {
      const items = parseRss(await fetchText(attempt.url));
      if (items.length) return items;
    } catch (err) { lastError = err; }

    // Retry the same search using the stable US locale if the regional edition
    // is unavailable or returned no usable articles.
    if (attempt.locale !== US) {
      try {
        const url = attempt.url.replace(/([?&])hl=[^&]+/, "$1hl=" + US.hl)
          .replace(/([?&])gl=[^&]+/, "$1gl=" + US.gl)
          .replace(/([?&])ceid=[^&]+/, "$1ceid=" + encodeURIComponent(US.ceid));
        const items = parseRss(await fetchText(url));
        if (items.length) return items;
      } catch (err) { lastError = err; }
    }
  }
  if (lastError && !queries.length) throw lastError;
  return [];
}

async function directItems(region, category, q) {
  const feeds = DIRECT[(region === "all" ? "world" : region) + ":" + (category === "all" ? "news" : category)] || [];
  const lists = await Promise.allSettled(feeds.map(([u, s]) => fetchText(u).then(x => parseRss(x, { source: s }))));
  let items = lists.flatMap(l => (l.status === "fulfilled" ? l.value : []));
  if (q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    items = items.filter(i => words.every(w => (i.title + " " + i.excerpt).toLowerCase().includes(w)));
  }
  return items;
}

async function kenyansItems(category, q) {
  if (q && K.kenyansearch) {
    const d = await K.kenyansearch(q);
    return (d.results || []).map(r => ({ title: r.title, url: r.url, source: "Kenyans.co.ke", image: r.imageUrl, excerpt: (r.excerpt || "").slice(0, 240), publishedAt: r.date && !Number.isNaN(Date.parse(r.date)) ? new Date(r.date).toISOString() : null }));
  }
  if (!K.kenyans || !["news", "all"].includes(category)) return [];
  const list = await K.kenyans();
  return list
    .filter(a => a.url && ["Latest News", "Top Story", "Featured", "Breaking News"].includes(a.category))
    .map(a => ({ title: a.title, url: a.url, source: "Kenyans.co.ke", image: a.imageUrl || null, excerpt: (a.teaser || "").slice(0, 240), publishedAt: null, dateLabel: a.date || null, breaking: a.category === "Breaking News" }));
}

// ---------- merge ----------
const norm = t => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 70);
function merge(lists, limit) {
  const seen = new Map();
  const dated = [], undated = [];
  for (const it of lists.flat()) {
    const k = norm(it.title);
    if (!k) continue;
    if (!it.id) it.id = idOf(it.url);
    const prev = seen.get(k);
    if (prev) { if (!prev.image && it.image) prev.image = it.image; if (!prev.excerpt && it.excerpt) prev.excerpt = it.excerpt; continue; }
    seen.set(k, it);
    (it.publishedAt ? dated : undated).push(it);
  }
  dated.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  // Kenyans.co.ke homepage items have no machine-readable time: slot them in evenly.
  const out = dated.slice();
  undated.forEach((u, i) => out.splice(Math.min(1 + i * 4, out.length), 0, u));
  return out.slice(0, limit);
}

async function getFeed({ category = "all", region = "all", q = "", limit = 40, days = 7 } = {}) {
  days = [1, 7, 30].includes(parseInt(days, 10)) ? parseInt(days, 10) : 7;
  if (!CATEGORIES[category]) category = "all";
  if (!REGIONS[region]) region = "all";
  q = String(q || "").trim().slice(0, 120);
  limit = Math.min(Math.max(parseInt(limit, 10) || 40, 1), 100);
  const key = ["feed", category, region, q.toLowerCase(), limit, days].join("|");
  return cached(key, TTL, async () => {
    const jobs = [googleItems({ region, category, q, days })];
    if (days <= 7 && region === "africa" && !q) jobs.push(directItems("africa", "news", q));
    if (days <= 7 && ["world", "all"].includes(region) || (region === "africa" && category !== "news")) jobs.push(directItems("world", category === "all" ? "news" : category, q));
    if (days <= 7 && region === "africa" && category === "news") jobs.push(directItems("world", "news", q).then(l => l.filter(i => /africa/i.test(i.title + i.excerpt))));
    if (region === "kenya" || (region === "all" && q)) jobs.push(kenyansItems(category, q));
    const res = await Promise.allSettled(jobs);
    const ok = res.filter(r => r.status === "fulfilled").map(r => r.value);
    res.filter(r => r.status === "rejected").forEach(r => console.warn("[pulse360] source failed:", r.reason?.message));
    if (!ok.length) throw new Error("All news sources are unreachable right now.");
    const items = merge(ok, limit).map(i => ({ ...i, category, region }));
    return { category, region, q, days, total: items.length, items, fetchedAt: new Date().toISOString() };
  });
}

async function getTop() {
  return cached("top", TTL, async () => {
    const plan = [["kenya", "news"], ["world", "news"], ["africa", "news"], ["world", "sports"], ["world", "culture"], ["kenya", "sports"], ["world", "technology"]];
    const res = await Promise.allSettled(plan.map(([r, c]) => getFeed({ region: r, category: c, limit: 12 })));
    const lists = res.filter(r => r.status === "fulfilled").map((r, i) => {
      const items = r.value.items.slice(0, 10);
      return [...items.filter(x => x.image), ...items.filter(x => !x.image)];
    });
    const out = [], seen = new Set();
    for (let round = 0; out.length < 8 && round < 6; round++)
      for (const l of lists) {
        const it = l[round];
        if (it && !seen.has(norm(it.title)) && out.length < 8) { seen.add(norm(it.title)); out.push(it); }
      }
    return { total: out.length, items: out, fetchedAt: new Date().toISOString() };
  });
}

async function getTicker() {
  return cached("ticker", 3 * 60 * 1000, async () => {
    const items = [];
    try {
      if (K.kenyanstrack) {
        const t = await K.kenyanstrack();
        for (const b of t.breakingNews || []) items.push({ text: b.title, url: b.url, tag: "BREAKING" });
        for (const day of (t.updatesByDate || []).slice(0, 1))
          for (const u of day.updates.slice(0, 6)) {
            const text = u.body.length > 130 ? u.body.slice(0, 127) + "…" : u.body;
            if (text) items.push({ text, url: u.links?.[0]?.url || "https://www.kenyans.co.ke/news/tracker", tag: u.time || "KENYA" });
          }
      }
    } catch (e) { console.warn("[pulse360] tracker failed:", e.message); }
    const more = await Promise.allSettled([getFeed({ region: "world", category: "news", limit: 6 }), getFeed({ region: "kenya", category: "news", limit: 5 })]);
    more.forEach((r, i) => r.status === "fulfilled" && r.value.items.slice(0, i ? 4 : 5).forEach(a => items.push({ text: a.title, url: a.url, tag: i ? "KENYA" : "WORLD" })));
    return { total: items.length, items, fetchedAt: new Date().toISOString() };
  });
}

// Short, attributed preview for Kenyans.co.ke stories (first paragraphs only; the full story stays at the source).
async function getPreview(url) {
  if (!K.kenyandetails) return { summary: "" };
  const d = await cached("pv|" + url, 10 * 60 * 1000, () => K.kenyandetails(url));
  let summary = (d.content || []).slice(0, 3).join("\n\n");
  if (!summary) summary = d.description || "";
  if (summary.length > 700) summary = summary.slice(0, 700).replace(/\s+\S*$/, "") + "…";
  return { summary, image: d.imageUrl || null, author: d.author || null };
}

async function diagnose() {
  // Return image coverage as well as source reachability so missing feed metadata
  // can be distinguished from an unavailable publisher feed.
  const t = async (name, fn) => {
    const s = Date.now();
    try {
      const value = await fn();
      const list = Array.isArray(value) ? value : null;
      const count = list ? list.length : (Number(value) || 0);
      const withImages = list ? list.filter(item => item && item.image).length : null;
      return {
        source: name,
        ok: count > 0,
        items: count,
        images: withImages,
        imageRate: list && list.length ? Math.round(withImages / list.length * 100) : null,
        missingImageExamples: list ? list.filter(item => !item.image).slice(0, 3).map(item => ({
          title: String(item.title || "").slice(0, 140),
          url: item.url || null
        })) : [],
        ms: Date.now() - s
      };
    } catch (e) {
      return { source: name, ok: false, items: 0, images: null, imageRate: null, missingImageExamples: [], ms: Date.now() - s, error: e.message };
    }
  };
  return Promise.all([
    t("Google News (Kenya)", async () => parseRss(await fetchText(gnSearch("Kenya when:7d", ed("KE"))))),
    t("Google News (World topic)", async () => parseRss(await fetchText(gnTopic("WORLD", US)))),
    t("BBC World", async () => parseRss(await fetchText(BBC + "news/world/rss.xml"))),
    t("Al Jazeera", async () => parseRss(await fetchText("https://www.aljazeera.com/xml/rss/all.xml"))),
    t("CNN World", async () => parseRss(await fetchText(CNN + "edition_world.rss"))),
    t("Kenyans.co.ke homepage scraper", async () => { if (!K.kenyans) throw new Error("scraper not loaded (run npm install: axios/cheerio)"); return K.kenyans(); }),
    t("Kenyans.co.ke tracker scraper", async () => { if (!K.kenyanstrack) throw new Error("scraper not loaded"); return (await K.kenyanstrack()).totalUpdates; })
  ]);
}

module.exports = { getFeed, getTop, getTicker, getPreview, diagnose, REGIONS, CATEGORIES, K };

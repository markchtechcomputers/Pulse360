const express = require("express");
const path = require("path");
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));

const stories = [
  {id:"ke-economy",slug:"kenya-economic-outlook-business-watch",category:"Kenya",categoryKey:"news",region:"KENYA",title:"Kenya’s economy: the developments businesses and households are watching",excerpt:"A look at the policy decisions, prices and business signals shaping everyday life across the country.",author:"Pulse360 Desk",date:"2026-10-19",readTime:5,image:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",featured:true,body:["Kenya’s economic story is closely connected to the cost of living, jobs, investment and the choices made by businesses and public institutions.","This Pulse360 sample article demonstrates the publication layout. Replace demo copy with verified reporting, named sources, dates and links before publishing it as factual news."]},
  {id:"africa-tech",slug:"african-technology-innovation-watch",category:"Africa",categoryKey:"news",region:"AFRICA",title:"African innovation: startups are building for local needs and global markets",excerpt:"From digital services to practical tools for small businesses, founders are finding new ways to solve familiar problems.",author:"Pulse360 Business",date:"2026-10-18",readTime:4,image:"https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=85"},
  {id:"world-climate",slug:"world-climate-and-energy-briefing",category:"World",categoryKey:"news",region:"WORLD",title:"The global energy transition: the questions that matter to consumers",excerpt:"Energy security, affordability and investment remain central questions in the transition to cleaner power.",author:"Pulse360 World",date:"2026-10-18",readTime:6,image:"https://images.unsplash.com/photo-1473341304170-971aecb8e3f8?auto=format&fit=crop&w=900&q=85"},
  {id:"football-africa",slug:"african-football-talent-on-the-rise",category:"Football",categoryKey:"sports",region:"SPORTS",title:"African football talent continues to attract attention around the world",excerpt:"A closer look at player development, scouting and the pathways connecting local clubs to bigger stages.",author:"Pulse360 Sport",date:"2026-10-19",readTime:4,image:"https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=85",featured:true},
  {id:"sports-fitness",slug:"the-growth-of-community-sports",category:"Sport",categoryKey:"sports",region:"SPORTS",title:"Why community sport matters beyond the final score",excerpt:"Local teams create opportunities for young people, build community and make sport accessible.",author:"Pulse360 Sport",date:"2026-10-17",readTime:3,image:"https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=85"},
  {id:"music-africa",slug:"african-music-global-audience",category:"Music",categoryKey:"entertainment",region:"CULTURE",title:"African music is reaching new listeners across borders",excerpt:"Artists, producers and independent teams are connecting sounds and audiences through digital platforms.",author:"Pulse360 Culture",date:"2026-10-19",readTime:4,image:"https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=85",featured:true},
  {id:"artist-profile",slug:"inside-the-independent-artist-journey",category:"Artists",categoryKey:"entertainment",region:"ARTISTS",title:"Building a music career independently: the work behind the spotlight",excerpt:"Creative direction, consistent releases and audience connection can all shape an emerging artist’s journey.",author:"Pulse360 Culture",date:"2026-10-16",readTime:5,image:"https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85"},
  {id:"film-culture",slug:"african-film-and-screen-culture",category:"Entertainment",categoryKey:"entertainment",region:"CULTURE",title:"African screen stories are opening new conversations",excerpt:"Film, television and online creators are finding fresh ways to tell stories rooted in local experience.",author:"Pulse360 Culture",date:"2026-10-15",readTime:4,image:"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=85"},
  {id:"digital-life",slug:"digital-skills-and-the-future-of-work",category:"Technology",categoryKey:"technology",region:"TECH",title:"Digital skills and the changing world of work",excerpt:"Practical digital skills can help people and small organisations adapt to new ways of working.",author:"Pulse360 Desk",date:"2026-10-14",readTime:4,image:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85"}
];


const DISCOVERY_SOURCES = {
  all: "",
  kenyans: "site:kenyans.co.ke",
  cnn_africa: "site:edition.cnn.com/world/africa",
  bbc_africa: "site:bbc.com/news/world/africa",
  aljazeera: "site:aljazeera.com/news",
  espn: "site:espn.com",
  billboard: "site:billboard.com"
};
const DISCOVERY_SECTIONS = {
  news: { terms: { kenya: "Kenya news", africa: "Africa news", world: "world news", international: "international news" } },
  sports: { terms: { kenya: "Kenya sports", africa: "African sports", world: "international sports", international: "international sports" } },
  music: { terms: { kenya: "Kenyan music artists", africa: "African music artists", world: "international music artists", international: "global music entertainment" } },
  entertainment: { terms: { kenya: "Kenya entertainment celebrities", africa: "African entertainment", world: "world entertainment", international: "international entertainment" } },
  technology: { terms: { kenya: "Kenya technology innovation", africa: "Africa technology innovation", world: "global technology news", international: "international technology news" } },
  agriculture: { terms: { kenya: "Kenya agriculture farming", africa: "African agriculture farming", world: "global agriculture food security", international: "international agriculture farming" } },
  business: { terms: { kenya: "Kenya business economy", africa: "African business economy", world: "global business economy", international: "international business economy" } },
  culture: { terms: { kenya: "Kenya culture arts", africa: "African culture arts", world: "world culture arts", international: "international culture arts" } }
};
const DISCOVERY_REGIONS = {
  kenya: "Kenya", uganda: "Uganda", tanzania: "Tanzania", nigeria: "Nigeria",
  south_africa: "South Africa", ghana: "Ghana", ethiopia: "Ethiopia",
  africa: "Africa", uk: "United Kingdom", us: "United States",
  europe: "Europe", asia: "Asia", americas: "Americas", world: "world", international: "international"
};
function decodeXml(value) {
  return String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ").trim();
}
function rssItems(xml) {
  const items = [];
  const blocks = String(xml).match(/<item\b[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const field = name => {
      const open = new RegExp("<" + name + "\\b[^>]*>", "i");
      const found = block.match(open);
      if (!found) return "";
      const begin = found.index + found[0].length;
      const closeAt = block.toLowerCase().indexOf("</" + name.toLowerCase() + ">", begin);
      return closeAt < 0 ? "" : decodeXml(block.slice(begin, closeAt));
    };
    const title = field("title");
    const url = field("link");
    const excerpt = field("description");
    const source = field("source");
    const publishedAt = field("pubDate");
    if (title && /^https?:\/\//i.test(url)) items.push({ title, url, excerpt: excerpt.slice(0, 280), source, publishedAt: publishedAt || null });
  }
  return items;
}
app.get("/api/discover", async (req, res) => {
  const section = String(req.query.section || "news").toLowerCase();
  const region = String(req.query.region || "kenya").toLowerCase();
  const q = String(req.query.q || "").trim().slice(0, 140);
  const source = String(req.query.source || "all").toLowerCase();
  const config = DISCOVERY_SECTIONS[section] || DISCOVERY_SECTIONS.news;
  const regionTerm = config.terms[region] || (DISCOVERY_REGIONS[region] ? (config.terms.world || "world news") + " " + DISCOVERY_REGIONS[region] : config.terms.kenya);
  const sourceTerm = DISCOVERY_SOURCES[source] || "";
  const query = [regionTerm, sourceTerm, q].filter(Boolean).join(" ");
  const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(query) + "&hl=en-KE&gl=KE&ceid=KE:en";
  try {
    const response = await fetch(url, { headers: { "Accept": "application/rss+xml, application/xml, text/xml", "User-Agent": "Pulse360NewsReader/1.0" }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error("Headline provider returned " + response.status);
    const results = rssItems(await response.text()).slice(0, 30);
    res.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    res.json({ query, section, region, source: sourceTerm ? source : "all", total: results.length, results, fetchedAt: new Date().toISOString(), provider: "Google News RSS", note: "Headlines and snippets are supplied by publishers. Open the original source for full reporting." });
  } catch (error) {
    res.status(502).json({ error: "Live headline search is temporarily unavailable. Please try again shortly.", details: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
});

app.get("/api/health", (_req,res) => res.json({ok:true,service:"Pulse360 API",version:"1.0.0"}));
app.get("/api/categories", (_req,res) => res.json([
  {key:"news",label:"News"},{key:"sports",label:"Sports"},{key:"entertainment",label:"Music & Entertainment"},{key:"technology",label:"Technology"},{key:"agriculture",label:"Agriculture"},{key:"business",label:"Business"},{key:"culture",label:"Culture"}
]));
app.get("/api/stories", (req,res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const category = String(req.query.category || "").trim().toLowerCase();
  const limit = Math.min(Math.max(parseInt(req.query.limit,10) || 20,1),50);
  let result = stories.filter(s => (!category || s.categoryKey === category || s.category.toLowerCase() === category) &&
    (!q || [s.title,s.excerpt,s.category,s.author,s.region].join(" ").toLowerCase().includes(q)));
  if (req.query.featured === "true") result = result.filter(s => s.featured);
  res.set("Cache-Control","public, s-maxage=60, stale-while-revalidate=300");
  res.json({total:result.length,stories:result.slice(0,limit)});
});
app.get("/api/stories/:slug", (req,res) => {
  const story = stories.find(s => s.slug === req.params.slug || s.id === req.params.slug);
  if (!story) return res.status(404).json({error:"Story not found"});
  const related = stories.filter(s => s.id !== story.id && s.categoryKey === story.categoryKey).slice(0,3);
  res.json({story,related});
});
app.post("/api/newsletter", (req,res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:"Enter a valid email address."});
  // No email provider is configured yet; don't pretend to persist a subscription.
  return res.status(501).json({error:"Newsletter sign-up is not connected yet. Please check back soon."});
});
app.use("/api", (_req,res) => res.status(404).json({error:"API endpoint not found"}));

// Local development serves the same public files that Vercel serves statically.
app.use(express.static(path.join(__dirname,"public")));
app.get("*path", (_req,res) => res.sendFile(path.join(__dirname,"public","index.html")));
module.exports = app;

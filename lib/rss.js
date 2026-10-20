// Small dependency-free RSS parser (RSS 2.0 as used by Google News, BBC, CNN, Al Jazeera).
const crypto = require("crypto");
const idOf = u => crypto.createHash("md5").update(String(u)).digest("hex").slice(0, 10);
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

const unesc = s =>
  String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === "#") {
        const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        try { return String.fromCodePoint(n); } catch { return ""; }
      }
      return ENT[e.toLowerCase()] ?? m;
    });

const strip = s => unesc(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const tag = (block, name) => {
  const m = block.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i"));
  return m ? m[1] : "";
};
const attr = (block, name, a) => {
  const m = block.match(new RegExp("<" + name + "\\b[^>]*?\\b" + a + "=[\"']([^\"']+)[\"']", "i"));
  return m ? unesc(m[1]) : "";
};

function cleanImage(u, baseUrl = "") {
  if (!u) return "";
  u = unesc(String(u).trim()).replace(/^['"]|['"]$/g, "");
  if (u.startsWith("//")) u = "https:" + u;
  try {
    const parsed = new URL(u, baseUrl || undefined);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) return "";
    // Most browsers can load HTTP images, but HTTPS prevents mixed-content failures.
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    if (parsed.username || parsed.password) return "";
    if (/\.(?:svg)(?:$|[?#])/i.test(parsed.pathname)) return "";
    return parsed.href;
  } catch {
    return "";
  }
}

function findImage(block, baseUrl = "") {
  const candidates = [];
  const add = (url, score = 0, hint = "") => {
    const clean = cleanImage(url, baseUrl);
    if (!clean || candidates.some(c => c.url === clean)) return;
    candidates.push({ url: clean, score, hint });
  };
  const tags = (name, html) => [...html.matchAll(new RegExp("<" + name + "\\b[^>]*>", "gi"))].map(m => m[0]);
  const getAttr = (tagText, name) => {
    const m = tagText.match(new RegExp("(?:^|\\s)" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i"));
    return m ? unesc(m[2]) : "";
  };

  // Explicit image media is usually the most useful, but inspect every entry:
  // some feeds put a video first and a still image later in the same item.
  for (const t of tags("media:content", block)) {
    const url = getAttr(t, "url");
    const type = getAttr(t, "type").toLowerCase();
    const medium = getAttr(t, "medium").toLowerCase();
    if (!url || type.startsWith("video/") || medium === "video") continue;
    if (type.startsWith("image/") || medium === "image") {
      const width = Number(getAttr(t, "width")) || 0;
      add(url, 100 + Math.min(width, 2400) / 100, "media-content");
    }
  }
  for (const t of tags("media:thumbnail", block)) {
    const width = Number(getAttr(t, "width")) || 0;
    add(getAttr(t, "url"), 65 + Math.min(width, 1600) / 100, "thumbnail");
  }
  for (const t of tags("enclosure", block)) {
    const type = getAttr(t, "type").toLowerCase();
    if (type.startsWith("image/")) add(getAttr(t, "url"), 85, "enclosure");
  }

  // HTML in descriptions/content can include lazy-loaded images or srcset only.
  const html = unesc(tag(block, "description") + " " + tag(block, "content:encoded"));
  for (const img of tags("img", html)) {
    const src = getAttr(img, "src") || getAttr(img, "data-src") ||
      getAttr(img, "data-original") || getAttr(img, "data-lazy-src");
    if (src) add(src, 80, "html-image");
    const srcset = getAttr(img, "srcset") || getAttr(img, "data-srcset");
    if (srcset) {
      const options = srcset.split(",").map(part => {
        const bits = part.trim().split(/\s+/);
        const descriptor = bits[1] || "";
        const amount = parseFloat(descriptor) || 1;
        return { url: bits[0], score: descriptor.endsWith("w") ? amount / 100 : amount * 10 };
      }).filter(x => x.url);
      options.sort((a, b) => b.score - a.score);
      if (options[0]) add(options[0].url, 75 + Math.min(options[0].score, 30), "srcset");
    }
  }

  // Some publishers include an image URL as a plain <image> or <thumbnail> field.
  for (const name of ["image", "thumbnail"]) {
    const value = tag(block, name);
    if (value && !/<|>/.test(value.trim())) add(strip(value), 55, name);
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.url || "";
}

function parseRss(xml, defaults = {}) {
  const out = [];
  const blocks = String(xml || "").match(/<item\b[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    let title = strip(tag(block, "title"));
    const url = strip(tag(block, "link")) || strip(tag(block, "guid"));
    if (!title || !/^https?:\/\//i.test(url)) continue;
    const source = strip(tag(block, "source")) || defaults.source || "";
    const sourceUrl = attr(block, "source", "url");
    if (source && title.endsWith(" - " + source)) title = title.slice(0, -(source.length + 3)).trim();
    let excerpt = strip(tag(block, "description"));
    // Google News descriptions only repeat the headline — hide those.
    if (!excerpt || excerpt.toLowerCase().startsWith(title.toLowerCase().slice(0, 40))) excerpt = "";
    const pub = strip(tag(block, "pubDate")) || strip(tag(block, "dc:date"));
    const t = pub ? Date.parse(pub) : NaN;
    // Google News lists other outlets covering the same story inside <description>.
    const coverage = [];
    const dHtml = unesc(tag(block, "description"));
    const re = /<li>\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<font[^>]*>([\s\S]*?)<\/font>/gi;
    let m;
    while ((m = re.exec(dHtml)) && coverage.length < 5) {
      const t = strip(m[2]), so = strip(m[3]);
      if (t && t.toLowerCase() !== title.toLowerCase() && !t.toLowerCase().startsWith(title.toLowerCase().slice(0, 35)) && /^https?:/i.test(m[1])) coverage.push({ title: t.replace(new RegExp("\\s+-\\s+" + so.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"), ""), url: m[1], source: so });
    }
    out.push({
      id: idOf(url),
      title,
      url,
      coverage,
      source,
      sourceUrl: sourceUrl || null,
      image: findImage(block, url) || null,
      excerpt: excerpt.slice(0, 240),
      publishedAt: Number.isNaN(t) ? null : new Date(t).toISOString()
    });
  }
  return out;
}

module.exports = { parseRss, strip, unesc, idOf };

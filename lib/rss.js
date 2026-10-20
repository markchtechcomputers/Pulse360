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

function cleanImage(u) {
  if (!u) return "";
  u = u.trim().replace(/^http:\/\//i, "https://");
  if (!/^https:\/\//i.test(u)) return "";
  // BBC thumbnails default to 240px — ask for a sharper size.
  if (/bbci\.co\.uk|bbc\.co\.uk/i.test(u)) u = u.replace(/\/(240|320)\//, "/800/");
  return u;
}

function findImage(block) {
  let u = attr(block, "media:thumbnail", "url");
  if (!u) {
    const mc = block.match(/<media:content\b[^>]*>/i);
    if (mc && !/video/i.test(mc[0])) { const m = mc[0].match(/url=["']([^"']+)/i); if (m) u = unesc(m[1]); }
  }
  if (!u) {
    const enc = block.match(/<enclosure\b[^>]*>/i);
    if (enc && /image/i.test(enc[0])) { const m = enc[0].match(/url=["']([^"']+)/i); if (m) u = unesc(m[1]); }
  }
  if (!u) {
    const d = unesc(tag(block, "description") + tag(block, "content:encoded"));
    const m = d.match(/<img[^>]+src=["']([^"']+)/i);
    if (m) u = m[1];
  }
  return cleanImage(u);
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
      image: findImage(block) || null,
      excerpt: excerpt.slice(0, 240),
      publishedAt: Number.isNaN(t) ? null : new Date(t).toISOString()
    });
  }
  return out;
}

module.exports = { parseRss, strip, unesc, idOf };

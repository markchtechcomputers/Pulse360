// Safe image relay for publisher/CDN images that block direct browser hotlinking.
const ALLOWED_SUFFIXES = [
  "google.com", "googleusercontent.com", "gstatic.com",
  "bbci.co.uk", "bbc.co.uk", "bbc.com",
  "cnn.com", "cnn.io", "aljazeera.com",
  "kenyans.co.ke", "nation.africa", "standardmedia.co.ke", "citizen.digital",
  "tuko.co.ke", "the-star.co.ke", "capitalfm.co.ke", "theeastafrican.co.ke",
  "monitor.co.ug", "newvision.co.ug", "thecitizen.co.tz", "dailynews.co.tz",
  "news24.com", "ewn.co.za", "iol.co.za", "sabcnews.com", "enca.com",
  "timeslive.co.za", "mg.co.za", "dailymaverick.co.za", "businesslive.co.za",
  "reuters.com", "apnews.com", "theguardian.com", "nytimes.com", "washingtonpost.com",
  "africanews.com", "allafrica.com", "punchng.com", "vanguardngr.com", "premiumtimesng.com",
  "unsplash.com", "cloudfront.net", "wp.com", "wordpress.com", "wordpress.org",
  "cloudinary.com", "imgix.net", "akamaized.net", "akamaihd.net", "fastly.net",
  "b-cdn.net", "squarespace-cdn.com", "substackcdn.com", "ctfassets.net",
  "vox-cdn.com", "bwbx.io", "images.wsj.net", "gettyimages.com", "gstatic.com",
  "gravatar.com", "staticflickr.com", "flickr.com", "wikimedia.org", "wikipedia.org",
  "ytimg.com", "yt3.ggpht.com", "licdn.com", "fbcdn.net"
];
const MAX_BYTES = 6 * 1024 * 1024;
const allowed = hostname => {
  const h = String(hostname || "").toLowerCase().replace(/\\.$/, "");
  return ALLOWED_SUFFIXES.some(s => h === s || h.endsWith("." + s));
};
function sniff(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  if (bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))) return "image/gif";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp" && /avif|avis/.test(bytes.toString("ascii", 8, 16))) return "image/avif";
  return "";
}
async function readLimited(response) {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_BYTES) throw new Error("Image is too large");
  if (!response.body) throw new Error("Image is empty");
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) { await reader.cancel(); throw new Error("Image is too large"); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, total);
}
async function relayImage(input) {
  let current;
  try { current = new URL(input); } catch { throw new Error("Invalid image URL"); }
  for (let hop = 0; hop <= 3; hop++) {
    if (!["https:", "http:"].includes(current.protocol) || !allowed(current.hostname) || current.username || current.password)
      throw new Error("Image host is not allowed");
    let r;
    // Publishers/CDNs differ on hotlink policy. Try a normal browser request,
    // then retry once without a Referer when the CDN rejects it.
    for (const headers of [
      { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36", Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8", Referer: current.origin + "/" },
      { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125 Safari/537.36", Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" }
    ]) {
      r = await fetch(current, { redirect: "manual", headers, signal: AbortSignal.timeout(8000) });
      if (![401, 403, 406, 429, 500, 502, 503].includes(r.status)) break;
      if (r.body) await r.body.cancel().catch(() => {});
    }
    if ([301, 302, 303, 307, 308].includes(r.status)) {
      const location = r.headers.get("location");
      if (!location || hop === 3) throw new Error("Image redirect limit reached");
      current = new URL(location, current);
      continue;
    }
    if (!r.ok) throw new Error("Image source returned HTTP " + r.status);
    const declared = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (declared === "image/svg+xml" || declared === "text/html") throw new Error("Source did not return a supported image");
    const bytes = await readLimited(r);
    const actual = sniff(bytes);
    // Some CDNs mislabel real image bytes as octet-stream; sniff the payload
    // rather than rejecting it solely because the Content-Type is incorrect.
    const type = actual || (declared.startsWith("image/") && declared !== "image/svg+xml" ? declared : "");
    if (!type) throw new Error("Source did not return a supported image");
    return { bytes, type };
  }
  throw new Error("Image redirect limit reached");
}
module.exports = { relayImage, allowed };

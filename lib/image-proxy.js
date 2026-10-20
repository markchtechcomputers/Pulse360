// Safe image relay for publisher CDNs that block direct browser hotlinking.
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
  "images.unsplash.com", "cloudfront.net", "wp.com"
];
const MAX_BYTES = 6 * 1024 * 1024;
const allowed = hostname => {
  const h = String(hostname || "").toLowerCase().replace(/\\.$/, "");
  return ALLOWED_SUFFIXES.some(s => h === s || h.endsWith("." + s));
};
async function relayImage(input) {
  let current;
  try { current = new URL(input); } catch { throw new Error("Invalid image URL"); }
  for (let hop = 0; hop <= 3; hop++) {
    if (!["https:", "http:"].includes(current.protocol) || !allowed(current.hostname) || current.username || current.password)
      throw new Error("Image host is not allowed");
    const r = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Pulse360/2.0)", Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.5", Referer: current.origin + "/" },
      signal: AbortSignal.timeout(8000)
    });
    if ([301, 302, 303, 307, 308].includes(r.status)) {
      const location = r.headers.get("location");
      if (!location || hop === 3) throw new Error("Image redirect limit reached");
      current = new URL(location, current);
      continue;
    }
    if (!r.ok) throw new Error("Image source returned HTTP " + r.status);
    const type = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!type.startsWith("image/") || type === "image/svg+xml") throw new Error("Source did not return a supported image");
    const length = Number(r.headers.get("content-length") || 0);
    if (length > MAX_BYTES) throw new Error("Image is too large");
    const bytes = Buffer.from(await r.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_BYTES) throw new Error("Image is empty or too large");
    return { bytes, type };
  }
  throw new Error("Image redirect limit reached");
}
module.exports = { relayImage, allowed };

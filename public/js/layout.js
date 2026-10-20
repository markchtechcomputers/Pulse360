// Shared header, menu drawer, footer, theme, search and card helpers for every page.
(() => {
  const CATS = [["news","News","Politics, society & world affairs"],["sports","Sports","Football, athletics, rugby & more"],["music","Music","Releases, artists & charts"],["culture","Culture","Film, TV, arts & lifestyle"],["technology","Technology","AI, startups & gadgets"],["business","Business","Economy, markets & enterprise"],["agriculture","Agriculture","Farming, food & agribusiness"],["health","Health","Wellbeing & medicine"],["science","Science","Discoveries & environment"]];
  const REG = [["kenya","Kenya"],["uganda","Uganda"],["tanzania","Tanzania"],["rwanda","Rwanda"],["ethiopia","Ethiopia"],["nigeria","Nigeria"],["ghana","Ghana"],["south-africa","South Africa"],["egypt","Egypt"],["africa","Africa"],["world","World"],["usa","USA"],["uk","UK"],["europe","Europe"],["asia","Asia"],["middle-east","Middle East"]];
  const SOCIAL = [["Facebook","https://i.postimg.cc/DZHs0t4n/icons8-facebook-48.png","f"],["Instagram","https://i.postimg.cc/sD9QCBct/icons8-instagram-48.png","◎"],["X","https://i.postimg.cc/SNT49kNc/icons8-x-50.png","𝕏"],["TikTok","https://i.postimg.cc/3J667Rxx/icons8-tiktok-50.png","♪"],["YouTube","https://i.postimg.cc/W4V5bJLF/icons8-youtube-48.png","▶"],["Google News","https://i.postimg.cc/T2sQ5sMs/icons8-google-48.png","G"],["Telegram","https://i.postimg.cc/ZRMP3Wgx/icons8-telegram-48.png","➤"]];
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ICON = {
    menu: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    sun: '<svg class="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg class="i-moon" viewBox="0 0 24 24"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z"/></svg>',
    l: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>', r: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>'
  };
  const social = () => SOCIAL.map(([n, u, f]) => `<a href="#" class="social-link" data-social="${n}" aria-label="${n}" title="${n}"><img src="${u}" alt="${n}" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="social-fallback" hidden aria-hidden="true">${f}</span></a>`).join("");
  const brand = cls => `<a class="brand ${cls || ""}" href="/" aria-label="Pulse360 home"><span class="brand-mark">P<span>360</span></span><span class="brand-copy"><strong>Pulse<span>360</span></strong><small>THE WORLD IN PERSPECTIVE</small></span></a>`;
  const qs = new URLSearchParams(location.search);
  const here = location.pathname.includes("discover") ? qs.get("category") || "" : (location.pathname === "/" || location.pathname.endsWith("index.html")) ? "home" : "-";

  // ---- time / cards ----
  const ago = iso => {
    if (!iso) return "";
    const s = (Date.now() - Date.parse(iso)) / 1000;
    if (isNaN(s)) return "";
    if (s < 90) return "Just now"; if (s < 3600) return Math.round(s / 60) + " min ago";
    if (s < 86400) return Math.round(s / 3600) + " hr ago"; if (s < 604800) return Math.round(s / 86400) + " d ago";
    return new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short" }).format(new Date(iso));
  };
  const hue = s => { let h = 0; for (const c of String(s || "x")) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const store = {};
  const media = it => `<a class="card-media" data-story="${esc(it.id)}" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true" style="--h:${hue(it.source)}" data-ini="${esc((it.source || "P")[0].toUpperCase())}">${it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="strict-origin-when-cross-origin">` : ""}</a>`;
  const when = it => ago(it.publishedAt) || esc(it.dateLabel || "");
  const card = it => { store[it.id] = it; return `<article class="card">${media(it)}<div class="card-body"><div class="card-meta"><b>${esc(it.source || "News")}</b><span>${when(it)}</span></div><h3><a data-story="${esc(it.id)}" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a></h3>${it.excerpt ? `<p>${esc(it.excerpt)}</p>` : ""}</div></article>`; };
  const slide = it => { store[it.id] = it; return `<article class="slide" style="--h:${hue(it.source)}">${it.image ? `<img src="${esc(it.image)}" alt="" decoding="async" referrerpolicy="strict-origin-when-cross-origin">` : ""}<div class="slide-body"><span class="tag">${esc(it.category === "all" ? "Top story" : it.category)} · ${esc(it.region === "all" ? "World" : it.region.replace("-", " "))}</span><h2><a data-story="${esc(it.id)}" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a></h2>${it.excerpt ? `<p>${esc(it.excerpt)}</p>` : ""}<div class="meta">${esc(it.source || "")} · ${when(it)}</div></div></article>`; };
  const api = async (path, params) => {
    const r = await fetch("/api/" + path + (params ? "?" + new URLSearchParams(params) : ""));
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Request failed");
    return d;
  };
  const toast = msg => {
    let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 3200);
  };
  // ---- instant paint: show the saved copy first, then refresh in the background ----
  const swr = (path, params, cb, opt = {}) => {
    const key = "p360:" + path + "?" + new URLSearchParams(params);
    let had = false;
    if (!opt.skipCache) try { const c = JSON.parse(localStorage.getItem(key)); if (c && Date.now() - c.t < 12 * 3600e3) { cb(c.d, true); had = true; } } catch {}
    return api(path, params).then(d => {
      try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); }
      catch { try { Object.keys(localStorage).filter(k => k.startsWith("p360:")).forEach(k => localStorage.removeItem(k)); } catch {} }
      cb(d, false); return d;
    }).catch(e => { if (!had) throw e; });
  };

  // ---- story preview: read more on Pulse360 before going to the source ----
  let modal, lastFocus, token = 0;
  const words = t => t.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(w => w.length > 2).slice(0, 7).join(" ");
  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div"); modal.className = "modal"; modal.hidden = true;
    modal.innerHTML = `<div class="modal-bg" data-close></div><div class="modal-card" role="dialog" aria-modal="true" aria-label="Story preview" tabindex="-1"><button class="icon-btn modal-x" data-close aria-label="Close preview">${ICON.close}</button><div class="modal-scroll" id="m-body"></div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeStory(); });
    return modal;
  }
  function openStory(id, push = true) {
    const it = store[id]; if (!it) return false;
    ensureModal(); const my = ++token;
    const first = modal.hidden; if (first) lastFocus = document.activeElement;
    const place = it.region && it.region !== "all" ? it.region.replace("-", " ") : "world";
    $("#m-body").innerHTML = `<div class="m-media" style="--h:${hue(it.source)}" data-ini="${esc((it.source || "P")[0].toUpperCase())}">${it.image ? `<img src="${esc(it.image)}" alt="" referrerpolicy="strict-origin-when-cross-origin">` : ""}</div>
<div class="m-body"><div class="card-meta"><b>${esc(it.source || "News")}</b><span>${when(it)}</span><span>· ${esc(place)}</span></div><h2>${esc(it.title)}</h2>
<div id="m-sum">${it.excerpt ? `<p class="m-sum">${esc(it.excerpt)}</p>` : ""}</div>
<div class="m-actions"><a class="btn primary" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">Read full story at ${esc(it.source || "source")} ↗</a><button class="btn" id="m-share" type="button">Share</button></div>
${it.coverage && it.coverage.length ? `<h3 class="m-h">Also reported by</h3><div class="m-list">${it.coverage.map(c => `<a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${esc(c.title)}<small>${esc(c.source)} ↗</small></a>`).join("")}</div>` : ""}
<h3 class="m-h">More on this topic</h3><div class="m-list" id="m-more"><div class="skeleton" style="height:60px"></div></div></div>`;
    modal.hidden = false; document.body.classList.add("locked");
    $("#m-body").scrollTop = 0; modal.querySelector(".modal-card").focus({ preventScroll: true });
    if (push) history.pushState({ story: id }, ""); else history.replaceState({ story: id }, "");
    $("#m-share").onclick = async () => { try { if (navigator.share) await navigator.share({ title: it.title, url: it.url }); else { await navigator.clipboard.writeText(it.url); toast("Link copied"); } } catch {} };
    if (/kenyans\.co\.ke/i.test(it.url) && !it.excerpt) api("preview", { url: it.url }).then(d => { if (my === token && d.summary) $("#m-sum").innerHTML = d.summary.split(/\n\n/).map(p => `<p class="m-sum">${esc(p)}</p>`).join("") + `<p class="m-credit">Summary from Kenyans.co.ke — continue reading at the source.</p>`; }).catch(() => {});
    api("feed", { q: words(it.title), region: "all", category: "all", limit: 8 }).then(d => {
      if (my !== token) return; const more = (d.items || []).filter(x => x.id !== it.id).slice(0, 5);
      more.forEach(x => store[x.id] = x);
      $("#m-more").innerHTML = more.length ? more.map(x => `<a href="${esc(x.url)}" data-story="${esc(x.id)}">${esc(x.title)}<small>${esc(x.source || "")} · ${when(x)}</small></a>`).join("") : '<p class="m-credit">No related stories yet.</p>';
    }).catch(() => { if (my === token) $("#m-more").innerHTML = '<p class="m-credit">Related stories unavailable right now.</p>'; });
    return true;
  }
  function hideStory() { if (!modal || modal.hidden) return; token++; modal.hidden = true; document.body.classList.remove("locked"); lastFocus?.focus?.({ preventScroll: true }); }
  function closeStory() { if (history.state && history.state.story) history.back(); else hideStory(); }
  window.addEventListener("popstate", e => { if (e.state && e.state.story) openStory(e.state.story, false); else hideStory(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && modal && !modal.hidden) closeStory(); });
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-story]");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (openStory(a.dataset.story, !(modal && !modal.hidden))) e.preventDefault();
  });
  window.P360 = { CATS, REG, esc, ago, card, slide, api, swr, toast, ICON, store };

  function build() {
    const top = $("#site-top"), foot = $("#site-foot");
    const nav = [["Home", "/", "home"], ...CATS.slice(0, 6).map(c => [c[1], "/discover.html?category=" + c[0], c[0]])];
    top.outerHTML = `<div class="top-strip"><div class="container strip-inner"><span class="live-badge">LIVE</span><span class="strip-date" id="strip-date"></span><div class="social-links" aria-label="Pulse360 social channels">${social()}</div></div></div>
<header class="site-header"><div class="container header-main">
<button class="icon-btn menu-btn" id="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="drawer">${ICON.menu}</button>
${brand()}
<nav class="main-nav" aria-label="Main">${nav.map(n => `<a href="${n[1]}" class="${here === n[2] ? "active" : ""}">${n[0]}</a>`).join("")}</nav>
<div class="header-search" role="search"><form id="hs-form" action="/discover.html"><label class="sr-only" for="hs-q">Search news everywhere</label><input id="hs-q" name="q" type="search" placeholder="Search news, sports, music…" autocomplete="off" enterkeyhint="search" value="${esc(qs.get("q") || "")}"><button type="submit" aria-label="Search">${ICON.search}</button></form><div class="suggest" id="hs-suggest" hidden></div></div>
<button class="icon-btn theme-btn" id="theme-btn" aria-label="Switch theme" title="Switch theme">${ICON.sun}${ICON.moon}</button>
</div></header>
<div class="scrim" id="scrim" hidden></div>
<aside class="drawer" id="drawer" aria-label="Menu" aria-hidden="true"><div class="drawer-head">${brand()}<button class="icon-btn" id="drawer-close" aria-label="Close menu">${ICON.close}</button></div>
<h3>TOPICS</h3>${CATS.map(c => `<a class="d-link" href="/discover.html?category=${c[0]}"><b>${c[1]}</b><small>${c[2]}</small></a>`).join("")}
<h3>COUNTRIES & REGIONS</h3><div class="chip-cloud">${REG.map(r => `<a class="chip" href="/discover.html?region=${r[0]}">${r[1]}</a>`).join("")}</div>
<h3>PULSE360</h3><div class="chip-cloud">${[["about","About"],["contact","Contact"],["advertise","Advertise"],["careers","Work with us"],["privacy","Privacy"],["terms","Terms"]].map(l => `<a class="chip" href="/info.html?topic=${l[0]}">${l[1]}</a>`).join("")}</div>
<h3>FOLLOW US</h3><div class="social-links">${social()}</div></aside>`;
    foot.outerHTML = `<footer class="site-footer"><div class="container footer-main"><div class="footer-brand">${brand()}<p>Local perspective. Global pulse. Live news, sport, music and culture from Kenya, Africa and every corner of the world.</p><div class="social-links" aria-label="Follow Pulse360">${social()}</div></div>
<div class="footer-cols"><div class="footer-col"><h3>TOPICS</h3>${CATS.slice(0, 6).map(c => `<a href="/discover.html?category=${c[0]}">${c[1]}</a>`).join("")}</div>
<div class="footer-col"><h3>REGIONS</h3>${["kenya", "uganda", "tanzania", "nigeria", "africa", "world"].map(k => `<a href="/discover.html?region=${k}">${REG.find(r => r[0] === k)[1]}</a>`).join("")}</div>
<div class="footer-col"><h3>PULSE360</h3><a href="/info.html?topic=about">About us</a><a href="/info.html?topic=contact">Contact</a><a href="/info.html?topic=advertise">Advertise</a><a href="/info.html?topic=careers">Work with us</a><a href="/info.html?topic=privacy">Privacy policy</a><a href="/info.html?topic=terms">Terms of use</a></div></div></div>
<div class="container footer-note">Pulse360 shows headlines, photos and short excerpts from public news feeds and original publishers (including Google News, BBC, CNN, Al Jazeera and Kenyans.co.ke). Tap any story to read the full report on the publisher’s own site.</div>
<div class="container footer-bottom"><span>© ${new Date().getFullYear()} Pulse360. All rights reserved.</span><a href="#" id="to-top">Back to top ↑</a></div></footer><div class="toast" id="toast" role="status"></div>`;
    $("#strip-date").textContent = new Intl.DateTimeFormat("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date());
  }

  function wire() {
    // theme
    const setTheme = t => { document.documentElement.dataset.theme = t; try { localStorage.setItem("pulse360-theme", t); } catch {} $("#theme-btn").setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme"); };
    $("#theme-btn").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
    // one drawer menu
    const d = $("#drawer"), sc = $("#scrim"), mb = $("#menu-btn");
    const close = () => { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); sc.classList.remove("show"); setTimeout(() => sc.hidden = true, 200); document.body.classList.remove("locked"); mb.setAttribute("aria-expanded", "false"); };
    const open = () => { sc.hidden = false; requestAnimationFrame(() => sc.classList.add("show")); d.classList.add("open"); d.setAttribute("aria-hidden", "false"); document.body.classList.add("locked"); mb.setAttribute("aria-expanded", "true"); $("#drawer-close").focus(); };
    mb.addEventListener("click", () => d.classList.contains("open") ? close() : open());
    $("#drawer-close").addEventListener("click", close); sc.addEventListener("click", close);
    d.addEventListener("click", e => { if (e.target.closest("a.d-link,a.chip")) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") { close(); sug.hidden = true; } });
    // live search suggestions
    const input = $("#hs-q"), sug = $("#hs-suggest"); let timer, ctl;
    const run = async q => {
      ctl?.abort(); ctl = new AbortController();
      sug.hidden = false; sug.innerHTML = '<div class="msg">Searching the world’s headlines…</div>';
      try {
        const r = await fetch("/api/search?limit=6&q=" + encodeURIComponent(q), { signal: ctl.signal });
        const data = await r.json(); if (!r.ok) throw 0;
        sug.innerHTML = (data.items || []).slice(0, 6).map(i => `<a href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(i.title)}<small>${esc(i.source || "")} · ${when(i)}</small></a>`).join("") + `<a class="all" href="/discover.html?q=${encodeURIComponent(q)}">See all results for “${esc(q)}” →</a>`;
        if (!data.items?.length) sug.innerHTML = `<div class="msg">No quick matches.</div><a class="all" href="/discover.html?q=${encodeURIComponent(q)}">Search everything for “${esc(q)}” →</a>`;
      } catch (e) { if (e.name !== "AbortError") sug.innerHTML = `<a class="all" href="/discover.html?q=${encodeURIComponent(q)}">Search for “${esc(q)}” →</a>`; }
    };
    input.addEventListener("input", () => { clearTimeout(timer); const q = input.value.trim(); if (q.length < 3) { sug.hidden = true; return; } timer = setTimeout(() => run(q), 400); });
    document.addEventListener("click", e => { if (!e.target.closest(".header-search")) sug.hidden = true; });
    $("#hs-form").addEventListener("submit", e => { if (!input.value.trim()) e.preventDefault(); });
    // social placeholders, back-to-top, broken images
    document.addEventListener("click", e => { const s = e.target.closest("[data-social]"); if (s) { e.preventDefault(); toast("Pulse360’s " + s.dataset.social + " page will be linked here once it is live."); } });
    $("#to-top")?.addEventListener("click", e => { e.preventDefault(); scrollTo({ top: 0, behavior: "smooth" }); });
    document.addEventListener("error", e => { const i = e.target; if (i.tagName === "IMG" && i.closest(".card-media,.slide,.m-media")) i.remove(); }, true);
  }
  document.addEventListener("DOMContentLoaded", () => { build(); wire(); document.dispatchEvent(new Event("p360:ready")); });
})();

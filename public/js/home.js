(() => {
  const P = window.P360, { esc, card, slide, swr, ICON } = P;
  const $ = s => document.querySelector(s);
  const BLOCKS = [
    ["Kenya", "Home turf", "kenya", "news"], ["Africa", "Across the continent", "africa", "news"], ["World", "Around the globe", "world", "news"],
    ["Sports", "Beyond the score", "world", "sports"], ["Kenyan sports", "Harambee Stars, athletics & more", "kenya", "sports"],
    ["Music", "Sounds & artists", "all", "music"], ["Culture & entertainment", "Screen, stage & people", "all", "culture"],
    ["Technology", "Ideas moving us forward", "all", "technology"], ["Business", "Markets & enterprise", "all", "business"],
    ["Agriculture", "Farming & food", "africa", "agriculture"], ["Health", "Wellbeing & medicine", "world", "health"], ["Science", "Discoveries & climate", "world", "science"],
    ["Uganda", "Country watch", "uganda", "news"], ["Tanzania", "Country watch", "tanzania", "news"], ["Nigeria", "Country watch", "nigeria", "news"], ["South Africa", "Country watch", "south-africa", "news"], ["Ethiopia", "Country watch", "ethiopia", "news"], ["Ghana", "Country watch", "ghana", "news"]
  ];
  let heroSig = "", paused = false;
  const stamp = fetchedAt => { const s = $("#upd"); if (!s) return; const t = fetchedAt ? Date.parse(fetchedAt) : NaN; s.textContent = "Live · auto-checks every minute · last source fetch " + (Number.isFinite(t) ? new Date(t).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }) : "time unavailable"); };

  function topList(items) {
    const t = [...items].sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0)).slice(0, 6);
    return `<aside class="top-list"><h3><span class="pulse"></span>Top headlines · live</h3><ol>${t.map(i => `<li><div><a data-story="${esc(i.id)}" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(i.title)}</a><small>${esc(i.source || "")} · ${P.ago(i.publishedAt)}</small></div></li>`).join("")}</ol></aside>`;
  }
  function renderHero(items) {
    const sig = items.map(i => [i.id, i.image || "", i.title || "", i.excerpt || ""].join("|")).join("¦"); if (!items.length || sig === heroSig) return; heroSig = sig;
    const slides = items.map(slide).join("");
    $("#hero").innerHTML = `<div class="sec-head"><div><span class="eyebrow">Featured · updated every minute</span><h2>Top news<i>.</i></h2></div></div><div class="top-grid"><div class="hero-wrap"><div class="hero-track" id="ht" tabindex="0" aria-label="Top stories — swipe">${slides}</div><button class="hero-nav prev" aria-label="Previous story">${ICON.l}</button><button class="hero-nav next" aria-label="Next story">${ICON.r}</button><div class="dots" id="dots">${items.map((_, i) => `<button aria-label="Story ${i + 1}"></button>`).join("")}</div></div>${topList(items)}</div>`;
    const t = $("#ht"), dots = [...$("#dots").children];
    const w = () => t.children[0].getBoundingClientRect().width + 12;
    const cur = () => Math.round(t.scrollLeft / w());
    const go = n => t.scrollTo({ left: ((n + items.length) % items.length) * w(), behavior: "smooth" });
    const mark = () => dots.forEach((d, k) => d.classList.toggle("on", k === cur()));
    t.addEventListener("scroll", () => requestAnimationFrame(mark), { passive: true }); mark();
    dots.forEach((d, k) => d.addEventListener("click", () => go(k)));
    $("#hero .prev").onclick = () => go(cur() - 1); $("#hero .next").onclick = () => go(cur() + 1);
  }
  const loadTop = (skipCache) => swr("top", {}, d => { renderHero(d.items || []); stamp(d.fetchedAt); }, { skipCache }).catch(() => { if (!heroSig) $("#hero").innerHTML = '<div class="error">Top stories are unavailable right now. Check your connection and tap “Refresh now”.</div>'; });
  const loadTicker = (skipCache) => swr("ticker", {}, d => {
    const items = d.items || []; if (!items.length) { $("#ticker").hidden = true; return; }
    const h = items.map(t => `<a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(t.tag)}</b>${esc(t.text)}</a>`).join("");
    $("#ticker-track").innerHTML = h + h;
  }, { skipCache }).catch(() => {});

  function block([title, eyebrow, region, category], i) {
    const el = document.createElement("section"); el.className = "section" + (i % 2 ? " alt" : "");
    const href = `/discover.html?region=${region}&category=${category}`;
    el.innerHTML = `<div class="container"><div class="sec-head"><div><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(title)}<i>.</i></h2></div><a class="see-all" href="${href}">See all →</a></div><div class="rail-wrap"><button class="rail-btn l" aria-label="Scroll left">${ICON.l}</button><div class="rail"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div><button class="rail-btn r" aria-label="Scroll right">${ICON.r}</button></div></div>`;
    const rail = el.querySelector(".rail"); let sig = "";
    el.querySelector(".l").onclick = () => rail.scrollBy({ left: -rail.clientWidth * .85, behavior: "smooth" });
    el.querySelector(".r").onclick = () => rail.scrollBy({ left: rail.clientWidth * .85, behavior: "smooth" });
    const paint = items => {
      const s = items.map(x => [x.id, x.image || "", x.title || "", x.excerpt || ""].join("|")).join("¦"); if (s === sig) return;
      if (sig && rail.scrollLeft > 40) return; // don't yank a rail the reader is browsing
      sig = s;
      rail.innerHTML = items.length ? items.map(card).join("") + `<a class="card" href="${href}" style="flex:0 0 190px;display:grid;place-items:center;font-weight:800;color:var(--red);text-align:center;padding:12px">Load more ${esc(title)} →</a>` : '<div class="empty">No stories right now — check back soon.</div>';
    };
    el._load = skipCache => swr("feed", { region, category, limit: 14 }, d => paint(d.items || []), { skipCache })
      .catch(e => { if (!sig) { rail.innerHTML = `<div class="error">${esc(e.message)} <button class="btn" style="margin-left:8px">Retry</button></div>`; rail.querySelector("button").onclick = () => el._load(true); } });
    new IntersectionObserver((en, ob) => { if (en[0].isIntersecting) { ob.disconnect(); el._started = true; el._load(); } }, { rootMargin: "800px" }).observe(el);
    return el;
  }

  document.addEventListener("p360:ready", () => {
    $("#countries").innerHTML = P.REG.map(r => `<a class="chip" href="/discover.html?region=${r[0]}">${r[1]}</a>`).join("");
    const hero = $("#hero");
    ["pointerdown", "mouseover", "focusin"].forEach(e => hero.addEventListener(e, () => paused = true));
    ["mouseleave", "focusout"].forEach(e => hero.addEventListener(e, () => paused = false));
    hero.addEventListener("pointerup", () => setTimeout(() => paused = false, 8000));
    setInterval(() => {
      const t = $("#ht"); if (!t || paused || document.hidden || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
      const w = t.children[0].getBoundingClientRect().width + 12, n = t.children.length;
      t.scrollTo({ left: ((Math.round(t.scrollLeft / w) + 1) % n) * w, behavior: "smooth" });
    }, 6500);
    loadTop(); loadTicker();
    const host = $("#blocks"), els = BLOCKS.map((b, i) => host.appendChild(block(b, i)));
    // AUTO UPDATE: every minute, silently refresh everything on the page
    const refresh = () => { if (document.hidden) return; loadTop(true); loadTicker(true); els.forEach(e => e._started && e._load(true)); };
    setInterval(refresh, 60000);
    let hiddenAt = 0;
    document.addEventListener("visibilitychange", () => { if (document.hidden) hiddenAt = Date.now(); else if (Date.now() - hiddenAt > 30000) refresh(); });
    $("#rf").onclick = () => { $("#upd").textContent = "Refreshing…"; refresh(); };
  });
})();

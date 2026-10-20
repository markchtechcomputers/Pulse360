(() => {
  const { esc, card, api, swr, CATS, REG } = window.P360;
  const $ = s => document.querySelector(s);
  const p = new URLSearchParams(location.search);
  const st = { category: p.get("category") || "all", region: p.get("region") || "all", q: p.get("q") || "", items: [], shown: 24, older: false, busy: false, pending: [] };
  const key = i => i.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").slice(0, 70);
  const catLabel = k => k === "all" ? "All topics" : (CATS.find(c => c[0] === k) || [0, k])[1];
  const regLabel = k => k === "all" ? "Everywhere" : (REG.find(r => r[0] === k) || [0, k])[1];
  const chips = () => {
    $("#cat-chips").innerHTML = [["all", "All"], ...CATS.map(c => [c[0], c[1]])].map(c => `<button class="chip ${st.category === c[0] ? "active" : ""}" data-c="${c[0]}">${c[1]}</button>`).join("");
    $("#reg-chips").innerHTML = [["all", "Everywhere"], ...REG].map(r => `<button class="chip ${st.region === r[0] ? "active" : ""}" data-r="${r[0]}">${r[1]}</button>`).join("");
  };
  const head = () => {
    const t = st.q ? "Results for “" + st.q + "”" : (st.category === "all" ? "Latest" : catLabel(st.category)) + (st.region === "all" ? "" : " · " + regLabel(st.region));
    $("#x-title").textContent = t; document.title = t + " — Pulse360";
    $("#x-eyebrow").textContent = st.q ? "SEARCH · " + regLabel(st.region).toUpperCase() : "LIVE FEED";
    $("#x-pill").innerHTML = st.q ? `<span class="qpill">Searching ${esc(regLabel(st.region))} <a href="/discover.html" aria-label="Clear search">✕</a></span>` : "";
    const u = new URLSearchParams(); if (st.q) u.set("q", st.q); if (st.category !== "all") u.set("category", st.category); if (st.region !== "all") u.set("region", st.region);
    history.replaceState(history.state, "", "/discover.html" + (u.toString() ? "?" + u : ""));
  };
  const stamp = () => $("#x-status").firstElementChild.textContent = "Live · auto-updates every minute · last update " + new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  const draw = () => {
    const list = st.items.slice(0, st.shown);
    $("#x-grid").innerHTML = list.length ? list.map(card).join("") : '<div class="empty" style="grid-column:1/-1">No stories found. Try another topic, region or search.</div>';
    const all = st.shown >= st.items.length && st.older;
    $("#x-more").hidden = all || !list.length; $("#x-more").textContent = "Load more stories ↓";
    $("#x-end").hidden = !(all && list.length);
  };
  const params = extra => ({ category: st.category, region: st.region, q: st.q, limit: 100, ...extra });
  async function more() {
    if (st.busy) return; st.busy = true; const btn = $("#x-more");
    try {
      if (st.shown < st.items.length) { st.shown += 24; draw(); return; }
      if (!st.older) { // week exhausted → go further back (last 30 days)
        st.older = true; btn.textContent = "Loading older stories…";
        const d = await api("feed", params({ days: 30 })), seen = new Set(st.items.map(key));
        const add = (d.items || []).filter(i => !seen.has(key(i)));
        st.items = st.items.concat(add); st.shown += 24;
      }
      draw();
    } catch { btn.textContent = "Couldn’t load — tap to retry"; st.older = false; } finally { st.busy = false; }
  }
  async function load() {
    chips(); head(); st.shown = 24; st.older = false; st.pending = []; $("#newbar").hidden = true; $("#x-end").hidden = true;
    $("#x-grid").innerHTML = Array(6).fill('<div class="skeleton"></div>').join(""); $("#x-more").hidden = true;
    let painted = false;
    try {
      await swr("feed", params(), d => { st.items = d.items; draw(); painted = true; stamp(); });
    } catch (e) { if (!painted) { $("#x-grid").innerHTML = `<div class="error" style="grid-column:1/-1">${esc(e.message)}</div>`; $("#x-status").firstElementChild.textContent = "Couldn’t refresh."; } }
  }
  // AUTO UPDATE: every minute check for new stories; offer them without jumping the page
  async function poll() {
    if (document.hidden || st.busy) return;
    try {
      const d = await api("feed", params()), have = new Set(st.items.map(key));
      const fresh = (d.items || []).filter(i => !have.has(key(i)));
      stamp();
      if (fresh.length) { st.pending = fresh; const b = $("#newbar"); b.textContent = "↑ " + fresh.length + " new " + (fresh.length > 1 ? "stories" : "story") + " — tap to show"; b.hidden = false; }
    } catch {}
  }
  document.addEventListener("p360:ready", () => {
    $("#cat-chips").addEventListener("click", e => { const b = e.target.closest("[data-c]"); if (b) { st.category = b.dataset.c; load(); } });
    $("#reg-chips").addEventListener("click", e => { const b = e.target.closest("[data-r]"); if (b) { st.region = b.dataset.r; load(); } });
    $("#x-more").addEventListener("click", more);
    $("#x-refresh").addEventListener("click", load);
    $("#newbar").addEventListener("click", () => { st.items = st.pending.concat(st.items); st.pending = []; $("#newbar").hidden = true; draw(); scrollTo({ top: 0, behavior: "smooth" }); });
    // infinite scroll: load more automatically as the reader nears the bottom
    new IntersectionObserver(en => { if (en[0].isIntersecting && !$("#x-more").hidden) more(); }, { rootMargin: "500px" }).observe($("#x-more"));
    setInterval(poll, 60000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); });
    load();
  });
})();

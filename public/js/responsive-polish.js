/* Shared responsive navigation, persistent search and safer social fallbacks for Pulse360. */
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = s => String(s || "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  function boot(){
    const header=$(".site-header");
    if(!header)return;
    let nav=$("#main-nav");
    if(!nav){
      nav=$(".article-nav");
      if(nav){
        nav.id="main-nav";
        const headerMain=$(".header-main",header);
        if(headerMain && !$("#menu-toggle")){
          const toggle=document.createElement("button");
          toggle.className="mobile-menu";toggle.id="menu-toggle";toggle.type="button";
          toggle.setAttribute("aria-label","Open navigation");toggle.setAttribute("aria-expanded","false");
          toggle.innerHTML="<span></span><span></span><span></span>";
          headerMain.insertBefore(toggle,nav);
        }
      }
    }
    const toggle=$("#menu-toggle");
    if(toggle && nav && !toggle.dataset.pulseBound){
      toggle.dataset.pulseBound="1";
      toggle.addEventListener("click",()=>{
        const open=nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded",String(open));
        toggle.setAttribute("aria-label",open?"Close navigation":"Open navigation");
      });
      nav.addEventListener("click",e=>{if(e.target.closest("a")&&matchMedia("(max-width:720px)").matches){nav.classList.remove("open");toggle.setAttribute("aria-expanded","false");}});
    }
    if(!$("#pulse-search-bar")){
      const wrap=document.createElement("section");
      wrap.id="pulse-search-bar";wrap.className="pulse-search-bar";
      wrap.innerHTML='<div class="container"><form role="search" id="pulse-global-search"><label class="sr-only" for="pulse-global-query">Search Pulse360 news, sport, music and culture</label><input id="pulse-global-query" type="search" placeholder="Search news, countries, teams, artists and topics…" autocomplete="off"><button type="submit">Search ↗</button></form><p class="pulse-search-hint">Search Pulse360 stories and current headlines from publishers worldwide.</p></div>';
      header.insertAdjacentElement("afterend",wrap);
      $("#pulse-global-search").addEventListener("submit",e=>{
        e.preventDefault();const q=$("#pulse-global-query").value.trim();if(!q)return;
        const params=new URLSearchParams({section:"news",region:"world",q});
        location.href="/discover.html?"+params.toString();
      });
    }
    // Hide duplicate, competing search controls because the persistent search is now always available.
    $("#search-toggle")?.setAttribute("aria-hidden","true");
    $("#search-toggle")?.setAttribute("tabindex","-1");
    // Preserve existing supplied social image URLs; if one fails, show an accessible fallback glyph.
    document.querySelectorAll(".social-link img").forEach(img=>{
      img.addEventListener("error",()=>{
        img.hidden=true;
        const fallback=img.nextElementSibling;
        if(fallback && fallback.classList.contains("social-fallback"))fallback.hidden=false;
        else{
          const span=document.createElement("span");span.className="social-fallback";span.setAttribute("aria-hidden","true");
          const label=(img.alt||"").toLowerCase();span.textContent=label.includes("instagram")?"◎":label.includes("youtube")?"▶":label.includes("telegram")?"➤":label.includes("tiktok")?"♪":label==="x"?"𝕏":label.includes("google")?"G":"f";
          img.insertAdjacentElement("afterend",span);
        }
      },{once:true});
    });
    const theme=$("#theme-toggle");
    const updateTheme=()=>{
      if(!theme)return;
      const dark=document.body.classList.contains("dark");
      theme.setAttribute("aria-label",dark?"Switch to light theme":"Switch to dark theme");
      theme.title=dark?"Switch to light theme":"Switch to dark theme";
      theme.innerHTML=dark?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"></path></svg>';
    };
    theme?.addEventListener("click",()=>setTimeout(updateTheme,0));
    updateTheme();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
(() => {
  const $ = s => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const state = {
    section: params.get("section") || "news",
    region: params.get("region") || "kenya",
    q: params.get("q") || ""
  };
  const sectionLabels = {news:"News",sports:"Sports",music:"Music & artists",entertainment:"Entertainment",technology:"Technology"};
  const regionLabels = {kenya:"Kenya",africa:"Africa",world:"World & international",international:"International"};
  const esc = value => String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dateLabel = value => {
    if(!value) return "Latest";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat("en-KE",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(d);
  };
  function syncLinks() {
    document.querySelectorAll("[data-section]").forEach(a => {
      const next = new URLSearchParams({section:a.dataset.section,region:state.region});
      a.href = "/discover.html?" + next.toString();
      a.classList.toggle("active",a.dataset.section===state.section);
    });
    document.querySelectorAll("[data-region]").forEach(a => {
      const next = new URLSearchParams({section:state.section,region:a.dataset.region});
      a.href = "/discover.html?" + next.toString();
      a.classList.toggle("active",a.dataset.region===state.region);
    });
  }
  function render(items) {
    const root=$("#discovery-results");
    if(!items.length) {
      root.innerHTML='<div class="discovery-error"><strong>No headlines returned.</strong><br>Try a broader search or choose another region. The live headline provider may also be temporarily unavailable.</div>';
      return;
    }
    root.innerHTML=items.map(item => {
      const date=dateLabel(item.publishedAt);
      const host = (()=>{try{return new URL(item.url).hostname.replace(/^www\./,"")}catch{return item.source||"Publisher"}})();
      return '<article class="discovery-item"><div><div class="discovery-meta"><span class="discovery-source">'+esc(item.source||host)+'</span><span>·</span><time>'+esc(date)+'</time></div><h2><a href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer">'+esc(item.title)+'</a></h2><p>'+esc(item.excerpt||"Open the original publisher for the full report.")+'</p></div><a class="discovery-open" href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer">Read source <span>↗</span></a></article>';
    }).join("");
  }
  async function load() {
    const title = (sectionLabels[state.section]||"News")+" · "+(regionLabels[state.region]||"Kenya");
    $("#discovery-title").textContent=title+".";
    document.title=title+" headlines — Pulse360";
    $("#discovery-query").value=state.q;
    syncLinks();
    $("#discovery-status").textContent="Searching current headlines…";
    $("#discovery-results").innerHTML='<div class="discovery-error">Contacting headline feeds…</div>';
    const search=new URLSearchParams({section:state.section,region:state.region});
    if(state.q) search.set("q",state.q);
    try {
      const response=await fetch("/api/discover?"+search.toString());
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"Headline search failed");
      render(data.results||[]);
      const when=dateLabel(data.fetchedAt);
      $("#discovery-status").textContent=(data.total||0)+" headlines found for "+title+(state.q?' · Search: “'+state.q+'”':"")+" · Updated "+when;
    } catch(error) {
      $("#discovery-results").innerHTML='<div class="discovery-error"><strong>Live search is temporarily unavailable.</strong><br>'+esc(error.message||"Please try again shortly.")+'<br><button class="outline-button" id="retry-discovery" type="button">Try again ↻</button></div>';
      $("#discovery-status").textContent="Could not retrieve live headlines.";
      $("#retry-discovery")?.addEventListener("click",load);
    }
  }
  document.addEventListener("DOMContentLoaded",()=>{
    $("#year").textContent=new Date().getFullYear();
    if(localStorage.getItem("pulse360-theme")==="dark")document.body.classList.add("dark");
    $("#theme-toggle").addEventListener("click",()=>{
      document.body.classList.toggle("dark");
      localStorage.setItem("pulse360-theme",document.body.classList.contains("dark")?"dark":"light");
      $("#theme-toggle").setAttribute("aria-label",document.body.classList.contains("dark")?"Switch to light theme":"Switch to dark theme");
    });
    $("#discovery-search").addEventListener("submit",e=>{
      e.preventDefault();state.q=$("#discovery-query").value.trim();
      const next=new URLSearchParams({section:state.section,region:state.region});
      if(state.q)next.set("q",state.q);
      history.replaceState(null,"","/discover.html?"+next.toString());
      load();
    });
    load();
  });
})();
(() => {
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const state = {stories:[],category:"all",limit:6,query:"",searchOpen:false};
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const dateLabel = value => { const d=new Date(value+"T12:00:00"); return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat("en-KE",{day:"numeric",month:"short",year:"numeric"}).format(d); };
  const card = (story, hero=false) => `<article class="${hero?"hero-card":"story-card"}"><a class="story-image" href="/story.html?slug=${encodeURIComponent(story.slug)}" aria-label="Read: ${escapeHtml(story.title)}"><img src="${escapeHtml(story.image)}" alt="" loading="lazy" onerror="this.style.display='none'"></a><a class="category-label" href="#latest" data-category-link="${escapeHtml(story.categoryKey)}">${escapeHtml(story.category)}</a>${hero?'<h1>':'<h3>'}<a href="/story.html?slug=${encodeURIComponent(story.slug)}">${escapeHtml(story.title)}</a>${hero?'</h1>':'</h3>'}<p>${escapeHtml(story.excerpt)}</p><div class="story-meta"><span class="author">${escapeHtml(story.author)}</span><span>·</span><time datetime="${escapeHtml(story.date)}">${dateLabel(story.date)}</time><span>·</span><span>${story.readTime} min read</span></div></article>`;
  async function fetchStories(params={}) {
    const query = new URLSearchParams(params);
    const response = await fetch("/api/stories"+(query.size?"?"+query:""));
    if(!response.ok) throw new Error("Could not load stories");
    return (await response.json()).stories;
  }
  function renderCards(selector, items, hero=false) {
    const target=$(selector); if(target) target.innerHTML=items.length?items.map(s=>card(s,hero)).join(""):'<p class="empty-state">New stories are on the way.</p>';
  }
  async function init() {
    $("#year").textContent=new Date().getFullYear();
    $("#today-date").textContent=new Intl.DateTimeFormat("en-KE",{weekday:"short",day:"numeric",month:"short",year:"numeric"}).format(new Date());
    $("#brief-date").textContent=new Intl.DateTimeFormat("en-KE",{day:"2-digit",month:"short",year:"numeric"}).format(new Date()).toUpperCase()+" · KENYA";
    const savedTheme=localStorage.getItem("pulse360-theme");
    if(savedTheme==="dark") document.body.classList.add("dark");
    $("#theme-toggle").addEventListener("click",()=>{
      document.body.classList.toggle("dark");
      const theme=document.body.classList.contains("dark")?"dark":"light";
      localStorage.setItem("pulse360-theme",theme);
      $("#theme-toggle").setAttribute("aria-label",theme==="dark"?"Switch to light theme":"Switch to dark theme");
    });
    $("#menu-toggle").addEventListener("click",()=>{
      const open=$("#main-nav").classList.toggle("open");
      $("#menu-toggle").setAttribute("aria-expanded",String(open));
      $("#menu-toggle").setAttribute("aria-label",open?"Close navigation":"Open navigation");
    });
    $("#search-toggle").addEventListener("click",()=>{
      const drawer=$("#search-drawer");drawer.hidden=!drawer.hidden;
      if(!drawer.hidden) $("#search-input").focus();
    });
    $("#search-close").addEventListener("click",()=>{$("#search-drawer").hidden=true;$("#search-results").innerHTML="";});
    $("#search-form").addEventListener("submit",async e=>{
      e.preventDefault();const q=$("#search-input").value.trim();if(!q)return;
      $("#search-results").innerHTML='<p class="muted">Searching stories…</p>';
      try{const found=await fetchStories({q,limit:8});$("#search-results").innerHTML=found.length?found.map(s=>`<a class="search-result" href="/story.html?slug=${encodeURIComponent(s.slug)}"><span>${escapeHtml(s.category)}</span>${escapeHtml(s.title)}</a>`).join(""):'<p>No stories found. Try another search.</p>';}
      catch{$("#search-results").innerHTML="<p>Search is temporarily unavailable. Try again.</p>";}
    });
    $("#category-filters").addEventListener("click",e=>{
      const btn=e.target.closest("[data-filter]");if(!btn)return;
      state.category=btn.dataset.filter;state.limit=6;
      $$(".filter-chip").forEach(b=>b.classList.toggle("active",b===btn));
      renderLatest();
    });
    document.addEventListener("click",e=>{
      const link=e.target.closest("[data-category-link]");if(!link)return;
      const category=link.dataset.categoryLink;
      if(!category)return;
      e.preventDefault();state.category=category;state.limit=6;
      $$(".filter-chip").forEach(b=>b.classList.toggle("active",b.dataset.filter===category));
      $("#latest").scrollIntoView({behavior:"smooth"});renderLatest();
    });
    $("#load-more").addEventListener("click",()=>{state.limit=50;renderLatest();$("#load-more").textContent="Showing available stories";});
    $("#newsletter-form").addEventListener("submit",async e=>{
      e.preventDefault();const message=$("#newsletter-message");message.textContent="Checking sign-up…";
      try{const res=await fetch("/api/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("#newsletter-email").value})});const data=await res.json();message.textContent=data.error||"Thanks for your interest."; }
      catch{message.textContent="Could not connect. Please try again later.";}
    });
    try {
      state.stories=await fetchStories({limit:50});
      const featured=state.stories.filter(s=>s.featured).slice(0,3);
      renderCards("#hero-grid",featured.length?featured:state.stories.slice(0,3),true);
      renderCards("#sports-grid",state.stories.filter(s=>s.categoryKey==="sports").slice(0,3));
      renderCards("#culture-grid",state.stories.filter(s=>s.categoryKey==="entertainment").slice(0,3));
      renderCards("#technology-grid",state.stories.filter(s=>s.categoryKey==="technology").slice(0,3));
      renderLatest();
    } catch {
      $("#hero-grid").innerHTML='<div class="empty-state">Stories could not load. Refresh the page or try again shortly.</div>';
      $("#latest-grid").innerHTML="";
      $("#empty-state").hidden=false;
    }
  }
  async function renderLatest(){
    const items=state.stories.filter(s=>state.category==="all"||s.categoryKey===state.category);
    const shown=items.slice(0,state.limit);
    renderCards("#latest-grid",shown);
    $("#empty-state").hidden=shown.length>0;
    $("#load-more").hidden=items.length<=state.limit;
  }
  document.addEventListener("DOMContentLoaded",init);
})();

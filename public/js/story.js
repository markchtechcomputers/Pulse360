(() => {
 const $=s=>document.querySelector(s);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const date=s=>{const d=new Date(s+"T12:00:00");return isNaN(d)?s:new Intl.DateTimeFormat("en-KE",{day:"numeric",month:"long",year:"numeric"}).format(d)};
 const card=s=>`<article class="story-card"><a class="story-image" href="/story.html?slug=${encodeURIComponent(s.slug)}"><img src="${esc(s.image)}" alt="" loading="lazy"></a><span class="category-label">${esc(s.category)}</span><h3><a href="/story.html?slug=${encodeURIComponent(s.slug)}">${esc(s.title)}</a></h3><p>${esc(s.excerpt)}</p></article>`;
 document.addEventListener("click",e=>{
  const social=e.target.closest("[data-social-coming]");
  if(!social)return;
  e.preventDefault();
  let toast=document.querySelector("#toast");
  if(!toast){toast=document.createElement("div");toast.id="toast";toast.className="toast";toast.setAttribute("role","status");document.body.appendChild(toast);}
  toast.textContent="Pulse360’s "+social.dataset.socialComing+" account will be linked here once it is created.";
  toast.classList.add("show");
  window.clearTimeout(window.__pulse360ToastTimer);
  window.__pulse360ToastTimer=window.setTimeout(()=>toast.classList.remove("show"),3200);
 });
 document.addEventListener("DOMContentLoaded",async()=>{
  $("#year").textContent=new Date().getFullYear();
  if(localStorage.getItem("pulse360-theme")==="dark")document.body.classList.add("dark");
  $("#theme-toggle").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("pulse360-theme",document.body.classList.contains("dark")?"dark":"light")});
  const slug=new URLSearchParams(location.search).get("slug");
  if(!slug){$("#article-root").innerHTML='<div class="container article-loading">No story was selected. <a href="/">Return to Pulse360</a>.</div>';return}
  try{
   const response=await fetch("/api/stories/"+encodeURIComponent(slug));
   if(!response.ok)throw new Error("missing");
   const {story,related}=await response.json();
   document.title=story.title+" — Pulse360";
   document.querySelector('meta[name="description"]').content=story.excerpt;
   $("#article-root").innerHTML=`<article><header class="article-header"><a class="category-label" href="/#latest" data-cat="${esc(story.categoryKey)}">${esc(story.category)}</a><h1>${esc(story.title)}</h1><p class="article-deck">${esc(story.excerpt)}</p><div class="story-meta"><span class="author">${esc(story.author)}</span><span>·</span><time datetime="${esc(story.date)}">${date(story.date)}</time><span>·</span><span>${story.readTime} min read</span></div></header><div class="article-hero"><img src="${esc(story.image)}" alt="" onerror="this.style.display='none'"></div><div class="article-body">${(story.body||[]).map(p=>"<p>"+esc(p)+"</p>").join("")}<div class="article-note"><strong>Editorial note:</strong> This demonstration site contains sample stories and illustrative copy, not a live verified news feed. Confirm facts and replace sample material before publishing.</div></div></article><section class="related-section"><div class="container"><h2>More from Pulse360</h2><div class="story-grid">${related.length?related.map(card).join(""):'<p>More stories coming soon.</p>'}</div></div></section>`;
  }catch{$("#article-root").innerHTML='<div class="container article-loading"><h1>Story not found</h1><p>This story may have moved or the link is incorrect.</p><a class="text-link" href="/">Return to Pulse360 ↗</a></div>'}
 });
})();

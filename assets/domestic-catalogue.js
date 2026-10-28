(()=>{'use strict';const grid=document.getElementById('domestic-list');if(!grid)return;
const search=document.getElementById('domestic-search'),dest=document.getElementById('domestic-destination'),type=document.getElementById('domestic-type'),count=document.getElementById('domestic-count');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
fetch('assets/packages.json').then(r=>{if(!r.ok)throw Error('Unable to load catalogue');return r.json()}).then(all=>{
const data=all.filter(x=>x.published!==false&&['Domestic','Pilgrimage'].includes(x.category));
const ds=[...new Set(data.map(x=>x.destination))].sort((a,b)=>a.localeCompare(b));
dest.innerHTML='<option value="">All destinations</option>'+ds.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('');
const params=new URLSearchParams(location.search);if(ds.includes(params.get('destination')))dest.value=params.get('destination');
function render(){const q=search.value.trim().toLowerCase();const list=data.filter(x=>(!dest.value||x.destination===dest.value)&&(!type.value||x.category===type.value)&&(!q||[x.name,x.destination,x.summary,...(x.route||[])].join(' ').toLowerCase().includes(q)));
count.textContent=`Showing ${list.length} of ${data.length} India tours`;
grid.innerHTML=list.length?list.map(x=>`<article class="card"><img class="card-image" src="${esc(x.image)}" data-destination="${esc(x.destination)}" alt="${esc(x.destination)} — ${esc(x.name)}" loading="lazy"><div class="card-body"><div class="card-meta">${esc(x.category)} · ${esc(x.destination)} · ${esc(x.duration)}</div><h3>${esc(x.name)}</h3><p>${esc((x.route||[]).join(' • '))}</p><div class="package-price">Personalised quote available</div><a class="card-link" href="tours/${encodeURIComponent(x.slug)}.html">View itinerary <span aria-hidden="true">↗</span></a></div></article>`).join(''):'<p>No tours match your filters. Try another destination or tour type.</p>'}
[search,dest,type].forEach(el=>el.addEventListener(el===search?'input':'change',render));render();
}).catch(()=>{grid.innerHTML='<p>Packages could not be loaded. Please run the website through a local server and refresh.</p>';count.textContent='Catalogue unavailable'});
})();
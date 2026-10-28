/* Destination-specific Wikimedia Commons photographs.
   This progressive enhancement loads licensed photographs when online; local SVGs remain the offline fallback.
   Photographs are sourced from Commons and carry a clickable attribution below each card. */
(()=>{'use strict';
const QUERY={"Kashmir": "Dal Lake Srinagar Kashmir", "Kerala": "Kerala backwaters houseboat", "Himachal Pradesh": "Manali Himachal Pradesh mountains", "Rajasthan": "Hawa Mahal Jaipur", "Karnataka": "Mysore Palace", "Sikkim & Darjeeling": "Darjeeling tea gardens", "Uttarakhand": "Nainital lake", "Ladakh": "Pangong Tso lake", "Andaman": "Radhanagar Beach Andaman", "Other Destinations": "Kedarnath temple", "Northeast India": "Shillong Meghalaya", "Maharashtra": "Ajanta caves", "Tamil Nadu": "Meenakshi Temple", "Uttar Pradesh": "Varanasi Ganges ghats", "Golden Triangle": "Taj Mahal Agra", "Delhi & Agra": "Taj Mahal Agra", "Gujarat": "Rann of Kutch", "Goa": "Palolem beach Goa", "Punjab": "Golden Temple Amritsar", "Odisha": "Konark Sun Temple", "Madhya Pradesh": "Khajuraho temples", "Bhutan": "Paro Taktsang monastery", "Nepal": "Pashupatinath Kathmandu", "Vietnam": "Ha Long Bay", "Thailand": "Wat Arun Bangkok", "Indonesia": "Bali Uluwatu temple", "Singapore": "Marina Bay Sands", "Malaysia": "Petronas Towers", "Sri Lanka": "Sigiriya rock", "Maldives": "Maldives beach", "Mauritius": "Le Morne Brabant", "Seychelles": "Anse Source Argent", "Japan": "Mount Fuji", "South Korea": "Gyeongbokgung palace", "China": "Great Wall China", "Hong Kong": "Victoria Harbour", "Turkey": "Cappadocia balloons", "Egypt": "Giza pyramids", "Jordan": "Petra treasury", "Oman": "Sultan Qaboos Grand Mosque", "Switzerland": "Matterhorn", "France & Switzerland": "Eiffel Tower", "Italy": "Colosseum Rome", "Spain": "Sagrada Familia", "Croatia": "Dubrovnik old town", "Greece": "Santorini Oia", "Norway": "Geirangerfjord", "Iceland": "Skogafoss", "United Kingdom": "Tower Bridge London", "Australia": "Sydney Opera House", "New Zealand": "Milford Sound", "South Africa": "Table Mountain", "Kenya": "Masai Mara", "United States": "Grand Canyon", "Canada": "Lake Louise Banff", "United Arab Emirates": "Burj Khalifa"};
const promises=new Map(),queue=[];let active=0;
function lookup(d){
 if(promises.has(d))return promises.get(d);
 const promise=new Promise(resolve=>{queue.push({d,resolve});pump()});
 promises.set(d,promise);return promise;
}
function pump(){
 while(active<3&&queue.length){
  const {d,resolve}=queue.shift();active++;
  const search=QUERY[d]||d;
  const p=new URLSearchParams({action:'query',generator:'search',gsrsearch:'filetype:bitmap '+search,gsrnamespace:'6',gsrlimit:'12',prop:'imageinfo',iiprop:'url|size|mime|extmetadata',iiurlwidth:'900',format:'json',origin:'*'});
  fetch('https://commons.wikimedia.org/w/api.php?'+p.toString())
   .then(r=>{if(!r.ok)throw Error('Image search failed');return r.json()})
   .then(body=>{
    const pages=Object.values(body.query?.pages||{});
    const candidates=pages.map(x=>({title:x.title,info:x.imageinfo?.[0]})).filter(x=>{
     const i=x.info;if(!i||i.mime!=='image/jpeg'||i.width<750||!i.thumburl)return false;
     const license=i.extmetadata?.LicenseShortName?.value||'';
     return /CC BY|CC0|Public domain|PD-|PDM/i.test(license);
    });
    const match=candidates.find(x=>x.title.toLowerCase().includes(search.split(' ')[0].toLowerCase()))||candidates[0];
    if(!match){resolve(null);return;}
    const i=match.info,m=i.extmetadata||{};
    const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&[^;]+;/g,' ').trim();
    resolve({url:i.thumburl,source:i.descriptionurl||i.url,author:clean(m.Artist?.value)||'Wikimedia Commons contributor',license:clean(m.LicenseShortName?.value)||'Commons license',title:match.title.replace(/^File:/,'')});
   }).catch(()=>resolve(null)).finally(()=>{active--;pump()});
 }
}
function decorate(img){
 if(img.dataset.photoAttempted)return;
 const d=img.dataset.destination;if(!d)return;
 img.dataset.photoAttempted='1';
 lookup(d).then(photo=>{
  if(!photo)return;
  const test=new Image();
  test.onload=()=>{
   img.src=photo.url;
   const card=img.closest('.card')||img.closest('.destination-photo-wrap')||img.parentElement;
   if(card&&!card.querySelector('.photo-credit')){
    const a=document.createElement('a');a.className='photo-credit';a.href=photo.source;
    a.target='_blank';a.rel='noopener noreferrer';
    a.textContent='Photo: '+photo.author+' · '+photo.license;
    a.title=photo.title+' · View source and license';
    img.insertAdjacentElement('afterend',a);
   }
  };
  test.src=photo.url;
 });
}
function scan(){document.querySelectorAll('img[data-destination]').forEach(decorate)}
function init(){scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

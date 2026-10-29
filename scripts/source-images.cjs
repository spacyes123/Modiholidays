/* Maintainer tool: fetch licensed Commons photos once; visitors never search at runtime. */
const fs=require('node:fs'),path=require('node:path');
const sharp=require(process.env.SHARP_PATH||'sharp');
const root=path.join(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'assets/packages.json')));
const queries=JSON.parse(fs.readFileSync(path.join(root,'assets/image-queries.json')));
const target=path.join(root,'assets/photos');fs.mkdirSync(target,{recursive:true});
const manifestPath=path.join(root,'assets/image-manifest.json');
const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath)):{};
const used=new Set(Object.values(manifest).map(x=>x.source));
const cache=new Map();
const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#\d+;/g,'').trim();
async function json(url){for(let n=0;n<6;n++){const r=await fetch(url,{headers:{'User-Agent':'ModiHolidaysImagePreparation/1.0 (destination photo attribution)'}});if(r.status===429){await new Promise(r=>setTimeout(r,15000));continue}if(!r.ok)throw Error(r.status+' '+url);return r.json()}throw Error('Rate limited')}
async function source(p){
 if(manifest[p.id])return;
 const query=queries[p.id]||queries[p.destination]||p.destination;
 const searches=[query];
 for(const search of searches){
  const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:'filetype:bitmap '+search,gsrnamespace:'6',gsrlimit:'18',prop:'imageinfo',iiprop:'url|size|mime|extmetadata',iiurlwidth:'1280',format:'json'});
  const body=cache.get(search)||await json('https://commons.wikimedia.org/w/api.php?'+params);cache.set(search,body);
  const candidates=Object.values(body.query?.pages||{}).sort((a,b)=>a.index-b.index);
  for(const c of candidates){
   const i=c.imageinfo?.[0],m=i?.extmetadata||{},license=clean(m.LicenseShortName?.value);
   if(!i||!['image/jpeg','image/png'].includes(i.mime)||i.width<800||!i.thumburl||used.has(i.descriptionurl)||/map|portrait|logo|plaque|information|signboard|airport|immigration|ramen|peas|century|engraving|painting|illustration|18[0-9]{2}|19[0-4][0-9]/i.test(c.title)||!/^(CC BY(?:-SA)? [\d.]+|CC0.*|Public domain|PDM.*)$/.test(license)||i.height>i.width*1.3)continue;
   try{
    const r=await fetch(i.thumburl);if(!r.ok)continue;
    const bytes=Buffer.from(await r.arrayBuffer()),base=p.id.toLowerCase();
    await sharp(bytes).rotate().resize({width:1280,withoutEnlargement:true}).webp({quality:79}).toFile(path.join(target,base+'.webp'));
    await sharp(bytes).rotate().resize({width:640,withoutEnlargement:true}).webp({quality:76}).toFile(path.join(target,base+'-640.webp'));
    manifest[p.id]={image:'assets/photos/'+base+'.webp',small:'assets/photos/'+base+'-640.webp',alt:clean(c.title.replace(/^File:/,'').replace(/\.(jpg|jpeg|png)$/i,'')),destination:p.destination,query:search,source:i.descriptionurl,original:i.url,author:clean(m.Artist?.value),license,licenseUrl:m.LicenseUrl?.value||'https://commons.wikimedia.org/wiki/Commons:Licensing',changes:'Resized and converted to WebP; displayed with object-fit cropping.',verifiedAt:new Date().toISOString().slice(0,10),review:'Source metadata checked; visual review pending'};
    used.add(i.descriptionurl);fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');console.log(p.id,p.destination,license,c.title);return;
   }catch(e){console.log('candidate failed',p.id,e.message)}
  }
 }
 console.log('UNRESOLVED',p.id,p.destination);
}
(async()=>{for(const p of data){if(manifest[p.id])continue;await source(p).catch(e=>console.log('FAILED',p.id,e.message));await new Promise(r=>setTimeout(r,1800))}console.log('Mapped',Object.keys(manifest).length,'of',data.length)})();

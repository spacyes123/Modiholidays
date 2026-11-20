const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const prototype=fs.readFileSync(path.join(__dirname,'../assets/bespoke/prototype.js'),'utf8');
const packages=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/packages.json'),'utf8'));
const planner=fs.readFileSync(path.join(__dirname,'../plan-my-holiday.html'),'utf8');
const escape=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('homepage keeps all 140 tours and catalogue-backed destination, type and duration controls',()=>{
 assert.equal(packages.length,140);
 assert.equal(new Set(packages.map(p=>p.id)).size,140);assert.equal(new Set(packages.map(p=>p.slug)).size,140);
 for(const id of ['holiday-destination','holiday-category','holiday-duration','holiday-month','holiday-reset'])assert.ok(html.includes(`id="${id}"`));
 const options=[...html.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map(x=>x[1]);
 for(const p of packages)assert.ok(options.includes(escape(p.destination)),`destination option missing: ${p.destination}`);
 assert.ok(html.indexOf('id="holiday-search"')<html.indexOf('class="trust"'),'search panel should overlap the hero before the trust strip');
 assert.match(html,/id="holiday-destination"><option value="">All destinations/);assert.match(html,/id="holiday-category"><option value="">All holidays/);
 assert.match(html,/<summary>Domestic<\/summary>/);assert.match(html,/<summary>International<\/summary>/);
 for(const item of ['Group Tours','About Us','Contact','Get a Quote'])assert.ok(html.includes(`>${item}</a>`),`primary navigation missing ${item}`);
 const nights=[...new Set(packages.map(p=>Number(p.duration.match(/\/\s*(\d+)\s*Nights?/i)?.[1])).filter(Number.isFinite))].sort((a,b)=>a-b);
 for(const n of nights)assert.match(html,new RegExp(`<option value="${n}">${n} nights<\\/option>`),`duration filter misses ${n} catalogue nights`);
});
test('travel month is a planning preference without invented departure availability',()=>{
 assert.match(html,/id="holiday-month"/);assert.match(html,/departure availability is not published/);
 assert.match(html,/Trip duration \(nights\)/);assert.match(html,/value="4">4 nights/);
 assert.match(prototype,/const month=document\.getElementById\('holiday-month'\)\.value/);
 assert.match(prototype,/function durationNights/);assert.match(prototype,/preferred duration: /i);
 assert.doesNotMatch(prototype,/p\.month\s*===|p\.departureMonth/);
});
test('enquiry requires consent and a reply channel, then prepares WhatsApp and copy fallback',()=>{
 assert.match(html,/id="consent"[^>]*required/);assert.match(html,/id="email"/);assert.match(html,/id="mobile"/);
 assert.match(html,/Send Enquiry via WhatsApp/);assert.match(html,/id="copy-enquiry"/);assert.match(prototype,/Enter an email or mobile number/);
 assert.match(html,/I agree to share these details with Modi Holidays in WhatsApp/);
 for(const id of ['departure-city','budget'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(planner,/id="whatsapp-consent"[^>]*required/);assert.match(planner,/Send enquiry via WhatsApp/);
 assert.match(prototype,/window\.open\(url,'_blank'\)/);assert.match(prototype,/Open WhatsApp if it did not open/);
 assert.match(prototype,/Email: /);assert.match(prototype,/Mobile: /);assert.match(html,/wa\.me\/917666018401/);
});
test('approved logo variants, typography, colours and SEO tags remain present',()=>{
 assert.match(html,/assets\/brand\/approved\/modi-holidays-logo-dark-background\.png/);assert.match(html,/assets\/brand\/approved\/modi-holidays-logo-light-background\.png/);assert.match(html,/social-sharing-approved\.png/);assert.match(html,/floating-whatsapp[^]*?href="https:\/\/wa\.me\/917666018401"/);assert.match(html,/Cormorant\+Garamond/);assert.match(html,/Manrope/);
 for(const c of ['#55234B','#F39A24','#FFF8F0','#FFFFFF','#29232B','#6C5968'])assert.ok(html.toLowerCase().includes(c.toLowerCase()),`missing palette value ${c}`);
 assert.doesNotMatch(html,/name="robots" content="noindex/);assert.match(html,/rel="canonical"/);assert.match(html,/<meta name="description"/);
});

import json,re,html,shutil,zipfile,os
from pathlib import Path
from urllib.parse import quote
root=Path(__file__).resolve().parent; assets=root/'assets'; data=json.loads((assets/'packages.json').read_text())
# retain original data; improve structured tour info without claiming unconfirmed details
for p in data:
 p.setdefault('published',True);p.setdefault('hotelCategory','Comfort / Deluxe hotels (or similar, subject to availability)')
 p.setdefault('meals','Meal plan confirmed in the final quotation')
 p.setdefault('transport','Private transfers / sightseeing vehicle as specified in your quotation')
 p.setdefault('inclusions',['Suggested day-wise sightseeing programme','Hotel options in the selected category','Transfer and vehicle options on request','Assistance with customised travel planning'])
 p.setdefault('exclusions',['Flights and train tickets unless expressly included','Attraction tickets, activities and permits unless confirmed','Personal expenses, tips and incidental charges','Any service not listed in the final written quotation'])
 p.setdefault('faq',[{'question':'Can this itinerary be customised?','answer':'Yes. Modi Holidays can tailor the route, hotel category, pace and sightseeing to your travel dates and preferences.'},{'question':'Are hotels and departure dates confirmed?','answer':'No. Hotel names, transport, inclusions and dates are proposed until confirmed in writing after your enquiry.'}])
 p['slug']=re.sub(r'[^a-z0-9]+','-',p['name'].lower()).strip('-')+'-'+p['id'].lower()
(assets/'packages.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
# HTML static indexed tour pages. CSS and JS from ../assets.
tours=root/'tours';tours.mkdir(exist_ok=True)
esc=html.escape
for p in data:
 if not p.get('published',True):continue
 title=f"{p['name']} | {p['duration']} Tour Itinerary | Modi Holidays"
 desc=f"Explore the {p['duration']} {p['name']} itinerary covering {', '.join(p['route'][:4])}. View day-wise sightseeing, hotel options and request a personalised quote."
 canonical=f"https://modiholidays.in/tours/{p['slug']}.html"
 faq=p['faq']
 ld={'@context':'https://schema.org','@graph':[{'@type':'TouristTrip','name':p['name'],'description':p['summary'],'touristType':'Families and private groups','itinerary':{'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'name':f'Day {i+1}','description':d} for i,d in enumerate(p['days'])]},'provider':{'@type':'TravelAgency','name':'Modi Holidays','url':'https://modiholidays.in'},'url':canonical},{'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':'https://modiholidays.in/'},{'@type':'ListItem','position':2,'name':'Packages','item':'https://modiholidays.in/packages.html'},{'@type':'ListItem','position':3,'name':p['name'],'item':canonical}]},{'@type':'FAQPage','mainEntity':[{'@type':'Question','name':f['question'],'acceptedAnswer':{'@type':'Answer','text':f['answer']}} for f in faq]}]}
 days=''.join(f'<section class="itinerary-day"><h3>Day {i+1}</h3><p>{esc(d)}</p></section>' for i,d in enumerate(p['days']))
 bullets=lambda a:'<ul>'+''.join('<li>'+esc(s)+'</li>' for s in a)+'</ul>'
 faqs=''.join(f'<details><summary>{esc(f["question"])}</summary><p>{esc(f["answer"])}</p></details>' for f in faq)
 htmlpage=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{esc(title)}</title><meta name="description" content="{esc(desc,quote=True)}"><meta name="robots" content="index,follow"><link rel="canonical" href="{canonical}"><link rel="icon" href="../assets/logo.svg" type="image/svg+xml"><link rel="stylesheet" href="../assets/styles.css"><script type="application/ld+json">{json.dumps(ld,ensure_ascii=False).replace('<','\\u003c')}</script></head><body><header class="simple-header"><div class="container simple-header-inner"><a href="../index.html"><img src="../assets/logo.svg" alt="Modi Holidays" width="250"></a><nav><a href="../packages.html">All Packages</a> <a href="../domestic-holidays.html">Domestic</a> <a href="../international-holidays.html">International</a> <a href="../plan-my-holiday.html">Plan My Holiday</a></nav></div></header><main><section class="page-hero"><div class="container"><p class="breadcrumb"><a href="../index.html">Home</a> / <a href="../packages.html">Packages</a> / {esc(p['name'])}</p><p class="kicker">{esc(p['category'])} · {esc(p.get('destination',''))} · {esc(p['duration'])}</p><h1>{esc(p['name'])}</h1><p>{esc(p['summary'])}</p></div></section><section class="section"><div class="container package-detail-layout"><article><img class="detail-photo" src="{esc(p['image'],quote=True)}" alt="{esc(p['destination'])} holiday scenery" loading="lazy"><h2>Places covered</h2><p>{esc(' → '.join(p['route']))}</p><h2>Day-wise sightseeing itinerary</h2><p class="muted">Suggested itinerary. Exact travel times, hotel availability, entry tickets and activities are confirmed in your quotation.</p><div class="itinerary">{days}</div><h2>Accommodation</h2><p>{esc(p['hotelCategory'])}</p><h2>Meals and transport</h2><p><strong>Meals:</strong> {esc(p['meals'])}</p><p><strong>Transport:</strong> {esc(p['transport'])}</p><h2>Proposed inclusions</h2>{bullets(p['inclusions'])}<h2>Proposed exclusions</h2>{bullets(p['exclusions'])}<h2>Frequently asked questions</h2>{faqs}</article><aside class="package-aside"><div class="card-body"><p class="card-meta">{esc(p['category'])} · {esc(p['duration'])}</p><h2>Get a personalised quote</h2><p>Prices are not displayed. Tell us your dates and travel preferences; we will confirm arrangements in writing.</p><a class="btn btn-primary" href="../plan-my-holiday.html?destination={quote(p['name'])}">Request a quote ↗</a><p><a href="../packages.html">← Browse all packages</a></p><hr><p class="muted">Hotel examples and alternatives are subject to availability. No departure or booking is guaranteed before confirmation.</p></div></aside></div></section></main><footer class="site-footer"><div class="container"><p>© Modi Holidays · Mumbai, India · <a href="../contact.html">Contact</a> · <a href="../privacy.html">Privacy</a></p></div></footer></body></html>'''
 # Add a destination-specific photo and public-domain image lookup on every generated tour page.
 photo=f'<div class="destination-photo-wrap"><img class="detail-photo" src="../{esc(p["image"],quote=True)}" data-destination="{esc(p["destination"],quote=True)}" alt="{esc(p["destination"])} scenery for {esc(p["name"])}" loading="lazy"></div>'
 htmlpage=re.sub(r'<img class="detail-photo" src="[^"]+" alt="[^"]+" loading="lazy">',lambda _:photo,htmlpage,count=1)
 htmlpage=htmlpage.replace('</body>','<script defer src="../assets/destination-photos.js"></script></body>')
 (tours/(p['slug']+'.html')).write_text(htmlpage)
# modify JS to use static indexable pages and remove price display
js=(assets/'packages.js').read_text()
js=js.replace('href="package.html?id=${encodeURIComponent(x.id)}"','href="tours/${esc(x.slug)}.html"')
js=js.replace('<div class="package-price">Price on Request</div>','<div class="package-price">Personalised quote available</div>')
js=js.replace('class="card-image" src="${esc(x.image)}" alt="${esc(x.name)}"','class="card-image" src="${esc(x.image)}" data-destination="${esc(x.destination)}" alt="${esc(x.destination)} scenery for ${esc(x.name)}"')
js=js.replace('<img class="detail-photo" src="${esc(x.image)}" alt="${esc(x.name)}">','<div class="destination-photo-wrap"><img class="detail-photo" src="${esc(x.image)}" data-destination="${esc(x.destination)}" alt="${esc(x.destination)} scenery for ${esc(x.name)}"></div>')
(assets/'packages.js').write_text(js)
# add admin link in footer only (not primary)
for file in ['packages.html','index.html']:
 path=root/file;s=path.read_text();s=s.replace('Prices and availability are confirmed manually before booking.','Prices and availability are confirmed manually before booking.');path.write_text(s)
# metadata, sitemap
sitemap=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for f in sorted(root.glob('*.html')):
 if f.name in ['404.html','admin.html','package.html']:continue
 sitemap.append(f'<url><loc>https://modiholidays.in/{f.name}</loc></url>')
for p in data:
 if p.get('published',True):sitemap.append(f'<url><loc>https://modiholidays.in/tours/{p["slug"]}.html</loc></url>')
sitemap.append('</urlset>');(root/'sitemap.xml').write_text('\n'.join(sitemap))
# enhance package listing metadata
p=root/'packages.html';s=p.read_text().replace('Explore customised domestic holidays across India with Modi Holidays. Request an itinerary and manually confirmed quote.','Browse domestic and international holiday packages with detailed day-wise itineraries. Explore Kashmir, Kerala, Himachal, Bhutan and more. Request a customised quote.')
s=s.replace('</head>','<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@type':'CollectionPage','name':'Holiday packages | Modi Holidays','url':'https://modiholidays.in/packages.html','description':'Explore custom domestic and international holiday packages and day-wise itineraries.'})+'</script>\n</head>');p.write_text(s)
# change outdated canonical on package.html
p=root/'package.html';s=p.read_text().replace('https://modiholidays.in/domestic-holidays.html','https://modiholidays.in/packages.html');p.write_text(s)
print('built',len(list(tours.glob('*.html'))),'tour pages')

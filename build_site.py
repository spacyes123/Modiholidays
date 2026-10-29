"""Deterministic static GitHub Pages build. Never edits the source catalogue."""
import json, re, html
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / 'assets/packages.json').read_text(encoding='utf-8'))
PHOTOS = json.loads((ROOT / 'assets/image-manifest.json').read_text(encoding='utf-8'))
LIVE = [p for p in DATA if p.get('published', True)]
E = html.escape
DOMAIN = 'https://modiholidays.in/'
SETTINGS = json.loads((ROOT/'assets/site-settings.json').read_text(encoding='utf-8'))

def brand_image(prefix='', footer=False):
    size=192 if footer else 128
    cls='footer-brand' if footer else 'brand-artwork'
    return (f'<img class="{cls}" src="{prefix}assets/brand/logo-256.png" '
            f'srcset="{prefix}assets/brand/logo-256.png 256w, {prefix}assets/brand/logo-512.png 512w" '
            f'sizes="{size}px" alt="Modi Holidays" width="{size}" height="{size}" decoding="async">')

def write(path, text):
    path.write_text(text, encoding='utf-8')

def photo(p, prefix='', hero=False):
    m = PHOTOS.get(p['id'])
    if not m:
        return f'<p class="note">Destination photograph awaiting verification: {E(p["destination"])}</p>'
    return (f'<figure class="destination-photo-wrap" data-package-photo="{p["id"]}"><img class="{"detail-photo" if hero else "card-image"}" '
            f'src="{prefix}{E(m["image"])}" srcset="{prefix}{E(m["small"])} 640w, {prefix}{E(m["image"])} 1280w" '
            f'sizes="{"(max-width: 760px) 100vw, 850px" if hero else "(max-width: 760px) 100vw, (max-width: 1050px) 50vw, 440px"}" '
            f'width="1280" height="850" alt="{E(m["alt"], quote=True)}" '
            f'{"fetchpriority=high" if hero else "loading=lazy"} decoding="async">'
            f'<figcaption class="photo-credit"><a href="{E(m["source"])}" target="_blank" rel="noopener noreferrer">'
            f'{E(m["author"] or "Wikimedia Commons contributor")} · {E(m["license"])}</a> '
            f'· <a href="{E(m["licenseUrl"])}">License</a> · Resized / cropped</figcaption></figure>')

def card(p, prefix=''):
    return (f'<article class="card" data-category="{E(p["category"])}" data-destination="{E(p["destination"])}" '
            f'data-search="{E(" ".join([p["name"],p["destination"],p["summary"],*p["route"]]).lower(), quote=True)}">'
            + photo(p,prefix) + f'<div class="card-body"><div class="card-meta">{E(p["category"])} · {E(p["duration"])}</div>'
            f'<h3>{E(p["name"])}</h3><p>{E(" • ".join(p["route"]))}</p><a class="card-link" '
            f'href="{prefix}tours/{E(p["slug"])}.html">View itinerary <span aria-hidden="true">↗</span></a></div></article>')

def navigation(prefix=''):
    def link(file,label): return f'<a href="{prefix}{file}">{label}</a>'
    items=link('index.html','Home')
    for category, file in [('Domestic','domestic-holidays.html'),('International','international-holidays.html')]:
        dests=sorted({p['destination'] for p in LIVE if p['category']==category})
        options=''.join(link(file+'?'+E(urlencode({'destination':d})),E(d)) for d in dests)
        items+=f'<div class="nav-dropdown">{link(file,category)}<button class="destination-toggle" type="button" aria-expanded="false" aria-controls="{category.lower()}-menu" aria-label="Show {category.lower()} destinations">⌄</button><div class="nav-dropdown-menu" id="{category.lower()}-menu">{options}</div></div>'
    items+= ''.join(link(f,l) for f,l in [('packages.html','All Packages'),('group-tours.html','Group Tours'),('pilgrimage-tours.html','Pilgrimage'),('about.html','About Us'),('contact.html','Contact')])
    items+=f'<a class="nav-cta" href="{prefix}plan-my-holiday.html">Get a Quote</a>'
    return f'<header class="site-header"><div class="container header-inner"><a class="brand" href="{prefix}index.html" aria-label="Modi Holidays home">{brand_image(prefix)}</a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Open navigation menu">☰ Menu</button><nav class="nav" id="primary-nav" aria-label="Primary navigation">{items}</nav></div></header>'

HOME = (ROOT/'index.html').read_text(encoding='utf-8')
FOOTER = re.search(r'<footer.*?</footer>',HOME,re.S)[0]
FOOTER = re.sub(r'href="mailto:hello@modiholidays.in"', '', FOOTER)
def footer(prefix=''):
    return re.sub(r'(href|src)="(?!https?:|mailto:|#)([^"]+)"',lambda m:f'{m[1]}="{prefix}{m[2]}"',FOOTER)

def metadata(text, file):
    prefix='../' if file.startswith('tours/') else ''
    # Only logo-related metadata changes; catalogue titles, descriptions and canonicals remain intact.
    text=re.sub(r'<link[^>]*rel="(?:icon|apple-touch-icon|manifest)"[^>]*>','',text)
    text=re.sub(r'<meta name="theme-color"[^>]*>','',text)
    text=re.sub(r'<img[^>]*class="footer-brand"[^>]*>',lambda _:brand_image(prefix,True),text)
    brand_head=f'<meta name="theme-color" content="#55234B"><link rel="icon" type="image/png" sizes="32x32" href="{prefix}assets/brand/icon-32.png"><link rel="icon" type="image/png" sizes="48x48" href="{prefix}assets/brand/icon-48.png"><link rel="apple-touch-icon" sizes="180x180" href="{prefix}assets/brand/icon-180.png"><link rel="manifest" href="{prefix}assets/brand/site.webmanifest">'
    text=text.replace('</head>',brand_head+'</head>')
    text=re.sub(r'<link rel="stylesheet" href="(?:\.\./)?assets/brand.css">','',text)
    if 'assets/launch.css' not in text:
        prefix='../' if file.startswith('tours/') else ''
        text=text.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/launch.css"></head>')
    seen=set()
    def dedupe(m):
        key=m[0]
        if key in seen:return ''
        seen.add(key);return key
    text=re.sub(r'<script type="application/ld\+json">.*?</script>',dedupe,text,flags=re.S)
    text=re.sub(r'<meta (?:property="og:[^"]+"|name="twitter:[^"]+")[^>]*>','',text)
    title=re.search(r'<title>(.*?)</title>',text,re.S)
    desc=re.search(r'<meta name="description" content="([^"]*)"',text)
    extra=f'<meta property="og:type" content="website"><meta property="og:url" content="{DOMAIN}{file}"><meta property="og:site_name" content="Modi Holidays"><meta name="twitter:card" content="summary_large_image">'
    if title:extra+=f'<meta property="og:title" content="{title[1]}">'
    if desc:extra+=f'<meta property="og:description" content="{desc[1]}">'
    selected=next((p for p in LIVE if file=='tours/'+p['slug']+'.html'),None)
    image=PHOTOS.get(selected['id'],{}).get('image') if selected else 'assets/brand/social-sharing.png'
    if image:extra+=f'<meta property="og:image" content="{DOMAIN}{image}">'
    return text.replace('</head>',f'<link rel="stylesheet" href="{prefix}assets/brand.css">'+extra+'</head>')

for path in ROOT.glob('*.html'):
    text=path.read_text(encoding='utf-8')
    if '<header' in text:text=re.sub(r'<header.*?</header>',navigation(),text,count=1,flags=re.S)
    else:text=text.replace('<body>','<body>'+navigation())
    if path.name=='admin.html':
        for tag in ['<meta name="robots" content="noindex,nofollow">','<meta name="description" content="Local package editor for Modi Holidays maintainers. Changes require a GitHub commit.">','<link rel="canonical" href="https://modiholidays.in/admin.html">']:
            key='name="'+('robots' if 'robots' in tag else 'description')+'"' if '<meta' in tag else 'rel="canonical"'
            if key not in text:text=text.replace('</head>',tag+'</head>')
    text=re.sub(r'<script[^>]*src="assets/(?:destination-photos|domestic-catalogue|packages)\.js"[^>]*></script>','',text)
    text=text.replace('+91 XXXXX XXXXX','Phone setup pending').replace('>hello@modiholidays.in<','>Email setup pending<')
    text=text.replace('href="mailto:hello@modiholidays.in"','')
    for script in ['config.js','main.js']:
        if f'src="assets/{script}"' not in text:text=text.replace('</body>',f'<script src="assets/{script}"></script></body>')
    if path.name=='admin.html':text=text.replace('name="image" type="url"','name="image" type="text"')
    text=text.replace('Browse 12 suggested journeys','Browse 140 suggested journeys')
    # Replace the remaining prototype stock photos and illustrations with attributed local assets.
    if path.name in ['index.html','about.html','group-tours.html']:
        def refresh_figure(match):
            id_match=re.search(r'data-package-photo="(MH-\d+)"',match[0]) or re.search(r'photos/(mh-\d+)',match[0])
            p=next((p for p in LIVE if id_match and p['id']==id_match[1].upper()),None)
            return photo(p) if p else ''
        text=re.sub(r'<figure class="destination-photo-wrap".*?</figure>',refresh_figure,text,flags=re.S)
        hero=PHOTOS.get(SETTINGS['homeHeroPackageId'])
        if hero:
            replacement=f'<img class="hero-image" src="{E(hero["image"])}" alt="{E(hero["alt"])}" fetchpriority="high" width="1280" height="850"><p class="photo-credit"><a href="{E(hero["source"])}">{E(hero["author"])} · {E(hero["license"])}</a> · Resized / cropped</p>'
            text=re.sub(r'<img class="hero-image"[^>]*>(?:<p class="photo-credit">.*?</p>)?',lambda _:replacement,text,flags=re.S)
        mapping={'Domestic holidays':'MH-001','International holidays':'MH-126','Group & pilgrimage tours':'MH-010','Travellers enjoying a scenic outdoor holiday':'MH-003','Travellers spending time together outdoors':'MH-003','Private family groups':'MH-001',"Friends’ group tours":'MH-042',"Friends\' group tours":'MH-042','Group itinerary planning':'MH-008','Kerala':'MH-003','Himachal Pradesh':'MH-002','Singapore':'MH-109'}
        def migrate_image(match):
            tag=match[0]
            if 'assets/logo.svg' in tag:return tag
            if 'hero-image' in tag:
                m=PHOTOS.get(SETTINGS['homeHeroPackageId'])
                if not m:return tag
                return f'<img class="hero-image" src="{E(m["image"])}" alt="{E(m["alt"])}" fetchpriority="high" width="1280" height="850"><p class="photo-credit"><a href="{E(m["source"])}">{E(m["author"])} · {E(m["license"])}</a> · Resized / cropped</p>'
            alt=re.search(r'alt="([^"]*)"',tag)
            id=mapping.get(html.unescape(alt[1]) if alt else '', 'MH-003')
            p=next((p for p in LIVE if p['id']==id),None)
            return photo(p) if p else tag
        # Migrate once; subsequent builds refresh the generated featured section below.
        text=re.sub(r'<img[^>]*(?:images.unsplash.com|assets/destinations/)[^>]*>',migrate_image,text)
        if path.name=='index.html':
            featured=[p for id in SETTINGS['featuredPackageIds'] for p in LIVE if p['id']==id]
            section='<section class="section section-soft" id="featured-journeys"><div class="container"><p class="kicker">A little inspiration</p><h2>Journeys worth making time for</h2><p>Start with an itinerary. Make the details your own.</p><div class="grid grid-3">'+''.join(card(p) for p in featured)+'</div><p class="mt-2"><a class="btn btn-outline-dark" href="packages.html">Explore all 140 journeys ↗</a></p></div></section>'
            if 'id="featured-journeys"' in text:text=re.sub(r'<section[^>]*id="featured-journeys".*?</section>',lambda _:section,text,flags=re.S)
            else:text=re.sub(r'<section[^>]*>(?:(?!</section>).)*A little inspiration.*?</section>',lambda _:section,text,flags=re.S|re.I)
    if path.name=='package.html':
        text=text.replace('</body>','<script defer src="assets/package-redirect.js"></script></body>') if 'package-redirect.js' not in text else text
    if path.name in ['packages.html','domestic-holidays.html','international-holidays.html','pilgrimage-tours.html']:
        categories={'domestic-holidays.html':['Domestic','Pilgrimage'],'international-holidays.html':['International'],'pilgrimage-tours.html':['Pilgrimage']}.get(path.name,['Domestic','Pilgrimage','International'])
        packages=[p for p in LIVE if p['category'] in categories]
        label={'packages.html':'All holiday packages','domestic-holidays.html':'Domestic holidays & pilgrimages','international-holidays.html':'International holidays','pilgrimage-tours.html':'Pilgrimage journeys'}[path.name]
        options=''.join(f'<option value="{E(c)}">{E(c)}</option>' for c in categories)
        dests=''.join(f'<option>{E(d)}</option>' for d in sorted({p['destination'] for p in packages}))
        content=f'<main id="main"><section class="page-hero"><div class="container"><div class="breadcrumb"><a href="index.html">Home</a> / {label}</div><p class="kicker">Made for your kind of journey</p><h1>{label}</h1><p>Discover routes worth travelling. Choose a destination, explore a day-by-day itinerary and ask us to tailor the details to you.</p></div></section><section class="section"><div class="container"><div class="catalogue-heading"><h2>Find your next escape</h2><p id="catalogue-count" role="status">Showing {len(packages)} of {len(packages)} tours</p></div><div class="domestic-filter-bar"><label>Search tours<input id="catalogue-search" type="search" placeholder="Destination, package or city"></label><label>Destination<select id="catalogue-destination"><option value="">All destinations</option>{dests}</select></label><label>Tour type<select id="catalogue-category"><option value="">All {"categories" if len(categories)==3 else "tours"}</option>{options}</select></label></div><button class="btn btn-outline-dark" id="catalogue-reset" type="button">Reset filters</button><p id="catalogue-empty" hidden>No matching tours. Try another destination or reset your filters.</p><div class="grid grid-3 catalogue-grid" id="catalogue-list">'+''.join(card(p) for p in packages)+'</div><p class="note mt-2">All itineraries are planning suggestions. Prices, accommodation, activities and availability require a written quotation. No departure is guaranteed.</p></div></section></main>'
        text=re.sub(r'<main.*?</main>',lambda _:content,text,count=1,flags=re.S)
        text=re.sub(r'<script[^>]*src="assets/catalogue.js"[^>]*></script>','',text)
        text=text.replace('</body>','<script defer src="assets/catalogue.js"></script></body>')
    write(path,metadata(text,path.name))

for p in LIVE:
    canonical=DOMAIN+'tours/'+p['slug']+'.html'
    faqs=p.get('faq',[])
    ld={'@context':'https://schema.org','@graph':[{'@type':'TouristTrip','name':p['name'],'description':p['summary'],'url':canonical,'provider':{'@type':'TravelAgency','name':'Modi Holidays','url':DOMAIN},'itinerary':{'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'name':f'Day {i+1}','description':d} for i,d in enumerate(p['days'])]}},{'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':DOMAIN},{'@type':'ListItem','position':2,'name':'Packages','item':DOMAIN+'packages.html'},{'@type':'ListItem','position':3,'name':p['name'],'item':canonical}]}]}
    if faqs:ld['@graph'].append({'@type':'FAQPage','mainEntity':[{'@type':'Question','name':f['question'],'acceptedAnswer':{'@type':'Answer','text':f['answer']}} for f in faqs]})
    related=[x for x in LIVE if x['id']!=p['id'] and x['destination']==p['destination']][:3]
    if not related:related=[x for x in LIVE if x['id']!=p['id'] and x['category']==p['category']][:3]
    days=''.join(f'<section class="itinerary-day"><h3>Day {i+1}</h3><p>{E(d)}</p></section>' for i,d in enumerate(p['days']))
    faq=''.join(f'<details><summary>{E(f["question"])}</summary><p>{E(f["answer"])}</p></details>' for f in faqs)
    quote_url='../plan-my-holiday.html?'+E(urlencode({'destination':p['name']}))
    terms=''.join(f'<h2>{label}</h2><ul>'+''.join(f'<li>{E(v)}</li>' for v in p[field])+'</ul>' for label,field in [('Verified inclusions','inclusions'),('Verified exclusions','exclusions')] if p.get(field+'Verified') is True)
    page=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{E(p['name'])} | {E(p['duration'])} | Modi Holidays</title><meta name="description" content="{E(p['summary'])}. Explore {E(', '.join(p['route']))} on this {E(p['duration'])} suggested itinerary. Request a personalised quote."><link rel="canonical" href="{canonical}"><link rel="icon" href="../assets/logo.svg"><link rel="stylesheet" href="../assets/styles.css"><script type="application/ld+json">{json.dumps(ld,ensure_ascii=False).replace('<',chr(92)+'u003c')}</script></head><body><a class="skip-link" href="#main">Skip to content</a>{navigation('../')}<main id="main"><section class="page-hero"><div class="container"><div class="breadcrumb"><a href="../index.html">Home</a> / <a href="../packages.html">Packages</a> / {E(p['name'])}</div><p class="kicker">{E(p['category'])} · {E(p['destination'])} · {E(p['duration'])}</p><h1>{E(p['name'])}</h1><p>{E(p['summary'])}</p></div></section><section class="section"><div class="container package-detail-layout"><article>{photo(p,'../',True)}<h2>Places covered</h2><p>{E(' → '.join(p['route']))}</p><h2>Your day-by-day journey</h2><p class="muted">Suggested itinerary. Attractions, travel times and arrangements are subject to your written quote and local conditions.</p><div class="itinerary">{days}</div>{terms}<h2>Before you travel</h2><p>Accommodation, meals, transport, tickets, permits, inclusions and exclusions are confirmed only in your written quotation. Share accessibility needs, children's ages and your preferred pace when enquiring. Activities depend on weather, local access and availability.</p><h2>Frequently asked questions</h2>{faq}</article><aside class="package-aside"><div class="card-body"><p class="kicker">{E(p['duration'])}</p><h2>Make it your journey</h2><p>Share your dates, departure city and traveller details. We will prepare a personalised proposal.</p><a class="btn btn-primary" href="{quote_url}">Request a quote ↗</a><p><a class="btn btn-outline-dark" href="{quote_url}" data-whatsapp data-message="{E('Hello Modi Holidays, I am interested in '+p['name']+' ('+p['id']+'), '+p['duration']+'. Please help me plan dates, travellers and a quotation.',quote=True)}">Enquire on WhatsApp</a></p><p class="form-help" data-contact-status></p><p>No online payment. No booking is confirmed until agreed in writing.</p></div></aside></div></section><section class="section section-soft"><div class="container"><p class="kicker">More journeys to consider</p><h2>Related packages</h2><div class="grid grid-3">{''.join(card(x,'../') for x in related)}</div></div></section></main>{footer('../')}<script src="../assets/config.js"></script><script src="../assets/main.js"></script></body></html>'''
    write(ROOT/'tours'/f'{p["slug"]}.html',metadata(page,'tours/'+p['slug']+'.html'))

expected={p['slug']+'.html' for p in LIVE}
for path in (ROOT/'tours').glob('*.html'):
    if path.name not in expected:path.unlink()
urls=[p.name for p in ROOT.glob('*.html') if p.name not in ['admin.html','404.html','package.html']]+['tours/'+p['slug']+'.html' for p in LIVE]
write(ROOT/'sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'<url><loc>{DOMAIN}{E(u)}</loc></url>\n' for u in sorted(urls))+'</urlset>\n')
print(f'Built {len(LIVE)} tour pages and four complete static catalogues; source records unchanged.')

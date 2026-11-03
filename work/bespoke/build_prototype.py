"""Build only the review prototype. Never writes existing public or admin files."""
from pathlib import Path
import re, base64, hashlib, json, html
from urllib.parse import urlencode
ROOT = Path(__file__).resolve().parents[2]
s = (ROOT/'work/bespoke/reference.html').read_text(encoding='utf-8-sig')
assets = ROOT/'assets/bespoke'
def extract(m):
    data=base64.b64decode(m[2]); name=hashlib.sha256(data).hexdigest()[:16]+'.'+m[1]
    (assets/name).write_bytes(data)
    return 'assets/bespoke/'+name
s=re.sub(r'data:image/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)',extract,s)
s=s.replace('2015','2009').replace('--paper:#fffdf8','--paper:#fefdf8')
s=re.sub(r'Since 2009, Subhash Modi.*?personal care\.', 'With a brand story beginning in 2009, Modi Holidays brings personal care to journeys across India and beyond. From family holidays and journeys for two to private groups and pilgrimages, we plan around your interests, pace and preferences.',s)
s=s.replace('<strong>5,000+</strong><small>TRAVELERS WELCOMED</small>','<strong>Personal</strong><small>JOURNEY PLANNING</small>')
s=s.replace('Solo, social<br>& sacred','Solo &amp;<br>Social')
s=s.replace('The world,<br><em>exceptionally</em><br>yours.','The World,<br><em>Exceptionally</em><br>Yours.')
logo='<img class="approved-logo" src="assets/brand/approved/modi-holidays-logo-dark-background.png" alt="Modi Holidays — Curated journeys since 2009">'
s=re.sub(r'<span class="wordmark">.*?</small>',logo,s,count=1)
s=s.replace('<div class="eyebrow" style="color:#cbb18b">MODI HOLIDAYS</div>',logo)
packages=json.loads((ROOT/'assets/packages.json').read_text(encoding='utf-8'))
E=html.escape
nav=''
for category, file in [('Domestic','domestic-holidays.html'),('International','international-holidays.html')]:
    destinations=sorted({p['destination'] for p in packages if p['category']==category or category=='Domestic' and p['category']=='Pilgrimage'})
    links=''.join(f'<a href="{file}?{E(urlencode({"destination":d}))}">{E(d)}</a>' for d in destinations)
    nav+=f'<details class="destinations"><summary>{category}</summary><div><a href="{file}">All {category} holidays</a>{links}</div></details>'
nav+='<a href="group-tours.html">Group Tours</a><a href="about.html">About Us</a><a href="contact.html">Contact</a><a class="nav-cta" href="plan-my-holiday.html">Get a Quote</a>'
s=re.sub(r'<nav class="nav".*?</nav>',f'<nav class="nav" aria-label="Main navigation">{nav}</nav>',s)
s=re.sub(r'<div class="overlay".*?</div>\s*<div class="modal"', '<div class="overlay" id="menu" role="dialog" aria-modal="true" aria-label="Mobile navigation" tabindex="-1"><button class="close" onclick="toggleMenu(false)" aria-label="Close menu">×</button><nav>'+nav+'</nav></div>\n<div class="modal"',s,flags=re.S)
s=s.replace('href="#home"','href="index.html"')
s=s.replace('MEET YOUR TRAVEL CONCIERGE ↗','OUR STORY ↗').replace('href="#contact" style="align-self','href="about.html" style="align-self')
s=s.replace('<a class="gate" href="#contact">','<a class="gate" href="international-holidays.html">',1)
s=s.replace('<a class="gate" href="#contact">','<a class="gate" href="domestic-holidays.html">',1)
styles=iter(['Family escape','Journey for two','Adventure','Private group','Solo journey'])
s=re.sub(r'<a href="#contact" class="travel-card">',lambda m:'<a href="plan-my-holiday.html?'+E(urlencode({'destination':next(styles)}))+'" class="travel-card">',s)
trust='<section class="trust" aria-label="Why travel with Modi Holidays">'
for symbol,title,copy in [('◇','Since 2009','Our brand story began'),('♡','Personal Planning','Journeys shaped around you'),('◎','Domestic & International','Discover India and beyond'),('✿','All Age Groups','Families, couples, seniors & more')]:
    trust+=f'<div><span aria-hidden="true">{symbol}</span><h2>{title}</h2><p>{copy}</p></div>'
trust+='</section>'
# Put travel styles immediately after the trust strip, as in the approved screenshot.
style=re.search(r'<section class="section" id="styles".*?</section>',s,re.S)[0]
s=s.replace(style,'')
s=s.replace('<section class="section" id="worlds">',trust+style+'<section class="section" id="worlds">')
story=re.search(r'<section class="story".*?</section>',s,re.S)[0]
s=s.replace(story,'').replace('<section class="section" id="worlds">',story+'<section class="section" id="worlds">')
s=s.replace('<div class="eyebrow" style="color:#8c5a60">DESIGNED AROUND YOU</div><h2>Not just where.<br><em class="serif">But how you travel.</em></h2>','<div class="eyebrow">JOURNEYS FOR EVERY TRAVELER</div>')
s=s.replace('<p class="sub">A family gathering, a journey for two, an expedition or an adventure of your own. Every traveler has a different story.</p>','')
search='<section class="holiday-search" id="holiday-search"><h2>Where will your next story begin?</h2><form action="packages.html"><label for="holiday-destination">Choose a destination</label><select id="holiday-destination" name="destination"><option value="">All destinations</option>'
search+=''.join(f'<option>{E(d)}</option>' for d in sorted({p['destination'] for p in packages}))
search+='</select><button class="btn btn-dark">Find holidays ↗</button></form></section>'
s=s.replace('<section class="section" id="worlds">',search+'<section class="section" id="worlds">')
manifest=json.loads((ROOT/'assets/image-manifest.json').read_text(encoding='utf-8'))
cards=''
for p in [packages[0],next(p for p in packages if p['destination']=='Rajasthan'),next(p for p in packages if p['category']=='International')]:
    im=manifest[p['id']]
    cards+=f'<article><a href="tours/{E(p["slug"])}.html"><img loading="lazy" src="{E(im["image"])}" alt="{E(im["alt"])}"><p class="eyebrow">{E(p["duration"])}</p><h3>{E(p["name"])}</h3><p>Explore itinerary ↗</p></a><small><a href="{E(im["source"])}">{E(im["author"] or "Wikimedia contributor")}</a> · <a href="{E(im["licenseUrl"])}">{E(im["license"])}</a></small></article>'
s=s.replace('<section class="quote"','<section class="section featured"><div class="eyebrow">A LITTLE INSPIRATION</div><h2>Find your kind of extraordinary.</h2><div class="featured-grid">'+cards+'</div></section><section class="quote"')
s=s.replace('Private journeys across India and the world.</p>','Private journeys across India and the world.</p><p><a href="tel:+917666018401">+91 76660 18401</a><br><a href="mailto:modiholidays15@gmail.com">modiholidays15@gmail.com</a></p>')
s=s.replace('COPY MY JOURNEY ENQUIRY ↗','PREPARE WHATSAPP ENQUIRY ↗')
s=s.replace('You can paste the copied message into your preferred email or messaging app.','Nothing is sent until you choose to send it in WhatsApp.')
s=s.replace('</form></div></div>','<a id="send-enquiry" class="btn" hidden target="_blank" rel="noopener">Open WhatsApp ↗</a><label for="message-copy">Enquiry message — copy manually if needed</label><textarea id="message-copy" readonly hidden></textarea></form></div></div>')
s=re.sub(r'<script>.*?</script>', '<script src="assets/bespoke/prototype.js"></script>',s,flags=re.S)
s=s.replace('</head>','<meta name="robots" content="noindex,nofollow"><link rel="canonical" href="https://modiholidays.in/"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="assets/bespoke/prototype.css?v=licensed-hero"></head>')
s=s.replace('</body>','<div class="mobile-contact"><a href="tel:+917666018401">Call us</a><a href="https://wa.me/917666018401?text=Hello%20Modi%20Holidays%2C%20please%20help%20me%20plan%20a%20holiday.">WhatsApp</a><button onclick="openEnquiry()">Enquire ↗</button></div></body>')
s=s.replace('<body>','<body><a class="skip-link" href="#home">Skip to content</a>')
s=s.replace('<nav class="nav"','<nav id="primary-nav" class="nav"')
s=s.replace('</head>','<meta property="og:title" content="Modi Holidays — The World, Exceptionally Yours"><meta property="og:description" content="Personalised holidays across India and the world. A brand story beginning in 2009."><meta property="og:url" content="https://modiholidays.in/"></head>')
s=s.replace('<img src=','<img loading="lazy" src=')
icons={
 'Call us': '<path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4c0 2-2 3-4 2C9 19 5 15 3 7c-1-2 0-4 2-4Z"/>',
 'WhatsApp': '<path d="M21 11a9 9 0 0 1-13 8l-5 2 2-5A9 9 0 1 1 21 11Z"/><path d="M8 7c0 5 3 8 8 8l1-2-3-1-1 1-2-2 1-1-1-3Z"/>',
 'Enquire ↗': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>'}
for label,path in icons.items():
    icon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>'
    s=s.replace('>'+label+'</', '>'+icon+'<span>'+label.replace(' us','').replace(' ↗','')+'</span></')
# Catalogue-backed prototype refinements. Source catalogue remains read-only.
live=[p for p in packages if p.get('published',True)]
search_controls='<label for="holiday-category">Holiday type</label><select id="holiday-category"><option value="">All holidays</option><option>Domestic</option><option>International</option></select><label for="holiday-duration">Duration</label><select id="holiday-duration"><option value="">Any duration</option>'
search_controls+=''.join(f'<option value="{d}">{d} days</option>' for d in sorted({int(re.search(r"\d+",p['duration'])[0]) for p in live}))+'</select>'
s=s.replace('<form action="packages.html">','<form id="catalogue-search" action="packages.html">'+search_controls)
s=s.replace('<button class="btn btn-dark">Find holidays ↗</button></form></section>','<button class="btn btn-dark">Find holidays ↗</button></form><p id="search-status" role="status"></p><div id="search-results" class="featured-grid"></div><noscript><p>Use destination search above or <a href="packages.html">browse all holidays</a>. Type and duration filtering requires JavaScript.</p></noscript></section>')
rows=[{k:p[k] for k in ['id','name','category','destination','duration','slug']} for p in live]
s=s.replace('</head>','<script id="catalogue-data" type="application/json">'+json.dumps(rows,ensure_ascii=False).replace('<','\\u003c')+'</script></head>')
s=s.replace('<label for="kind">','<label for="customer-name">Your name</label><input id="customer-name" name="name" autocomplete="name" maxlength="100" required><label for="travellers">Number of travellers</label><input id="travellers" name="travellers" type="number" min="1" max="100" step="1" value="2" required><label for="kind">')
s=s.replace('PREPARE WHATSAPP ENQUIRY ↗','Continue to WhatsApp').replace('Open WhatsApp ↗','Continue to WhatsApp ↗')
s=s.replace('<textarea id="message-copy" readonly hidden></textarea>','<textarea id="message-copy" readonly hidden></textarea><button type="button" id="copy-enquiry" hidden>Copy message</button>')
# Replace text-baked reference card images with documented catalogue photography.
card_ids=iter(['MH-001','MH-004','MH-011','MH-002','MH-003'])
def clean_card(match):
    key=next(card_ids); im=manifest[key]
    card=re.sub(r'<img[^>]+>',f'<img loading="lazy" src="{E(im["image"])}" alt="{E(im["alt"],quote=True)}">',match[0],count=1)
    return '<div class="travel-item">'+card+f'<small class="image-credit"><a href="{E(im["source"])}">{E(im["author"] or "Contributor")}</a> · <a href="{E(im["licenseUrl"])}">{E(im["license"])}</a> · resized/cropped</small></div>'
s=re.sub(r'<a [^>]*class="travel-card">.*?</a>',clean_card,s,flags=re.S)
s=s.replace('</small></article>',' · resized / cropped</small></article>')
# Remove the remaining text-baked/uncleared inline imagery; keep the approved hero background unchanged.
replacement_ids=iter(['MH-004','MH-011','MH-004','MH-003'])
def replace_reference_image(match):
    im=manifest[next(replacement_ids)]
    return f'<img loading="lazy" src="{E(im["image"])}" alt="{E(im["alt"],quote=True)}">'
s=re.sub(r'<img[^>]+src="assets/bespoke/[^"]+"[^>]*>',replace_reference_image,s)
credits='<details class="photo-credits"><summary>Photograph credits</summary>'
for key in ['MH-001','MH-004','MH-011','MH-002','MH-003']:
    im=manifest[key]
    credits+=f'<p><a href="{E(im["source"])}">{E(im["alt"])} — {E(im["author"])}</a> · <a href="{E(im["licenseUrl"])}">{E(im["license"])}</a> · resized / converted to WebP / cropped for display.</p>'
s=s.replace('</footer>',credits+'</details></footer>')
# Inclusive positioning: preserve metadata while updating visible public copy.
head,body=s.split('</head>',1)
for old,new in {
 'Private journeys · Personal concierge · Since 2009':'Domestic · International · Group Tours · Since 2009',
 'Mumbai-based bespoke travel concierge.':'Mumbai-based premium holiday planning.',
 'Private journeys across India and the world.':'Domestic, international and group holidays.',
 'privately discovered.':'thoughtfully discovered.',
 'BEGIN A PRIVATE CONVERSATION':'LET’S PLAN YOUR HOLIDAY',
 'YOUR PRIVATE JOURNEY':'YOUR NEXT HOLIDAY',
}.items():body=body.replace(old,new)
s=head+'</head>'+body
s=re.sub(r"url\('assets/bespoke/[^']+'\)","url('assets/photos/mh-003.webp')",s)
(ROOT/'homepage-prototype.html').write_text(s,encoding='utf-8')
print('Built homepage-prototype.html; extracted',len(list(assets.glob('*.webp'))),'unique photographs. Existing pages untouched.')




"""Zero-dependency catalogue, generated-page, SEO, local-link and image checks."""
import json, re, sys
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from collections import Counter
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
errors=[]
def check(condition,message):
    if not condition:errors.append(message)
data=json.loads((ROOT/'assets/packages.json').read_text(encoding='utf-8'))
photos=json.loads((ROOT/'assets/image-manifest.json').read_text(encoding='utf-8'))
check(len(data)==140,'Catalogue must contain 140 records')
check(len({p['id'] for p in data})==140,'IDs must be unique')
check(len({p['slug'] for p in data})==140,'Slugs must be unique')
check(Counter(p['category'] for p in data)=={'Domestic':88,'Pilgrimage':9,'International':43},'Category totals changed')
check(len(photos)==140,'Image manifest must cover all 140 packages')
check(len({p['source'] for p in photos.values()})==len(photos),'Duplicate photograph source')
for p in data:
    target=ROOT/'tours'/(p['slug']+'.html')
    if p.get('published',True):check(target.exists(),f'Missing tour: {p["id"]}')
    else:check(not target.exists(),f'Unpublished tour remains: {p["id"]}')
    check(len(p['days'])==int(re.search(r'\d+',p['duration'])[0]),f'Duration/day count mismatch: {p["id"]}')
    if target.exists():
        text=target.read_text(encoding='utf-8')
        from html import unescape
        check(all(day in unescape(text) for day in p['days']),f'Itinerary changed: {p["id"]}')
    m=photos.get(p['id'],{})
    check(bool(m.get('source') and m.get('license') and m.get('author')),f'Missing attribution: {p["id"]}')
    for field in ['image','small']:
        file=ROOT/m.get(field,'missing')
        check(file.is_file() and file.suffix=='.webp',f'Missing WebP {field}: {p["id"]}')
        if file.is_file():check(file.stat().st_size<650000,f'Oversized photo: {file.name}')

class Page(HTMLParser):
    def __init__(self):super().__init__();self.links=[];self.ids=[];self.scripts=[];self.ld=False;self.metadata={};self.canonical=[];self.cards=0;self.nav=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='nav' and a.get('id')=='primary-nav':self.nav+=1
        if 'data-category' in a:self.cards+=1
        for key in ['href','src']:
            if key in a:self.links.append(a[key])
        if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href'))
        if tag=='meta':self.metadata[a.get('name',a.get('property'))]=a.get('content')
        if tag=='script' and a.get('type')=='application/ld+json':self.ld=True
    def handle_endtag(self,tag):
        if tag=='script':self.ld=False
    def handle_data(self,text):
        if self.ld:
            try:self.scripts.append(json.loads(text))
            except Exception:errors.append('Invalid JSON-LD')

files=list(ROOT.glob('*.html'))+list((ROOT/'tours').glob('*.html'))
for file in files:
    text=file.read_text(encoding='utf-8');page=Page();page.feed(text)
    check(len(page.ids)==len(set(page.ids)),f'Duplicate HTML IDs: {file.name}')
    check(page.nav==1,f'Missing shared navigation: {file.name}')
    check(len(page.canonical)==1,f'Canonical count invalid: {file.name}')
    check(bool(page.metadata.get('description')),f'Missing description: {file.name}')
    check(bool(page.metadata.get('og:title')),f'Missing social metadata: {file.name}')
    for link in page.links:
        url=urlsplit(link)
        if url.scheme or url.netloc:continue
        if url.fragment:
            anchor_file=(file.parent/unquote(url.path)).resolve() if url.path else file
            if anchor_file.is_file() and anchor_file.suffix=='.html':
                anchor_page=Page();anchor_page.feed(anchor_file.read_text(encoding='utf-8'))
                check(unquote(url.fragment) in anchor_page.ids,f'Broken local fragment {file.name}: {link}')
        if not url.path:continue
        target=(file.parent/unquote(url.path)).resolve()
        check(target.is_relative_to(ROOT) and target.is_file(),f'Broken local link {file.name}: {link}')
    live=[p for p in data if p.get('published',True)]
    expected={'packages.html':len(live),'domestic-holidays.html':sum(p['category'] in ['Domestic','Pilgrimage'] for p in live),'international-holidays.html':sum(p['category']=='International' for p in live),'pilgrimage-tours.html':sum(p['category']=='Pilgrimage' for p in live)}.get(file.name)
    if expected:check(page.cards==expected,f'Wrong static catalogue count: {file.name} = {page.cards}')
ET.parse(ROOT/'sitemap.xml')
print(f'Catalogue: {len(data)} unique packages; {dict(Counter(p["category"] for p in data))}')
print(f'Images: {len(photos)} manifest records; checked local WebP files and attribution fields')
print(f'Pages: {len(files)}; checked links, metadata, JSON-LD, shared navigation and static catalogue counts')
if errors:
    print('\n'.join(errors));sys.exit(1)
print('All static checks passed.')

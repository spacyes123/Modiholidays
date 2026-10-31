"""Rebrand regression checks against the completed launch-preparation revision."""
import hashlib, json, re, subprocess
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parent.parent
BASE='88282ca5e6abc72ba109ef3b427722a5c7669455'
def git(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def sha(content):return hashlib.sha256(content).hexdigest()
assert (ROOT/'assets/packages.json').read_bytes().replace(b'\r\n',b'\n')==git('assets/packages.json').replace(b'\r\n',b'\n'),'Catalogue changed'
for name in ['assets/image-manifest.json','IMAGE-CREDITS.md','.github/workflows/pages.yml','sitemap.xml','assets/catalogue.js']:
 assert (ROOT/name).read_bytes().replace(b'\r\n',b'\n')==git(name).replace(b'\r\n',b'\n'),name+' changed'
photos=list((ROOT/'assets/photos').glob('*.webp'))
for photo in photos:assert sha(photo.read_bytes())==sha(git(photo.relative_to(ROOT).as_posix())),str(photo)+' changed'
meta=json.loads((ROOT/'assets/brand/provenance.json').read_text())
assert sha((ROOT/'assets/brand/modi-holidays-approved.png').read_bytes())==meta['sha256'],'Approved artwork changed'

class Inspect(HTMLParser):
 def __init__(self):super().__init__();self.title='';self.in_title=False;self.description=None;self.canonical=None;self.schema=[];self.in_schema=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='title':self.in_title=True
  if tag=='meta' and a.get('name')=='description':self.description=a.get('content')
  if tag=='link' and a.get('rel')=='canonical':self.canonical=a.get('href')
  if tag=='script' and a.get('type')=='application/ld+json':self.in_schema=True
 def handle_endtag(self,tag):
  if tag=='title':self.in_title=False
  if tag=='script':self.in_schema=False
 def handle_data(self,s):
  if self.in_title:self.title+=s
  if self.in_schema:self.schema.append(json.loads(s))

pages=list(ROOT.glob('*.html'))+list((ROOT/'tours').glob('*.html'))
for p in pages:
 rel=p.relative_to(ROOT).as_posix();new=p.read_text(encoding='utf-8');old=git(rel).decode('utf-8')
 a=Inspect();a.feed(old);b=Inspect();b.feed(new)
 if rel=='about.html':a.description=a.description.replace('a relaunching travel business','a travel brand with a journey beginning in 2009')
 assert (a.title,a.description,a.canonical,a.schema)==(b.title,b.description,b.canonical,b.schema),'SEO changed: '+rel
 assert 'assets/logo.svg' not in new,'Old logo reference: '+rel
 assert 'assets/brand/logo-256.png' in new,'Approved logo missing: '+rel
 assert 'name="theme-color" content="#55234B"' in new,'Wrong browser theme: '+rel
 assert 'assets/brand/icon-32.png' in new and 'assets/brand.css' in new,'Brand metadata missing: '+rel

def luminance(h):
 c=[int(h[i:i+2],16)/255 for i in (1,3,5)]
 c=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c]
 return .2126*c[0]+.7152*c[1]+.0722*c[2]
for label,fg,bg in [('Body','#29232B','#FFFFFF'),('Headings','#55234B','#FFF8F0'),('Primary CTA','#29232B','#F39A24'),('Secondary text','#8C4879','#FFF8F0'),('Footer','#EFE2EC','#55234B'),('Footer highlights','#FFD9A8','#55234B')]:
 a,b=sorted([luminance(fg),luminance(bg)])
 ratio=(b+.05)/(a+.05);assert ratio>=4.5,label+' contrast fails'
 print(f'{label} contrast: {ratio:.2f}:1')
print(f'Brand checks passed: {len(pages)} pages; catalogue, {len(photos)} photos, credits, catalogue script, sitemap, deployment workflow and SEO content unchanged.')

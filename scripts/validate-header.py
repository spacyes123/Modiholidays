from pathlib import Path
from html.parser import HTMLParser
class Nav(HTMLParser):
 def __init__(self):super().__init__();self.active=False;self.depth=0;self.labels=[];self.capture=False
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='nav' and a.get('id')=='primary-nav':self.active=True
  elif self.active and t=='div':self.depth+=1
  elif self.active and t=='a' and self.depth<2:self.capture=True
 def handle_endtag(self,t):
  if t=='nav':self.active=False
  if self.active and t=='div':self.depth-=1
  if t=='a':self.capture=False
 def handle_data(self,s):
  if self.capture:self.labels.append(s.strip())
root=Path(__file__).resolve().parent.parent
pages=list(root.glob('*.html'))+list((root/'tours').glob('*.html'))
for p in pages:
 s=p.read_text(encoding='utf-8');n=Nav();n.feed(s)
 assert n.labels==['Domestic','International','Group Tours','About Us','Contact','Get a Quote'],(p,n.labels)
 if '<footer' in s:assert 'mailto:modiholidays15@gmail.com' in s and 'tel:+917666018401' in s,p
 assert 'setup pending' not in s.lower(),p
s=(root/'about.html').read_text(encoding='utf-8');assert '2009' in s and 'relaunch' not in s.lower()
print(f'Final header/contact checks passed on {len(pages)} pages.')


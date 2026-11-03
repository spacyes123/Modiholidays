from pathlib import Path
import re,subprocess,json,hashlib
R=Path('.')
pattern=r'<title.*?</title>|<meta\b[^>]*>|<link[^>]*rel="canonical"[^>]*>|<script[^>]*type="application/ld\+json".*?</script>'
count=0
for p in list(R.glob('*.html'))+list((R/'tours').glob('*.html')):
 if p.name=='homepage-prototype.html':continue
 old=subprocess.check_output(['git','show','HEAD:'+p.as_posix()]).decode('utf-8')
 assert re.findall(pattern,old,re.S)==re.findall(pattern,p.read_text(encoding='utf-8'),re.S),str(p)
 count+=1
for f in ['assets/packages.json','assets/image-manifest.json','sitemap.xml','robots.txt','CNAME']:
 assert subprocess.check_output(['git','show','HEAD:'+f]).replace(b'\r\n',b'\n')==Path(f).read_bytes().replace(b'\r\n',b'\n'),f
print('SEO unchanged on',count,'pages; catalogue, image manifest, sitemap, robots and CNAME unchanged (Git line endings normalised).')


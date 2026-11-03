"""Promote approved homepage composition without changing original SEO fields."""
from pathlib import Path
import re, subprocess, sys
R=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(R/'work/bespoke/build_prototype.py')],check=True)
old=(R/'index.html').read_text(encoding='utf-8')
new=(R/'homepage-prototype.html').read_text(encoding='utf-8')
pattern=r'<title.*?</title>|<meta\b[^>]*>|<link[^>]*rel="canonical"[^>]*>|<script[^>]*type="application/ld\+json".*?</script>'
tags=re.findall(pattern,old,re.S)
new=re.sub(pattern,'',new,flags=re.S)
new=new.replace('</head>',''.join(tags)+'</head>')
(R/'index.html').write_text(new,encoding='utf-8')

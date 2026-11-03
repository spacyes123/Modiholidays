"""Phase 2 shared shell. Run after build_site.py. Leaves content and SEO intact."""
from pathlib import Path
import re
R=Path(__file__).resolve().parents[1]
for p in list(R.glob('*.html'))+list((R/'tours').glob('*.html')):
    if p.name in ['admin.html','homepage-prototype.html']:continue
    s=p.read_text(encoding='utf-8');prefix='../' if p.parent.name=='tours' else ''
    def logo(m):
        tag=m[0]; dark='footer-brand' in tag
        src=prefix+'assets/brand/approved/modi-holidays-logo-'+('dark' if dark else 'light')+'-background.png'
        tag=re.sub(r'\s(?:srcset|sizes|width|height)="[^"]*"','',tag)
        return re.sub(r'src="[^"]*"','src="'+src+'"',tag)
    s=re.sub(r'<img[^>]+class="(?:brand-artwork|footer-brand)"[^>]*>',logo,s)
    s=re.sub(r'<link[^>]+href="(?:\.\./)?assets/bespoke/public.css[^" ]*"[^>]*>','',s)
    link=f'<link rel="stylesheet" href="{prefix}assets/bespoke/public.css?v=phase2-final">'
    s=s.replace('</head>',link+'</head>')
    p.write_text(s,encoding='utf-8')
print('Applied shared public logo/style; page content and SEO unchanged.')


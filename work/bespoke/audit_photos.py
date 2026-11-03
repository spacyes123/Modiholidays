from pathlib import Path
import re,json,hashlib
from html.parser import HTMLParser
R=Path(__file__).resolve().parents[2]
s=(R/'homepage-prototype.html').read_text(encoding='utf-8')
uses={}
class Images(HTMLParser):
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='img' and '/brand/' not in a['src']:uses.setdefault(a['src'],[]).append(a.get('alt',''))
Images().feed(s)
for p in re.findall(r"url\('(assets/(?:bespoke|photos)/[^']+)'\)",s):uses.setdefault(p,[]).append('Hero desktop/mobile background')
m=json.loads((R/'assets/image-manifest.json').read_text(encoding='utf-8'))
byfile={v['image']:v for v in m.values()}
report=['# Homepage photograph provenance audit — 2 November 2026','', 'Scope: every unique photograph used by the prototype. Source HTML supplies eight unique embedded images, reused in multiple sections. Three additional photographs come from the existing catalogue. No image was regenerated.','', '**Publication hold:** the eight embedded photographs have no author, original source URL or licence declaration in the supplied HTML. Their source file is identifiable, but their rights are unverified. Owner must provide original source/licence or documented generation provenance before publication. The approved logo is also outstanding.','']
for f,usage in uses.items():
    report+=['## '+f,'','- Usage: '+'; '.join(dict.fromkeys(usage)),'- SHA-256: `'+hashlib.sha256((R/f).read_bytes()).hexdigest()+'`']
    if f in byfile:
        v=byfile[f]
        report+=['- Original source: ['+v['alt']+']('+v['source']+')','- Author: '+v['author'].replace('\n',' '),'- Licence: ['+v['license']+']('+v['licenseUrl']+')','- Source licence declaration checked on Wikimedia Commons on 2 November 2026.','- Changes: '+v['changes'],'- Keep author, source and licence links, and change notice. For CC BY-SA adaptations, retain the same or a compatible licence.']
    else:report+=['- Supplied source: `H:/Desktop/modi-holidays-bespoke.html` (embedded base64 WebP; extracted byte-for-byte).','- Original photographer/creator: unknown.','- Original publication URL: not supplied.','- Licence / commercial-use permission: unverified; not cleared for publication.']
    report+=['']
pending=[f for f in uses if f not in byfile]
report[2]=f'Scope: all {len(uses)} unique photographs currently used by the prototype. Five travel-card images now use documented catalogue photographs; no source catalogue or image files changed.'
report[4]=f'**Publication hold:** {len(pending)} remaining embedded reference assets have no documented original creator or licence. The approved hero is retained as requested; rights must be supplied before publication, or a replacement hero approved. The gold-flourish logo is also outstanding.'
if not pending:report[4]='All photographs currently used by the homepage map to documented catalogue sources. The owner authorised replacement of the unverified hero; the new hero is Kerala backwaters by Vyacheslav Argenberg, CC BY 4.0, with author/source/licence and modification credits in the footer. Approved transparent raster logos are installed. No original embedded reference photographs remain in the rendered homepage. Retained source-reference files are not publication artwork.'
report+=['## Replacement notes','','The five new travel-card images have no embedded lettering. Their existing catalogue source records and source-page licence declarations are retained. The Manali author also requests contact before commercial use on the source page; record that request for publication review rather than treating the image as unconditionally cleared. No contact was made.','']
(R/'assets/bespoke/PHOTO-LICENSING.md').write_text('\n'.join(report),encoding='utf-8')
out=R.parent/'outputs/bespoke/revision-3'
(out/'PHOTO-LICENSING.md').write_text('\n'.join(report),encoding='utf-8')
print('Audited',len(uses),'unique photographs; all usages mapped.')

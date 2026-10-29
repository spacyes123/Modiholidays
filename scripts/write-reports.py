"""Regenerate human-readable image credits and this branch's file inventory."""
import json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
data=json.loads((ROOT/'assets/packages.json').read_text(encoding='utf-8'))
manifest=json.loads((ROOT/'assets/image-manifest.json').read_text(encoding='utf-8'))
lines=['# Destination image credits','', 'Source metadata retrieved and photographs visually reviewed on 29 October 2026. All 140 packages use local WebP files; each photograph has a distinct source page. Images retain their respective original licences. Resizing, WebP conversion and display cropping are disclosed beside the images. CC BY-SA derivatives are distributed under their corresponding share-alike licences.','', 'Photos illustrate destinations, without promising a particular accommodation or included service. Source identification is based on the linked Commons file metadata and visual review, not independent geolocation or a legal warranty of uploader provenance.','']
for p in data:
    m=manifest[p['id']]
    lines += [f'## {p["id"]} — {p["name"]}','',f'- Photograph: {m["alt"]}',f'- Author / credit: {m["author"] or "Author not recorded (public domain)"}',f'- Source and title: [{m["alt"]}]({m["source"]})',f'- Licence: [{m["license"]}]({m["licenseUrl"]})',f'- Local files: `{m["image"]}`, `{m["small"]}`',f'- Changes: {m["changes"]}',f'- Catalogue destination: {p["destination"]}; route: {", ".join(p["route"])}','']
(ROOT/'IMAGE-CREDITS.md').write_text('\n'.join(lines),encoding='utf-8')
base='d4c65b45b6b99a10bca2b438130d0c89178d2f70'
modified=subprocess.check_output(['git','diff','--name-only',base],cwd=ROOT,text=True).splitlines()
untracked=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines()
files=sorted(set(modified+untracked+['MODIFIED-FILES.md']))
inventory=['# Modified files','',f'Compared with original repository commit `{base}`. Includes added and removed files.','',f'{len(files)} paths. The 280 WebP assets are two sizes for each of 140 photographs. The 140 generated tour pages include pages missing from the original checkout.','']
inventory += ['- `'+f+'`' for f in files]
(ROOT/'MODIFIED-FILES.md').write_text('\n'.join(inventory)+'\n',encoding='utf-8')
print(f'Wrote credits for {len(manifest)} images and inventory of {len(files)} paths.')

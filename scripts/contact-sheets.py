from PIL import Image, ImageOps, ImageDraw
from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
out=root/'work';out.mkdir(exist_ok=True)
data=json.loads((root/'assets/packages.json').read_text(encoding='utf-8'))
m=json.loads((root/'assets/image-manifest.json').read_text(encoding='utf-8'))
for start in range(0,len(data),35):
    sheet=Image.new('RGB',(1250,1470),'white');draw=ImageDraw.Draw(sheet)
    for n,p in enumerate(data[start:start+35]):
        if p['id'] not in m:continue
        img=Image.open(root/m[p['id']]['small']);img=ImageOps.fit(img,(244,160))
        x=(n%5)*250;y=(n//5)*210
        sheet.paste(img,(x,y));draw.text((x+3,y+164),p['id']+' '+p['destination'],fill='black')
        draw.text((x+3,y+179),m[p['id']]['alt'][:35],fill='black')
    sheet.save(out/f'photos-{start//35+1}.jpg')

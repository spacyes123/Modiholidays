/* Deterministic derivatives of the owner's approved artwork. No generative editing. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const sharp=require(process.env.SHARP_PATH||'sharp');
const root=path.join(__dirname,'..'),dir=path.join(root,'assets/brand');fs.mkdirSync(dir,{recursive:true});
const original=path.join(dir,'modi-holidays-approved.png');
if(process.argv[2])fs.copyFileSync(process.argv[2],original);
if(!fs.existsSync(original))throw Error('Supply the approved artwork path on the first run.');
(async()=>{
 for(const size of [256,512])await sharp(original).resize(size,size,{fit:'contain',withoutEnlargement:true}).png({compressionLevel:9}).toFile(path.join(dir,`logo-${size}.png`));
 // Full square artwork remains visible, centred within the standard social canvas.
 await sharp(original).resize(630,630,{fit:'contain'}).extend({left:285,right:285,top:0,bottom:0,background:'#ffffff'}).png({compressionLevel:9}).toFile(path.join(dir,'social-sharing.png'));
 const favicon=spawnSync('pwsh',['-NoProfile','-File',path.join(root,'scripts/prepare-favicons.ps1')],{stdio:'inherit'});
 if(favicon.error)throw favicon.error;
 if(favicon.status!==0)throw Error('Approved-logo favicon generation failed. Run scripts/prepare-favicons.ps1 in PowerShell.');
 const meta=await sharp(original).metadata();
 fs.writeFileSync(path.join(dir,'provenance.json'),JSON.stringify({source:'Centered Modi Holidays Logo.png — owner-approved artwork',sha256:crypto.createHash('sha256').update(fs.readFileSync(original)).digest('hex'),width:meta.width,height:meta.height,original:'modi-holidays-approved.png',treatment:'Original retained byte-for-byte. Derivatives only resize the complete square artwork; no cropping, recolouring, redrawing, transparency removal or typography changes. Social image adds white margins to a 1200×630 canvas.'},null,2)+'\n');
 console.log('Approved original preserved; faithful logo, favicon and social derivatives prepared.');
})();

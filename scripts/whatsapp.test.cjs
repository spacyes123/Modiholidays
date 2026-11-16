/* Zero-dependency browser-script regressions; real click acceptance is also run in a browser. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../assets/main.js'),'utf8');
function setup(config,valid=true) {
  const links=new Map();
  const anchor=()=>({dataset:{},attributes:{},href:'',target:'',removeAttribute(name){delete this.attributes[name];if(name==='target')this.target='';},focus(){this.focused=true;}});
  const tour=anchor();tour.dataset.message='Hello Modi Holidays, I am interested in Kerala Scenic Escape (MH-003), 8 Days / 7 Nights.';
  const submit={disabled:true};
  const status={textContent:'',after(link){links.set(link.id,link);}};
  const data={name:'Website QA — not a customer',phone:'0000000000',destination:'Kerala Scenic Escape',adults:'2',children:'0',departureCity:'Mumbai'};
  let handler;
  const form={elements:{},reportValidity:()=>valid,querySelector:()=>submit,addEventListener(event,fn){if(event==='submit')handler=fn;}};
  const document={
    querySelector(selector){return selector==='#form-status'?status:selector==='#holiday-enquiry-form'?form:null;},
    querySelectorAll(selector){return selector==='[data-whatsapp]'?[tour]:[];},
    getElementById(id){return links.get(id);},createElement:anchor,
  };
  class FormData {get(key){return data[key] || '';} entries(){return Object.entries(data);}}
  vm.runInNewContext(script,{document,window:{MODI_HOLIDAYS_CONFIG:config},location:{search:''},URLSearchParams,FormData,encodeURIComponent});
  return {tour,submit,status,links,async prepare(){let prevented=false;await handler({preventDefault(){prevented=true;}});assert.equal(prevented,true);}};
}
for (const [name,config] of [['normal',{whatsappNumber:'917666018401'}],['missing',undefined],['invalid',{whatsappNumber:'placeholder'}]]) {
  test(`${name} config retains working same-tab WhatsApp anchors and the tour message`,()=>{
    const app=setup(config);const url=new URL(app.tour.href);
    assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/917666018401');
    assert.equal(url.searchParams.get('text'),app.tour.dataset.message);
    assert.equal(app.tour.target,'');assert.equal(app.submit.disabled,false);
  });
}
test('preparing an enquiry creates a native same-tab link with number, tour and traveller details',async()=>{
  const app=setup({whatsappNumber:'917666018401'});await app.prepare();
  const link=app.links.get('prepared-enquiry'),url=new URL(link.href);
  assert.equal(url.pathname,'/917666018401');assert.equal(link.target,'');assert.equal(link.focused,true);
  assert.match(url.searchParams.get('text'),/Destination \/ package: Kerala Scenic Escape/);
  assert.match(url.searchParams.get('text'),/Adults: 2/);assert.match(url.searchParams.get('text'),/Departure city: Mumbai/);
  assert.match(app.status.textContent,/Nothing has been sent or saved/);
});
test('invalid form data does not create an enquiry link',async()=>{
  const app=setup({whatsappNumber:'917666018401'},false);await app.prepare();assert.equal(app.links.size,0);
});

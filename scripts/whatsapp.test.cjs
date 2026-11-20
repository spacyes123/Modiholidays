/* Zero-dependency browser-script regressions; real click acceptance is also run in a browser. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../assets/main.js'),'utf8');
function setup(config,valid=true,popup=true) {
  const links=new Map();
  const anchor=()=>({dataset:{},attributes:{},href:'',target:'',hidden:false,className:'',textContent:'',removeAttribute(name){delete this.attributes[name];if(name==='target')this.target='';},focus(){this.focused=true;}});
  const tour=anchor();tour.dataset.message='Hello Modi Holidays, I am interested in Kerala Scenic Escape (MH-003), 8 Days / 7 Nights.';
  const submit={disabled:true};
  const status={textContent:'',after(link){links.set(link.id,link);}};
  const data={name:'Website QA — not a customer',phone:'0000000000',email:'qa@example.test',destination:'Kerala Scenic Escape',travelDates:'November 12',adults:'2',children:'0',departureCity:'Mumbai',budget:'Flexible',preferences:'Synthetic accessibility note'};
  const opened=[];
  let handler;
  const form={elements:{},reportValidity:()=>valid,querySelector:()=>submit,addEventListener(event,fn){if(event==='submit')handler=fn;}};
  const document={
    querySelector(selector){return selector==='#form-status'?status:selector==='#holiday-enquiry-form'?form:null;},
    querySelectorAll(selector){return selector==='[data-whatsapp]'?[tour]:[];},
    getElementById(id){return links.get(id);},createElement:anchor,
  };
  class FormData {get(key){return data[key] || '';} entries(){return Object.entries(data);}}
  vm.runInNewContext(script,{document,window:{MODI_HOLIDAYS_CONFIG:config,open:(url,target)=>{opened.push({url,target});return popup?{opener:'website'}:null;}},location:{search:''},URLSearchParams,FormData,encodeURIComponent});
  return {tour,submit,status,links,opened,async prepare(){let prevented=false;await handler({preventDefault(){prevented=true;}});assert.equal(prevented,true);}};
}
for (const [name,config] of [['normal',{whatsappNumber:'917666018401'}],['missing',undefined],['invalid',{whatsappNumber:'placeholder'}]]) {
  test(`${name} config retains working same-tab WhatsApp anchors and the tour message`,()=>{
    const app=setup(config);const url=new URL(app.tour.href);
    assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/917666018401');
    assert.equal(url.searchParams.get('text'),app.tour.dataset.message);
    assert.equal(app.tour.target,'');assert.equal(app.submit.disabled,false);
  });
}
test('one valid form action opens WhatsApp and retains a contextual fallback link',async()=>{
  const app=setup({whatsappNumber:'917666018401'});await app.prepare();
  const link=app.links.get('prepared-enquiry'),url=new URL(link.href);
  assert.equal(url.pathname,'/917666018401');assert.equal(link.target,'');assert.equal(link.focused,true);assert.equal(app.opened.length,1);assert.equal(app.opened[0].target,'_blank');
  assert.match(url.searchParams.get('text'),/Destination \/ package: Kerala Scenic Escape/);
  for (const part of ['Adults: 2','Departure city: Mumbai','Email: qa@example.test','Travel dates: November 12','Budget per person: Flexible','Synthetic accessibility note']) assert.ok(url.searchParams.get('text').includes(part));
  assert.match(app.status.textContent,/press Send/);assert.match(app.status.textContent,/Nothing has been sent or saved/);
});
test('blocked popup still exposes WhatsApp fallback without claiming a send or save',async()=>{
  const app=setup({whatsappNumber:'917666018401'},true,false);await app.prepare();
  assert.equal(app.opened.length,1);assert.match(app.status.textContent,/WhatsApp message is ready/);assert.equal(app.links.get('prepared-enquiry').hidden,false);
});
test('invalid form data does not create an enquiry link',async()=>{
  const app=setup({whatsappNumber:'917666018401'},false);await app.prepare();assert.equal(app.links.size,0);
});

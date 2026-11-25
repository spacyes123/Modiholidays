'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/bespoke/prototype.js'),'utf8');
const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/packages.json'),'utf8'));
class Node {
  constructor(id=''){this.id=id;this.value='';this.textContent='';this.hidden=false;this.children=[];this.listeners={};this.classList={add(){},remove(){}};this.href='';this.focused=false;this.checked=false;this.attributes={};this.name='';}
  addEventListener(name,fn){this.listeners[name]=fn;}
  querySelector(){return{focus(){}};}
  querySelectorAll(){return[];}
  getClientRects(){return[1];}
  focus(){this.focused=true;}
  setAttribute(name,value){this.attributes[name]=value;}
  setCustomValidity(value){this.validityMessage=value;}
  replaceChildren(...children){this.children=[...children];}
  append(...children){this.children.push(...children);}
}
function setup({valid=true,popup=true}={}){
  const ids=['year','enquiry','tripform','customer-name','travellers','email','mobile','departure-city','budget','consent','kind','where','when','details','holiday-month','send-enquiry','message-copy','copy-enquiry','status','catalogue-search','holiday-destination','holiday-category','holiday-duration','holiday-reset','search-results','search-custom-enquiry','search-alternatives-heading','search-results-region','search-status','catalogue-data','crm-enquiry-link'];
  const els=Object.fromEntries(ids.map(id=>[id,new Node(id)]));
  els['search-alternatives-heading'].textContent='You may also like';
  els['search-results-region'].hidden=true;
  els['catalogue-data'].textContent=JSON.stringify(rows);
  els['tripform'].reportValidity=()=>valid&&Boolean(els['customer-name'].value)&&Boolean(els.where.value)&&(els.email.value.trim()||els.mobile.value.trim())&&els.consent.checked;
  els['catalogue-search'].reportValidity=()=>valid;
  els['customer-name'].value='QA traveller';els.travellers.value='3';els.email.value='qa@example.test';els.mobile.value='9000000000';els['departure-city'].value='Mumbai';els.budget.value='₹30,000–₹60,000';els.where.value='Kashmir';els.kind.value='Family escape';els.details.value='Anniversary & accessibility needs';els.consent.checked=true;
  els['holiday-destination'].value='Andaman';els['holiday-category'].value='Domestic';els['holiday-duration'].value='4';els['holiday-month'].value='November';
  const document={activeElement:new Node('active'),readyState:'complete',body:{style:{}},getElementById:id=>els[id],addEventListener(){},createElement:tag=>new Node(tag),createElementNS:(namespace,tag)=>new Node(tag),createTextNode:text=>{const node=new Node('#text');node.textContent=text;return node;},querySelector(){return null;}};
  const assigned=[],opened=[];const window={MODI_HOLIDAYS_CONFIG:{},location:{assign:url=>assigned.push(url)},open:(url,target)=>{opened.push({url,target});return popup?{opener:'website'}:null;}};
  vm.runInNewContext(source,{document,window,navigator:{clipboard:{writeText:async()=>{}}},encodeURIComponent,URL,Date});
  return{els,document,assigned,opened};
}
function submitSearch(app){let prevented=false;app.els['catalogue-search'].listeners.submit({preventDefault(){prevented=true;}});assert.ok(prevented);}
test('Andaman, Domestic, 4 nights matches the real 5-day/4-night catalogue package; November remains a preference',()=>{
  const app=setup();submitSearch(app);
  assert.equal(app.els['search-results'].children.length,1);
  assert.equal(app.els['search-results-region'].hidden,false);
  const card=app.els['search-results'].children[0],body=card.children[1],actions=body.children[3];
  assert.equal(card.className,'search-result');
  assert.equal(card.children[0].src,'assets/photos/mh-100.webp');
  assert.equal(card.children[0].alt,'Andaman · Andaman Island Honeymoon');
  assert.equal(body.children[0].textContent,'Andaman');
  assert.equal(body.children[1].textContent,'Andaman Island Honeymoon');
  assert.equal(body.children[2].textContent,'5 Days / 4 Nights');
  assert.equal(actions.children[0].href,'/tours/andaman-island-honeymoon-mh-100');
  const enquiryUrl=new URL(actions.children[1].href),message=enquiryUrl.searchParams.get('text');
  assert.equal(enquiryUrl.pathname,'/917666018401');
  for(const part of ['Andaman Island Honeymoon','Andaman','5 Days / 4 Nights','November'])assert.ok(message.includes(part));
  assert.equal(app.els['search-custom-enquiry'].hidden,true);
  assert.equal(app.els['search-alternatives-heading'].hidden,true);
  assert.match(app.els['search-status'].textContent,/1 matching holiday/);
  assert.match(app.els['search-status'].textContent,/November; departure availability is not published/);
  assert.doesNotMatch(app.els['search-status'].textContent,/departure available|availability confirmed/i);
});
test('multiple matches respect destination, category and exact night count',()=>{
  const app=setup();app.els['holiday-duration'].value='6';submitSearch(app);
  assert.equal(app.els['search-results'].className,'has-two-results');
  const names=app.els['search-results'].children.map(card=>card.children[1].children[1].textContent);
  assert.deepEqual(names,['Andaman Island Escape','Andaman Three Island Escape']);
});
test('zero exact matches show same-destination alternatives and a contextual WhatsApp custom-itinerary link',()=>{
  const app=setup();app.els['holiday-destination'].value='Andaman';app.els['holiday-duration'].value='3';submitSearch(app);
  const cards=app.els['search-results'].children.filter(child=>child.className==='search-result');
  const custom=app.els['search-custom-enquiry'];
  assert.ok(cards.length>0);
  assert.ok(cards.every(card=>card.children[1].children[0].textContent==='Andaman'));
  assert.ok(cards.every(card=>card.children[1].children[2].textContent!=='3 nights'));
  assert.equal(app.els['search-status'].textContent,'','the form status must not repeat the consolidated no-match message');
  assert.equal(custom.hidden,false);
  const messagePanel=custom.children[0],cta=custom.children[1];
  assert.equal(messagePanel.children[0].textContent,'No exact match found for your search.');
  assert.equal(messagePanel.children[1].textContent,'We can customise a holiday itinerary based on your destination, travel dates, duration and preferences.');
  assert.equal(cta.className,'btn btn-dark custom-itinerary-link');
  assert.equal(cta.children[0].id,'svg');assert.equal(cta.children[0].attributes['aria-hidden'],'true');
  assert.equal(cta.children[1].textContent,'Customise My Trip on WhatsApp');
  assert.doesNotMatch(cta.children[1].textContent,/\d{8,}/,'the WhatsApp number must not be shown in the button');
  const url=new URL(custom.children[1].href),message=url.searchParams.get('text');
  assert.equal(url.pathname,'/917666018401');
  for(const part of ['Andaman','Domestic','November','3 nights'])assert.ok(message.includes(part));
});
test('no catalogue match still offers a correctly contextual custom itinerary enquiry',()=>{
  const app=setup();app.els['holiday-destination'].value='Kashmir';app.els['holiday-category'].value='International';submitSearch(app);
  assert.equal(app.els['search-results'].children.length,0);
  assert.equal(app.els['search-custom-enquiry'].hidden,false);
  const custom=app.els['search-custom-enquiry'];
  assert.equal(custom.children[0].children[0].textContent,'No exact match found for your search.');
  assert.equal(custom.children[0].children[1].textContent,'We can customise a holiday itinerary based on your destination, travel dates, duration and preferences.');
  assert.equal(custom.children[1].children[1].textContent,'Customise My Trip on WhatsApp');
  assert.equal(app.els['search-alternatives-heading'].hidden,true);
  const url=new URL(custom.children[1].href),message=url.searchParams.get('text');
  assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/917666018401');
  assert.match(message,/Destination: Kashmir/);assert.match(message,/Holiday type: International/);assert.match(message,/Preferred travel month: November/);assert.match(message,/Preferred duration: 4 nights/);
  assert.equal(app.els['search-status'].textContent,'','the results section is the only no-match message');
});
test('Delhi and Agra six-night search shows the correctly imaged four-night alternative outside the result grid',()=>{
  const app=setup();app.els['holiday-destination'].value='Delhi & Agra';app.els['holiday-category'].value='Domestic';app.els['holiday-month'].value='May';app.els['holiday-duration'].value='6';submitSearch(app);
  assert.equal(app.els['search-results'].children.length,1);
  const card=app.els['search-results'].children[0],body=card.children[1];
  assert.equal(card.children[0].src,'assets/photos/mh-077.webp');
  assert.equal(body.children[0].textContent,'Delhi & Agra');
  assert.equal(body.children[1].textContent,'Delhi Agra Heritage');
  assert.equal(body.children[2].textContent,'5 Days / 4 Nights');
  assert.equal(app.els['search-status'].textContent,'','the selected month and duration are not repeated in the form');
  assert.equal(app.els['search-custom-enquiry'].hidden,false);
  assert.equal(app.els['search-alternatives-heading'].textContent,'You may also like');
  assert.equal(app.els['search-alternatives-heading'].hidden,false);
  assert.equal(app.els['search-custom-enquiry'].children.length,2);
});
test('reset clears all search preferences/results and returns keyboard focus to destination',()=>{
  const app=setup();submitSearch(app);app.els['holiday-reset'].listeners.click();
  for(const id of ['holiday-destination','holiday-category','holiday-month','holiday-duration'])assert.equal(app.els[id].value,'');
  assert.equal(app.els['search-results'].children.length,0);assert.equal(app.els['holiday-destination'].focused,true);
  assert.equal(app.els['search-custom-enquiry'].children.length,0);assert.equal(app.els['search-custom-enquiry'].hidden,true);
  assert.equal(app.els['search-alternatives-heading'].hidden,true);
  assert.equal(app.els['search-results-region'].hidden,true);
  assert.match(app.els['search-status'].textContent,/Filters cleared/);
});
test('valid enquiry opens one correctly encoded WhatsApp message and leaves an explicit fallback',()=>{
  const app=setup();let prevented=false;
  app.els.tripform.listeners.submit({preventDefault(){prevented=true;}});
  assert.ok(prevented);assert.equal(app.opened.length,1);assert.equal(app.opened[0].target,'_blank');assert.equal(app.opened[0].url.startsWith('https://wa.me/917666018401?text='),true);
  const message=new URL(app.opened[0].url).searchParams.get('text');
  for(const part of ['QA traveller','Travellers: 3','qa@example.test','9000000000','Kashmir','Mumbai','November','Anniversary & accessibility needs','₹30,000–₹60,000'])assert.ok(message.includes(part),`missing ${part}`);
  assert.equal(app.els['send-enquiry'].hidden,false);assert.match(app.els.status.textContent,/press Send/);assert.match(app.els.status.textContent,/nothing has been sent or saved/);
});
test('popup-restricted browser leaves a visible WhatsApp link and preserves entered values',()=>{
  const app=setup({popup:false});app.els.tripform.listeners.submit({preventDefault(){}});
  assert.equal(app.els['send-enquiry'].hidden,false);assert.equal(app.els.where.value,'Kashmir');assert.equal(app.els['customer-name'].value,'QA traveller');
  assert.match(app.els.status.textContent,/browser did not open WhatsApp/);assert.match(app.els['send-enquiry'].href,/^https:\/\/wa\.me\/917666018401\?text=/);
});
test('missing reply channel is rejected without WhatsApp handoff',()=>{
  const app=setup();app.els.email.value='';app.els.mobile.value='';app.els.tripform.listeners.submit({preventDefault(){}});
  assert.equal(app.opened.length,0);assert.match(app.els.email.validityMessage,/Enter an email or mobile number/);
});
test('unchecked consent is rejected without WhatsApp handoff',()=>{
  const app=setup();app.els.consent.checked=false;app.els.tripform.listeners.submit({preventDefault(){}});assert.equal(app.opened.length,0);
});

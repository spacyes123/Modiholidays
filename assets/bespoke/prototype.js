'use strict';
document.getElementById('year').textContent=new Date().getFullYear();
let activeDialog=null, returnFocus=null;
function showDialog(id){returnFocus=document.activeElement;activeDialog=document.getElementById(id);activeDialog.classList.add('open');document.body.style.overflow='hidden';activeDialog.querySelector('button,input,a').focus();}
function hideDialog(){if(!activeDialog)return;activeDialog.classList.remove('open');activeDialog=null;document.body.style.overflow='';returnFocus?.focus();}
function toggleMenu(open){open?showDialog('menu'):hideDialog();}
function openEnquiry(){showDialog('enquiry');}
function closeEnquiry(){hideDialog();}
document.addEventListener('keydown',e=>{if(!activeDialog)return;if(e.key==='Escape')hideDialog();if(e.key==='Tab'){const items=[...activeDialog.querySelectorAll('button,a[href],input,select,textarea,summary')].filter(x=>x.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
document.getElementById('enquiry').addEventListener('click',e=>{if(e.target.id==='enquiry')hideDialog();});
const trip=document.getElementById('tripform');
function prepareMessage(){const value=id=>document.getElementById(id).value.trim();const message='Hello Modi Holidays, I would like to plan a journey.\nName: '+value('customer-name')+'\nTravellers: '+value('travellers')+'\nEmail: '+(value('email')||'Not provided')+'\nMobile: '+(value('mobile')||'Not provided')+'\nTravel style: '+value('kind')+'\nDestination / package: '+value('where')+'\nDeparture city: '+(value('departure-city')||'Not specified')+'\nPreferred month: '+(value('holiday-month')||'Flexible / not selected')+'\nDates: '+(value('when')||'Not specified')+'\nApproximate budget per person: '+(value('budget')||'Not specified')+'\nSpecial requests: '+(value('details')||'None');const url='https://wa.me/917666018401?text='+encodeURIComponent(message);const link=document.getElementById('send-enquiry');link.href=url;link.textContent='Open WhatsApp if it did not open ↗';link.hidden=false;const copy=document.getElementById('message-copy');copy.value=message;copy.hidden=false;document.getElementById('copy-enquiry').hidden=false;return url;}
function validateEnquiry(){const email=document.getElementById('email'),mobile=document.getElementById('mobile'),missing=!email.value.trim()&&!mobile.value.trim(),message=missing?'Enter an email or mobile number so Modi Holidays can reply.':'';email.setCustomValidity(message);mobile.setCustomValidity(message);return trip.reportValidity();}
const intakeConfig=window.MODI_HOLIDAYS_CONFIG||{};let intakeEndpoint='';try{const endpoint=new URL(String(intakeConfig.publicEnquiryEndpoint||''));if(endpoint.protocol==='https:'&&!endpoint.username&&!endpoint.password&&!endpoint.search&&!endpoint.hash&&endpoint.pathname==='/api/public/enquiries')intakeEndpoint=endpoint.href;}catch{}const intakeReady=!!intakeEndpoint&&!!intakeConfig.turnstileSiteKey;
let popupCaptchaToken='',popupCaptchaWidget,submissionFingerprint='',submissionIdempotencyKey='';
const crmConsent=document.createElement('input');crmConsent.type='checkbox';crmConsent.name='crmConsent';crmConsent.value='yes';
const crmConsentLabel=document.createElement('label');crmConsentLabel.className='consent-row';const crmConsentText=document.createElement('span');crmConsentText.textContent='Also save my enquiry securely for Modi Holidays to follow up. This is optional; WhatsApp is separate.';crmConsentLabel.append(crmConsent,crmConsentText);
const websiteHoney=document.createElement('input');websiteHoney.type='text';websiteHoney.name='website';websiteHoney.autocomplete='off';websiteHoney.tabIndex=-1;websiteHoney.hidden=true;websiteHoney.setAttribute('aria-hidden','true');
const captchaBox=document.createElement('div');captchaBox.setAttribute('role','group');captchaBox.setAttribute('aria-label','Enquiry verification');
const submitButton=trip.querySelector('button[type="submit"]');
if(intakeReady){trip.insertBefore(crmConsentLabel,submitButton);trip.insertBefore(captchaBox,submitButton);trip.append(websiteHoney);crmConsent.addEventListener('change',()=>{submitButton.textContent=crmConsent.checked?'Save enquiry securely':'Continue to WhatsApp';});const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=()=>{if(window.turnstile)popupCaptchaWidget=window.turnstile.render(captchaBox,{sitekey:intakeConfig.turnstileSiteKey,action:'enquiry',callback:token=>{popupCaptchaToken=token;},'expired-callback':()=>{popupCaptchaToken='';}});};script.onerror=()=>{document.getElementById('status').textContent='Enquiry verification could not load. Your details have not been saved; WhatsApp remains available.';};document.head.append(script);}
trip.addEventListener('submit',async e=>{e.preventDefault();if(!validateEnquiry())return;const url=prepareMessage(),link=document.getElementById('send-enquiry'),status=document.getElementById('status');
  if(!intakeReady){status.textContent='Opening WhatsApp with your message. Review it there and press Send; nothing has been sent or saved by this website.';let opened=null;try{opened=window.open(url,'_blank');if(opened)opened.opener=null;}catch{}if(!opened)status.textContent='Your message is ready, but the browser did not open WhatsApp. Use the link below or copy the message; nothing has been sent or saved by this website.';link.focus();return;}
  link.textContent='Continue to WhatsApp ↗';
  if(!crmConsent.checked){status.textContent='No CRM save was requested. Your WhatsApp message is ready; nothing has been saved on this website.';link.focus();return;}
  if(!document.getElementById('mobile').value.trim()){status.textContent='A mobile number is needed to save this enquiry in the CRM. Add one, or continue to WhatsApp without saving.';link.focus();return;}
  if(!popupCaptchaToken){status.textContent='Complete the enquiry verification to save it securely. Nothing has been saved; WhatsApp is available below.';link.focus();return;}
  const v=id=>document.getElementById(id).value.trim(),payload={name:v('customer-name'),phone:v('mobile'),email:v('email'),destination:v('where'),departureCity:'',travelDates:v('when'),adults:v('travellers'),children:'0',budget:'',preferences:`Travel style: ${v('kind')}\n${v('details')}`,website:websiteHoney.value};
  const fingerprint=JSON.stringify(payload);if(fingerprint!==submissionFingerprint){submissionFingerprint=fingerprint;submissionIdempotencyKey=crypto.randomUUID();}
  submitButton.disabled=true;status.textContent='Saving your enquiry securely…';
  try{const response=await fetch(intakeEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,idempotencyKey:submissionIdempotencyKey,captchaToken:popupCaptchaToken}),signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok||result.ok!==true||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result.enquiryId||''))throw Error('Save not confirmed');status.textContent='Your enquiry was saved for the Modi Holidays team. WhatsApp is optional; no booking is confirmed.';link.textContent='Continue to WhatsApp (optional) ↗';}
  catch{status.textContent='We could not confirm that your enquiry was saved. Nothing is confirmed as saved. You can retry or continue with WhatsApp below.';link.textContent='Continue to WhatsApp ↗';}
  finally{submitButton.disabled=false;popupCaptchaToken='';if(window.turnstile&&popupCaptchaWidget!==undefined)window.turnstile.reset(popupCaptchaWidget);}
  link.focus();
});
trip.addEventListener('input',()=>{const email=document.getElementById('email'),mobile=document.getElementById('mobile'),message=!email.value.trim()&&!mobile.value.trim()?'Enter an email or mobile number so Modi Holidays can reply.':'';email.setCustomValidity(message);mobile.setCustomValidity(message);if(!document.getElementById('message-copy').hidden)prepareMessage();});
document.getElementById('copy-enquiry').addEventListener('click',async()=>{if(!validateEnquiry())return;prepareMessage();try{await navigator.clipboard.writeText(document.getElementById('message-copy').value);document.getElementById('status').textContent='Message copied. Paste it into WhatsApp when ready.';}catch{document.getElementById('message-copy').focus();document.getElementById('message-copy').select();document.getElementById('status').textContent='Please copy the selected message manually.';}});
function manageMobileContact(){const mobileContact=document.querySelector?.('.mobile-contact'),floatingWhatsApp=document.querySelector?.('.floating-whatsapp'),holidaySearch=document.getElementById('holiday-search');if(holidaySearch&&'IntersectionObserver'in window){new IntersectionObserver(entries=>{const inSearch=entries.some(entry=>entry.isIntersecting);if(mobileContact){mobileContact.classList.toggle('is-obscured',inSearch);mobileContact.toggleAttribute('inert',inSearch);mobileContact.setAttribute('aria-hidden',String(inSearch));}if(floatingWhatsApp){floatingWhatsApp.classList.toggle('is-obscured',inSearch);floatingWhatsApp.toggleAttribute('inert',inSearch);floatingWhatsApp.setAttribute('aria-hidden',String(inSearch));}},{threshold:0}).observe(holidaySearch);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',manageMobileContact,{once:true});else manageMobileContact();
const catalogue=JSON.parse(document.getElementById('catalogue-data').textContent);
const search=document.getElementById('catalogue-search');
function durationNights(packageRow){const match=String(packageRow.duration||'').match(/\/\s*(\d+)\s*Nights?/i);return match?Number(match[1]):null;}
function matchesType(packageRow,category){return !category||packageRow.category===category||(category==='Domestic'&&packageRow.category==='Pilgrimage');}
function makeWhatsAppIcon(){const ns='http://www.w3.org/2000/svg',icon=document.createElementNS(ns,'svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');icon.setAttribute('stroke-width','1.8');icon.setAttribute('stroke-linecap','round');icon.setAttribute('stroke-linejoin','round');icon.setAttribute('aria-hidden','true');const bubble=document.createElementNS(ns,'path');bubble.setAttribute('d','M20.5 11.5a8.8 8.8 0 0 1-12.7 7.8L3 21l1.7-4.6A8.8 8.8 0 1 1 20.5 11.5Z');const handset=document.createElementNS(ns,'path');handset.setAttribute('d','M8.3 7.5c.2-.5.5-.5.8-.5h.6c.2 0 .4.1.5.4l.8 1.9c.1.2.1.4-.1.6l-.6.7c-.2.2-.2.4-.1.6.4.8 1.4 1.8 2.2 2.2.2.1.4.1.6-.1l.8-.9c.2-.2.4-.2.7-.1l1.8.9c.3.2.4.3.4.5 0 .4-.2 1.2-.7 1.6-.5.5-1.3.7-2 .5-1.1-.3-2.4-.9-3.8-2.2-1.2-1.1-2-2.5-2.2-3.4-.3-.9 0-1.8.3-2.2Z');icon.append(bubble,handset);return icon;}
function makeCustomEnquiry(destination,category,month,nights){const message=['Hello Modi Holidays, please help customise a holiday itinerary.','Destination: '+(destination||'Flexible'),'Holiday type: '+(category||'Flexible'), 'Preferred travel month: '+(month||'Flexible / not selected'), 'Preferred duration: '+(nights?nights+' nights':'Flexible'),'I understand dates, availability and arrangements need to be confirmed in writing.'].join('\n');const link=document.createElement('a');link.className='btn btn-dark custom-itinerary-link';link.href='https://wa.me/917666018401?text='+encodeURIComponent(message);link.append(makeWhatsAppIcon(),document.createTextNode('Customise My Trip on WhatsApp'));return link;}
search.addEventListener('submit',e=>{
 e.preventDefault();
 const destination=document.getElementById('holiday-destination').value;
 const category=document.getElementById('holiday-category').value;
 const nights=document.getElementById('holiday-duration').value;
 const month=document.getElementById('holiday-month').value;
 const exact=catalogue.filter(p=>(!destination||p.destination===destination)&&matchesType(p,category)&&(!nights||durationNights(p)===Number(nights)));
 const alternatives=exact.length?[]:catalogue.filter(p=>(!destination||p.destination===destination)&&matchesType(p,category));
 const results=exact.length?exact:alternatives;
 const box=document.getElementById('search-results');
 const region=document.getElementById('search-results-region');
 const custom=document.getElementById('search-custom-enquiry');
 const alternativesHeading=document.getElementById('search-alternatives-heading');
 box.replaceChildren();custom.replaceChildren();custom.hidden=true;alternativesHeading.hidden=true;region.hidden=false;box.className=results.length===1?'has-single-result':results.length===2?'has-two-results':'';
 const status=document.getElementById('search-status');
 const monthNote=month?' Travel month preference: '+month+'; departure availability is not published.':'';
 if(exact.length)status.textContent=exact.length+' matching '+(exact.length===1?'holiday':'holidays')+'. Duration means nights. Itineraries are suggestions; dates and availability are confirmed in writing.'+monthNote;
 else if(alternatives.length)status.textContent='No exact '+nights+'-night match. Here are '+alternatives.length+' '+(alternatives.length===1?'option':'options')+' for '+(destination||'your selected holiday type')+' with other durations. You can adjust or reset the filters.'+monthNote;
 else status.textContent='No catalogue match for these preferences. Ask us about a custom itinerary or adjust/reset the filters.'+monthNote;
 for(const p of results){
  const card=document.createElement('article');card.className='search-result';
  const image=document.createElement('img');image.className='search-result-image';image.src=p.image;image.alt=p.destination+' · '+p.name;image.loading='lazy';image.decoding='async';
  const body=document.createElement('div');body.className='search-result-body';
  const location=document.createElement('p');location.className='result-destination';location.textContent=p.destination;
  const heading=document.createElement('h3');heading.textContent=p.name;
  const duration=document.createElement('p');duration.className='result-duration';duration.textContent=p.duration;
  const actions=document.createElement('div');actions.className='search-result-actions';
  const itinerary=document.createElement('a');itinerary.className='btn btn-outline-dark';itinerary.href='tours/'+p.slug+'.html';itinerary.textContent='View itinerary';
  const enquiry=document.createElement('a');enquiry.className='btn btn-dark';
  const enquiryMessage=['Hello Modi Holidays, I am interested in '+p.name+' ('+p.id+').','Destination: '+p.destination,'Duration: '+p.duration,'Preferred travel month: '+(month||'Flexible / not selected'),'Please share the itinerary and confirm dates, arrangements and availability in writing.'].join('\n');
  enquiry.href='https://wa.me/917666018401?text='+encodeURIComponent(enquiryMessage);enquiry.textContent='Enquire on WhatsApp ↗';enquiry.setAttribute('aria-label','Enquire about '+p.name+' on WhatsApp');
  actions.append(itinerary,enquiry);body.append(location,heading,duration,actions);card.append(image,body);box.append(card);
 }
 if(!exact.length){
  const content=document.createElement('div');content.className='search-custom-enquiry-content';
  const heading=document.createElement('h3');heading.textContent='No exact match found for your search.';
  const prompt=document.createElement('p');prompt.className='custom-enquiry-copy';prompt.textContent='We can customise a holiday itinerary based on your destination, travel dates, duration and preferences.';
  content.append(heading,prompt);custom.append(content,makeCustomEnquiry(destination,category,month,nights));custom.hidden=false;
  alternativesHeading.hidden=alternatives.length===0;
 }
});
document.getElementById('holiday-reset').addEventListener('click',()=>{for(const id of ['holiday-destination','holiday-category','holiday-month','holiday-duration'])document.getElementById(id).value='';document.getElementById('search-results').replaceChildren();document.getElementById('search-custom-enquiry').replaceChildren();document.getElementById('search-custom-enquiry').hidden=true;document.getElementById('search-alternatives-heading').hidden=true;document.getElementById('search-results-region').hidden=true;document.getElementById('search-status').textContent='Filters cleared. Choose preferences to explore the catalogue.';document.getElementById('holiday-destination').focus();});

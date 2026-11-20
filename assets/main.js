(() => {
  'use strict';
  const config = window.MODI_HOLIDAYS_CONFIG || {};
  const intakeEndpoint = (() => {
    try {
      const endpoint = new URL(String(config.publicEnquiryEndpoint || ''));
      if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/api/public/enquiries') return '';
      return endpoint.href;
    } catch { return ''; }
  })();
  const configuredNumber = String(config.whatsappNumber || '');
  // The confirmed public business number remains usable if config.js fails to load.
  const number = /^[1-9]\d{9,14}$/.test(configuredNumber) ? configuredNumber : '917666018401';
  const makeUrl = message => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  const status = document.querySelector('#form-status');
  document.querySelectorAll('[data-whatsapp]').forEach(el => {
    el.href = makeUrl(el.dataset.message || config.defaultMessage || 'Hello Modi Holidays.');
    el.removeAttribute('target');
  });
  document.querySelectorAll('[data-contact-status]').forEach(el => el.textContent = 'Your message is sent only after you press Send in WhatsApp.');
  document.querySelectorAll('[data-year],[data-current-year]').forEach(el => el.textContent = new Date().getFullYear());
  document.querySelectorAll('[data-email]').forEach(el => {
    el.textContent = config.businessEmail || 'Email setup pending';
    if (config.businessEmail) el.href = 'mailto:' + config.businessEmail;
    else el.removeAttribute('href');
  });
  document.querySelectorAll('[data-phone]').forEach(el => el.textContent = config.businessPhoneDisplay || 'Phone setup pending');
  document.querySelectorAll('[data-location]').forEach(el => el.textContent = config.baseLocation || 'Business location setup pending');

  const nav = document.querySelector('.nav'), toggle = document.querySelector('.menu-toggle');
  const closeDestinations = () => document.querySelectorAll('.destination-toggle').forEach(button => {
    button.setAttribute('aria-expanded', 'false'); button.parentElement.classList.remove('is-expanded');
  });
  if (nav && toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    });
    document.querySelectorAll('.destination-toggle').forEach(button => button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true'; closeDestinations();
      button.setAttribute('aria-expanded', String(open)); button.parentElement.classList.toggle('is-expanded', open);
    }));
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const expanded = document.querySelector('.destination-toggle[aria-expanded="true"]');
      closeDestinations();
      if (expanded) expanded.focus();
      else {nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.focus();}
    });
    document.addEventListener('click', event => { if (!event.target.closest('.nav-dropdown')) closeDestinations(); });
    const current = window.location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('a').forEach(a => {
      if (a.getAttribute('href').split('?')[0].split('/').pop() === current) a.setAttribute('aria-current', 'page');
    });
  }
  const form = document.querySelector('#holiday-enquiry-form');
  if (!form) return;
  const selected = new URLSearchParams(location.search).get('destination');
  if (selected && form.elements.destination) {
    const field = form.elements.destination;
    if (field.tagName === 'SELECT') {
      const option = new Option(selected, selected, true, true);field.add(option);
    } else field.value = selected;
  }
  let captchaToken = '', captchaWidget;
  let lastSubmission = '', submissionKey = '';
  const intakeReady = !!intakeEndpoint && !!config.turnstileSiteKey;
  if (intakeReady) {
    const consentLabel = document.createElement('label'); consentLabel.className = 'form-consent';
    const consent = document.createElement('input'); consent.type = 'checkbox'; consent.name = 'crmConsent'; consent.value = 'yes';
    const consentText = document.createElement('span'); consentText.textContent = 'Also save my enquiry securely for Modi Holidays to follow up. This is optional; WhatsApp messages are sent separately.';
    consentLabel.append(consent, consentText);
    form.querySelector('button[type="submit"]').before(consentLabel);
    const honey = document.createElement('input'); honey.name = 'website'; honey.type = 'text'; honey.tabIndex = -1; honey.autocomplete = 'off'; honey.hidden = true; form.append(honey);
    const box = document.createElement('div'); form.querySelector('button[type="submit"]').before(box);
    const script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true;
    script.onload = () => { captchaWidget = window.turnstile.render(box, {sitekey: config.turnstileSiteKey, action: 'enquiry', callback: token => {captchaToken = token;}, 'expired-callback': () => {captchaToken = '';}}); };
    script.onerror = () => {if (status) status.textContent = 'Enquiry verification could not load. You can still prepare a WhatsApp message.';}; document.head.append(script);
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    let intakeStatus = '', crmSaved = false;
    if (intakeReady && data.get('crmConsent') === 'yes' && captchaToken) {
      const payload = Object.fromEntries(['name','phone','email','destination','departureCity','travelDates','adults','children','budget','preferences','website'].map(key => [key, String(data.get(key) || '')]));
      const fingerprint = JSON.stringify(payload);
      if (lastSubmission !== fingerprint) { submissionKey = crypto.randomUUID(); lastSubmission = fingerprint; }
      const submit = form.querySelector('button[type="submit"]'); submit.disabled = true;
      if (status) status.textContent = 'Saving your enquiry securely…';
      try {
        const response = await fetch(intakeEndpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...payload,idempotencyKey:submissionKey,captchaToken}),signal:AbortSignal.timeout(15000)});
        const result = await response.json();
        if (!response.ok || result.ok !== true || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result.enquiryId || '')) throw Error(result.error || 'Database intake failed');
        crmSaved = true;
        intakeStatus = 'Your enquiry was saved for the Modi Holidays team. ';
      } catch {intakeStatus = 'We could not confirm that the enquiry was saved. Nothing is confirmed as saved. You can retry or continue with WhatsApp below. ';}
      finally {submit.disabled = false; captchaToken = ''; if (window.turnstile && captchaWidget !== undefined) window.turnstile.reset(captchaWidget);}
    } else if (intakeReady) intakeStatus = data.get('crmConsent') === 'yes' ? 'Complete the verification to save your enquiry, or send the prepared message manually through WhatsApp. Nothing has been saved. ' : 'You have not opted to save this enquiry. Nothing has been saved. ';
    const fields = [['Name','name'],['Mobile','phone'],['Email','email'],['Destination / package','destination'],['Travel dates','travelDates'],['Adults','adults'],['Children','children'],['Departure city','departureCity'],['Budget per person','budget'],['Special requirements','preferences']];
    const message = 'Hello Modi Holidays, please prepare a personalised quote.\n\n' + fields.map(([label,key]) => `${label}: ${String(data.get(key)||'Not specified').trim()}`).join('\n') + '\n\nPlease confirm availability and arrangements in writing.';
    let link = document.getElementById('prepared-enquiry');
    if (!link) {link = document.createElement('a');link.id='prepared-enquiry';link.className='btn btn-outline-dark';status.after(link);}
    link.removeAttribute('target');
    link.href = makeUrl(message);link.textContent = 'Open WhatsApp if it did not open ↗';
    let opened = null;
    try { opened = window.open(link.href, '_blank'); if (opened) opened.opener = null; } catch {}
    status.textContent = intakeStatus + (opened ? 'WhatsApp opened with your message. Review it there and press Send.' : 'Your WhatsApp message is ready, but the browser did not open it. Use the link below and press Send in WhatsApp.') + (!crmSaved ? (intakeReady ? ' This website has not confirmed a CRM save.' : ' Nothing has been sent or saved by this website.') : ' WhatsApp is optional; no booking is confirmed.');
    link.focus();
  });
  form.querySelector('button[type="submit"]').disabled = false;
})();

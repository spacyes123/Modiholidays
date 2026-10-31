(() => {
  'use strict';
  const config = window.MODI_HOLIDAYS_CONFIG || {};
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
  const intakeReady = config.publicEnquiryEndpoint === '/api/public/enquiries' && !!config.turnstileSiteKey;
  if (intakeReady) {
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
    let intakeStatus = '';
    if (intakeReady && captchaToken) {
      const payload = Object.fromEntries(data.entries()); const fingerprint = JSON.stringify(payload);
      if (lastSubmission !== fingerprint) { submissionKey = crypto.randomUUID(); lastSubmission = fingerprint; }
      const submit = form.querySelector('button[type="submit"]'); submit.disabled = true;
      if (status) status.textContent = 'Saving your enquiry securely…';
      try {
        const response = await fetch(config.publicEnquiryEndpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...payload,idempotencyKey:submissionKey,captchaToken}),signal:AbortSignal.timeout(15000)});
        const result = await response.json();
        if (!response.ok || !result.ok) throw Error(result.error || 'Database intake failed');
        intakeStatus = 'Your enquiry was saved for the Modi Holidays team. ';
      } catch {intakeStatus = 'Database receipt was not confirmed. You can send the enquiry manually through WhatsApp below. ';}
      finally {submit.disabled = false; captchaToken = ''; if (window.turnstile && captchaWidget !== undefined) window.turnstile.reset(captchaWidget);}
    } else if (intakeReady) intakeStatus = 'Complete the verification to save to the database, or send the prepared message manually through WhatsApp. ';
    const fields = [['Name','name'],['Mobile','phone'],['Email','email'],['Destination / package','destination'],['Travel dates','travelDates'],['Adults','adults'],['Children','children'],['Departure city','departureCity'],['Budget per person','budget'],['Special requirements','preferences']];
    const message = 'Hello Modi Holidays, please prepare a personalised quote.\n\n' + fields.map(([label,key]) => `${label}: ${String(data.get(key)||'Not specified').trim()}`).join('\n') + '\n\nPlease confirm availability and arrangements in writing.';
    let link = document.getElementById('prepared-enquiry');
    if (!link) {link = document.createElement('a');link.id='prepared-enquiry';link.className='btn btn-primary';status.after(link);}
    // A native same-tab anchor works in mobile/in-app browsers without popup permissions.
    link.removeAttribute('target');
    link.href = makeUrl(message);link.textContent = 'Open WhatsApp with my enquiry ↗';
    status.textContent = intakeStatus + 'Your WhatsApp message is ready. Open WhatsApp below and press Send to send it.' + (!intakeReady ? ' Nothing has been sent or saved by this website.' : ' No booking is confirmed.');
    link.focus();
  });
  form.querySelector('button[type="submit"]').disabled = false;
})();

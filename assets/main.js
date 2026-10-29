(() => {
  'use strict';
  const config = window.MODI_HOLIDAYS_CONFIG || {};
  const number = String(config.whatsappNumber || '');
  const ready = /^[1-9]\d{9,14}$/.test(number);
  const makeUrl = message => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  const status = document.querySelector('#form-status');
  function notice(text) {
    let el = document.getElementById('contact-notice');
    if (!el) {
      el = document.createElement('p');
      el.id = 'contact-notice'; el.className = 'contact-notice'; el.setAttribute('role', 'status');
      document.body.append(el);
    }
    el.textContent = text;
  }
  document.querySelectorAll('[data-whatsapp]').forEach(el => {
    if (ready) el.href = makeUrl(el.dataset.message || config.defaultMessage || 'Hello Modi Holidays.');
    else {
      el.removeAttribute('href'); el.setAttribute('role', 'button'); el.tabIndex = 0;
      el.setAttribute('aria-disabled', 'true'); el.title = 'Business WhatsApp setup pending';
      el.setAttribute('aria-label', 'WhatsApp enquiry — business number setup pending');
      el.addEventListener('click', event => { event.preventDefault(); notice('WhatsApp enquiries are not available yet. The business number must be configured before launch.'); });
      el.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();el.click();} });
    }
  });
  document.querySelectorAll('[data-contact-status]').forEach(el => el.textContent = ready ? 'Your message is sent only after you press Send in WhatsApp.' : 'WhatsApp setup pending. Online enquiries are not operational yet.');
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
  if (!ready && status) status.textContent = 'Enquiry setup pending: the business WhatsApp number has not been configured. This form cannot send yet.';
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!ready) {status.textContent = 'Your enquiry has not been sent. The business must configure WhatsApp before launch. Please keep your details and try again once contact details are available.';return;}
    const data = new FormData(form);
    const fields = [['Name','name'],['Mobile','phone'],['Email','email'],['Destination / package','destination'],['Travel dates','travelDates'],['Adults','adults'],['Children','children'],['Departure city','departureCity'],['Budget per person','budget'],['Special requirements','preferences']];
    const message = 'Hello Modi Holidays, please prepare a personalised quote.\n\n' + fields.map(([label,key]) => `${label}: ${String(data.get(key)||'Not specified').trim()}`).join('\n') + '\n\nPlease confirm availability and arrangements in writing.';
    let link = document.getElementById('prepared-enquiry');
    if (!link) {link = document.createElement('a');link.id='prepared-enquiry';link.className='btn btn-primary';link.target='_blank';link.rel='noopener noreferrer';status.after(link);}
    link.href = makeUrl(message);link.textContent = 'Open WhatsApp with my enquiry ↗';
    status.textContent = 'Your message is ready. Open WhatsApp below and press Send to submit. Nothing has been sent or saved by this website.';
    link.focus();
  });
})();

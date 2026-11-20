#!/usr/bin/env node
'use strict';

// Applies safe, catalogue-derived SEO refinements to generated public pages.
// It deliberately never rebuilds package content or touches admin-app/admin.html.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DOMAIN = 'https://modiholidays.in';
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/packages.json'), 'utf8'));

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function packageTitle(pkg) {
  const full = `${pkg.name} | ${pkg.duration} | Modi Holidays`;
  return full.length <= 70 ? full : `${pkg.name} | Modi Holidays`;
}

function packageDescription(pkg) {
  const route = pkg.route || [];
  for (let count = Math.min(route.length, 4); count >= 1; count--) {
    const candidate = `${pkg.name} · ${pkg.duration} ${pkg.category.toLowerCase()} tour. Suggested route: ${route.slice(0, count).join(' · ')}. View itinerary and request a quote.`;
    // Leave room for HTML entities such as &amp; in package names.
    if (candidate.length <= 150) return candidate;
  }
  return `${pkg.name} · ${pkg.duration} ${pkg.category.toLowerCase()} itinerary. View itinerary and request a quote.`;
}

function packageFaq(pkg) {
  const route = (pkg.route || []).join(', ');
  return [
    {
      question: `How long is the ${pkg.name} itinerary?`,
      answer: `The suggested ${pkg.name} itinerary is ${pkg.duration}.`
    },
    {
      question: `Which places does the ${pkg.name} itinerary cover?`,
      answer: `The suggested route lists ${route}.`
    }
  ];
}

function normalizeImages(html, file) {
  const prefix = file.startsWith('tours/') ? '../' : '';
  return html.replace(/<img\b[^>]*>/gi, tag => {
    const className = tag.match(/\bclass="([^"]*)"/i)?.[1] || '';
    const isHeaderLogo = className.split(/\s+/).includes('brand-artwork');
    const isFooterLogo = className.split(/\s+/).includes('footer-brand');
    if (isHeaderLogo || isFooterLogo) {
      const variant = isFooterLogo ? 'dark' : 'light';
      const src = `${prefix}assets/brand/approved/modi-holidays-logo-${variant}-background.png`;
      let updated = tag.replace(/\bsrc="[^"]*"/i, `src="${src}"`);
      updated = updated.replace(/\s+srcset="[^"]*"/i, '');
      updated = updated.replace(/\s+width="[^"]*"/i, '').replace(/\s+height="[^"]*"/i, '');
      return updated.replace(/>$/, ' width="2077" height="724">');
    }
    const src = tag.match(/\bsrc="([^"]+)"/i)?.[1] || '';
    if (!/assets\/photos\/.*\.webp(?:\?|$)/i.test(src)) return tag;
    let updated = tag;
    if (!/\bwidth\s*=/.test(updated)) updated = updated.replace(/>$/, ' width="1280">');
    if (!/\bheight\s*=/.test(updated)) updated = updated.replace(/>$/, ' height="850">');
    if (!/\bloading\s*=/.test(updated) && !/\bfetchpriority\s*=/.test(updated)) updated = updated.replace(/>$/, ' loading="lazy">');
    return updated;
  });
}

function patchTour(pkg) {
  const file = path.join(ROOT, 'tours', `${pkg.slug}.html`);
  if (!fs.existsSync(file)) throw new Error(`Missing public tour page: ${pkg.id}`);
  let html = normalizeImages(fs.readFileSync(file, 'utf8'), `tours/${pkg.slug}.html`);
  const title = escapeHtml(packageTitle(pkg));
  const description = escapeHtml(packageDescription(pkg));
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/i, `$1${description}$2`);
  html = html.replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/i, `$1${title}$2`);
  html = html.replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/i, `$1${description}$2`);

  const faqs = packageFaq(pkg);
  const faqMarkup = `<h2>Frequently asked questions</h2>${faqs.map(faq => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`).join('')}`;
  const faqSection = /<h2>Frequently asked questions<\/h2>[\s\S]*?(?=<\/article>)/i;
  if (!faqSection.test(html)) throw new Error(`FAQ section not found for ${pkg.id}`);
  html = html.replace(faqSection, faqMarkup);

  const jsonLd = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i;
  const match = html.match(jsonLd);
  if (!match) throw new Error(`Tour JSON-LD not found for ${pkg.id}`);
  const graph = JSON.parse(match[1]);
  const faqNode = graph['@graph']?.find(node => node['@type'] === 'FAQPage');
  if (!faqNode) throw new Error(`FAQPage JSON-LD not found for ${pkg.id}`);
  faqNode.mainEntity = faqs.map(faq => ({
    '@type': 'Question', name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer }
  }));
  html = html.replace(jsonLd, `<script type="application/ld+json">${JSON.stringify(graph)}</script>`);
  fs.writeFileSync(file, html, 'utf8');
}

function ensureNoindex(file) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');
  if (/<meta\s+name="robots"/i.test(html)) {
    html = html.replace(/<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="noindex, nofollow">');
  } else {
    html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>');
  }
  fs.writeFileSync(full, html, 'utf8');
}

function setDescription(file, description) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');
  const value = escapeHtml(description);
  html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/i, `$1${value}$2`);
  html = html.replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/i, `$1${value}$2`);
  fs.writeFileSync(full, html, 'utf8');
}

function syncCollectionPageSchema() {
  const file = path.join(ROOT, 'packages.html');
  let html = fs.readFileSync(file, 'utf8');
  const expected = {
    name: 'All holiday packages',
    description: 'Discover routes worth travelling. Choose a destination, explore a day-by-day itinerary and ask us to tailor the details to you.'
  };
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  const pattern = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i;
  const match = html.match(pattern);
  if (!canonical || !match) throw new Error('CollectionPage JSON-LD or canonical missing from packages.html');
  const schema = JSON.parse(match[1]);
  if (schema['@type'] !== 'CollectionPage') throw new Error('Expected CollectionPage JSON-LD on packages.html');
  schema.name = expected.name;
  schema.description = expected.description;
  schema.url = canonical;
  html = html.replace(pattern, `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
  fs.writeFileSync(file, html, 'utf8');
}

function ensureOrganizationSchema() {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('"@type":"Organization"')) return;
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${DOMAIN}/#organization`,
    name: 'Modi Holidays',
    url: `${DOMAIN}/`,
    description: 'Domestic, international, family, group and customised tour planning. Enquiries are handled by staff and travel arrangements are confirmed in writing.',
    foundingDate: '2009',
    logo: `${DOMAIN}/assets/brand/approved/modi-holidays-logo-light-background.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91 76660 18401',
      email: 'modiholidays15@gmail.com',
      contactType: 'customer enquiries'
    }
  };
  html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(organization)}</script></head>`);
  fs.writeFileSync(file, html, 'utf8');
}

function preparePlannerFaq() {
  const faqs = [
    {
      question: 'Can a family customise a tour itinerary?',
      answer: 'Yes. Share your preferred dates, destination interests, traveller ages and preferred pace. Modi Holidays can prepare a tailored proposal for you to review.'
    },
    {
      question: 'How do I request a quotation?',
      answer: 'Complete the enquiry form or contact Modi Holidays on WhatsApp. Your message is sent only when you choose Send in WhatsApp; staff can then review the details and prepare a written quotation.'
    },
    {
      question: 'Does an enquiry confirm a booking or price?',
      answer: 'No. An enquiry is not a booking. Availability, price, itinerary and terms are confirmed by Modi Holidays in writing.'
    }
  ];
  const file = path.join(ROOT, 'plan-my-holiday.html');
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('id="planning-questions"')) {
    const markup = `<section class="section section-soft" id="planning-questions"><div class="container"><p class="kicker">Before you enquire</p><h2>Planning questions</h2>${faqs.map(faq => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`).join('')}</div></section>`;
    html = html.replace('</main>', `${markup}</main>`);
  }
  if (!html.includes('"@type":"FAQPage"')) {
    const node = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) };
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(node)}</script></head>`);
  }
  fs.writeFileSync(file, html, 'utf8');
}

function ensureTemplateNoindex() {
  ensureNoindex('404.html');
  ensureNoindex('package.html');
  // This page still contains template placeholders and is not publication-ready.
  ensureNoindex('privacy.html');
}

function alignSocialUrls() {
  const files = [
    ...fs.readdirSync(ROOT).filter(name => name.endsWith('.html') && name !== 'admin.html' && name !== 'homepage-prototype.html'),
    ...data.filter(pkg => pkg.published !== false).map(pkg => `tours/${pkg.slug}.html`)
  ];
  for (const name of files) {
    const file = path.join(ROOT, name);
    let html = fs.readFileSync(file, 'utf8');
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
    if (!canonical) continue;
    html = html.replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/i, `$1${canonical}$2`);
    fs.writeFileSync(file, html, 'utf8');
  }
}

function rebuildSitemap() {
  const excluded = new Set(['admin.html', '404.html', 'homepage-prototype.html', 'package.html']);
  const candidates = fs.readdirSync(ROOT).filter(name => name.endsWith('.html') && !excluded.has(name));
  const urls = new Set();
  for (const name of candidates) {
    const html = fs.readFileSync(path.join(ROOT, name), 'utf8');
    if (/name="robots"\s+content="[^"]*noindex/i.test(html)) continue;
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
    if (canonical?.startsWith(`${DOMAIN}/`)) urls.add(canonical);
  }
  for (const pkg of data) {
    if (pkg.published === false) continue;
    const file = path.join(ROOT, 'tours', `${pkg.slug}.html`);
    const html = fs.readFileSync(file, 'utf8');
    if (/name="robots"\s+content="[^"]*noindex/i.test(html)) continue;
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
    if (canonical?.startsWith(`${DOMAIN}/`)) urls.add(canonical);
  }
  const body = [...urls].sort().map(url => `<url><loc>${escapeHtml(url)}</loc></url>`).join('\n');
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, 'utf8');
}

function optimize() {
  for (const name of fs.readdirSync(ROOT).filter(file => file.endsWith('.html') && !['admin.html', 'homepage-prototype.html'].includes(file))) {
    const file = path.join(ROOT, name);
    fs.writeFileSync(file, normalizeImages(fs.readFileSync(file, 'utf8'), name), 'utf8');
  }
  for (const pkg of data) if (pkg.published !== false) patchTour(pkg);
  ensureTemplateNoindex();
  setDescription('packages.html', 'Browse 140 domestic, international and pilgrimage tours. Review day-wise suggested routes and request a personalised quote. Details are confirmed in writing.');
  syncCollectionPageSchema();
  ensureOrganizationSchema();
  preparePlannerFaq();
  alignSocialUrls();
  rebuildSitemap();
  console.log(`SEO refinements applied to ${data.filter(pkg => pkg.published !== false).length} catalogue pages and the production sitemap.`);
}

if (require.main === module) optimize();

module.exports = { packageTitle, packageDescription, packageFaq, optimize };

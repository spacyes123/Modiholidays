'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildStagingArtifact } = require('./build-staging-artifact.cjs');
const { assemble: buildCloudflareArtifact } = require('./build-cloudflare-pages.cjs');

const ROOT = path.resolve(__dirname, '..');
const DOMAIN = 'https://modiholidays.in';
const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/packages.json'), 'utf8'));
const publicRootPages = fs.readdirSync(ROOT).filter(file => file.endsWith('.html') && !['admin.html', 'homepage-prototype.html'].includes(file));
const tourFiles = catalogue.filter(pkg => pkg.published !== false).map(pkg => path.join('tours', `${pkg.slug}.html`));
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const decodeHtml = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const physicalPageForUrl = value => {
  const pathname = decodeURIComponent(new URL(value).pathname).replace(/^\/+/, '');
  return path.join(ROOT, pathname ? `${pathname.replace(/\/$/, '')}.html` : 'index.html');
};

test('all published tour pages have unique concise metadata and exactly one H1', () => {
  assert.equal(tourFiles.length, 140);
  const titles = new Set();
  const descriptions = new Set();
  for (const file of tourFiles) {
    const html = read(file);
    const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
    const desc = decodeHtml(html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || '');
    assert.ok(title && title.length <= 70, `${file}: title missing or longer than 70 characters`);
    assert.ok(desc.length >= 110 && desc.length <= 160, `${file}: description length ${desc.length}`);
    assert.ok(!titles.has(title), `${file}: duplicate title`);
    assert.ok(!descriptions.has(desc), `${file}: duplicate description`);
    titles.add(title); descriptions.add(desc);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${file}: expected one H1`);
    assert.match(html, new RegExp(`<link\\s+rel="canonical"\\s+href="${DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/tours/`));
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
    assert.equal(html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i)?.[1], canonical, `${file}: og:url must match canonical`);
    assert.doesNotMatch(html, /₹|\bINR\s*\d/i, `${file}: public price found`);
    assert.match(html, /<img\b[^>]*\balt="[^"]+"/i, `${file}: image alt missing`);
    assert.match(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i, `${file}: JSON-LD missing`);
    const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)[1];
    const graph = JSON.parse(json);
    assert.ok(graph['@graph'].some(node => node['@type'] === 'TouristTrip'), `${file}: TouristTrip missing`);
    const faq = graph['@graph'].find(node => node['@type'] === 'FAQPage');
    assert.ok(faq?.mainEntity?.length >= 1, `${file}: factual FAQ data missing`);
    const pkg = catalogue.find(item => item.slug === path.basename(file, '.html'));
    const decoded = decodeHtml(html);
    for (const day of pkg.days) assert.ok(decoded.includes(day), `${file}: itinerary day changed`);
    for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(image[0], /\balt="[^"]+"/i, `${file}: image alt missing`);
      assert.match(image[0], /\bwidth="\d+"[^>]*\bheight="\d+"|\bheight="\d+"[^>]*\bwidth="\d+"/i, `${file}: image dimensions missing`);
    }
  }
});

test('public internal links and local image assets resolve', () => {
  const decodeAttr = value => decodeHtml(value).replaceAll('&nbsp;', ' ');
  for (const file of [...publicRootPages, ...tourFiles]) {
    const html = read(file);
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/gi)].map(match => decodeAttr(match[1])));
    assert.equal(ids.size, (html.match(/\bid="[^"]+"/gi) || []).length, `${file}: duplicate HTML IDs`);
    for (const tag of html.matchAll(/<(?:a|link|script|img)\b[^>]*>/gi)) {
      const targets = [];
      const direct = tag[0].match(/\b(?:href|src)="([^"]+)"/i)?.[1];
      if (direct) targets.push(direct);
      const srcset = tag[0].match(/\bsrcset="([^"]+)"/i)?.[1];
      if (srcset) for (const item of srcset.split(',')) targets.push(item.trim().split(/\s+/)[0]);
      for (const rawTarget of targets) {
        if (/^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(rawTarget)) continue;
        const url = new URL(decodeAttr(rawTarget), `https://local.invalid/${file}`);
        const relative = decodeURIComponent(url.pathname.replace(/^\//, '')) || 'index.html';
        const resolved = path.resolve(ROOT, relative);
        assert.ok(resolved.startsWith(`${ROOT}${path.sep}`) || resolved === path.join(ROOT, 'index.html'), `${file}: path escapes site root: ${rawTarget}`);
        const withHtml = !path.extname(resolved) && fs.existsSync(`${resolved}.html`) ? `${resolved}.html` : resolved;
        const candidate = fs.existsSync(withHtml) && fs.statSync(withHtml).isDirectory() ? path.join(withHtml, 'index.html') : withHtml;
        assert.ok(fs.existsSync(candidate), `${file}: missing local target ${rawTarget}`);
        if (url.hash && candidate.endsWith('.html')) {
          const targetHtml = candidate === path.join(ROOT, file) ? html : fs.readFileSync(candidate, 'utf8');
          const targetIds = new Set([...targetHtml.matchAll(/\bid="([^"]+)"/gi)].map(match => decodeAttr(match[1])));
          assert.ok(targetIds.has(decodeURIComponent(url.hash.slice(1))), `${file}: missing anchor ${rawTarget}`);
        }
      }
    }
  }
});

test('production sitemap includes only indexable self-canonical public URLs', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(urls.length, new Set(urls).size, 'duplicate sitemap URL');
  assert.equal(urls.length, 149, 'expected nine indexable static pages plus 140 tour pages');
  assert.ok(!urls.some(url => /terms\.html|cancellation\.html|privacy\.html|package\.html|404\.html|admin\.html/.test(url)));
  const titles = new Set();
  const descriptions = new Set();
  for (const pkg of catalogue) assert.ok(urls.includes(`${DOMAIN}/tours/${pkg.slug}`), `package missing from sitemap: ${pkg.slug}`);
  for (const url of urls) {
    assert.ok(url.startsWith(`${DOMAIN}/`), `non-production canonical in sitemap: ${url}`);
    assert.doesNotMatch(new URL(url).pathname, /\.html$/i, `sitemap URL redirects from .html: ${url}`);
    const html = fs.readFileSync(physicalPageForUrl(url), 'utf8');
    assert.ok(!/name="robots"\s+content="[^"]*noindex/i.test(html), `noindex URL listed: ${url}`);
    assert.equal(html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1], url, `canonical mismatch: ${url}`);
    assert.equal(html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i)?.[1], url, `social URL mismatch: ${url}`);
    const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
    const description = decodeHtml(html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || '');
    assert.ok(!titles.has(title), `duplicate indexable title: ${title}`);
    assert.ok(!descriptions.has(description), `duplicate indexable description: ${description}`);
    titles.add(title); descriptions.add(description);
  }
  assert.match(read('terms.html'), /NOT APPROVED, ACTIVE OR EFFECTIVE/);
  assert.match(read('cancellation.html'), /NOT APPROVED, ACTIVE OR EFFECTIVE/);
  assert.match(read('privacy.html'), /name="robots" content="noindex, nofollow"/);
  assert.match(read('packages.html'), /<meta name="description" content="Browse 140 domestic, international and pilgrimage tours\./);
});

test('published canonicals, internal links and structured URLs use Cloudflare extensionless routes', () => {
  const sitemap = read('sitemap.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  const publicPaths = new Set(urls.map(value => new URL(value).pathname));
  const normalizeRoute = value => {
    try {
      const url = new URL(value, `${DOMAIN}/`);
      if (url.origin !== DOMAIN) return null;
      return decodeURIComponent(url.pathname).replace(/\.html$/i, '') || '/';
    } catch {
      return null;
    }
  };
  const visitStrings = (value, visit) => {
    if (typeof value === 'string') visit(value);
    else if (Array.isArray(value)) value.forEach(item => visitStrings(item, visit));
    else if (value && typeof value === 'object') Object.values(value).forEach(item => visitStrings(item, visit));
  };

  for (const value of urls) {
    const html = fs.readFileSync(physicalPageForUrl(value), 'utf8');
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
    assert.equal(canonical, value, `canonical mismatch for ${value}`);
    const current = new URL(canonical);

    for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
      const href = decodeHtml(match[1]);
      const target = new URL(href, current);
      if (target.origin === DOMAIN && publicPaths.has(target.pathname)) {
        assert.doesNotMatch(target.pathname, /\.html$/i, `internal link still redirects: ${value} -> ${href}`);
      }
    }

    for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      visitStrings(JSON.parse(match[1]), schemaUrl => {
        const route = normalizeRoute(schemaUrl);
        if (route && publicPaths.has(route)) {
          assert.doesNotMatch(new URL(schemaUrl).pathname, /\.html$/i, `structured URL still redirects on ${value}: ${schemaUrl}`);
        }
      });
    }
  }

  const home = read('index.html');
  assert.match(home, /href="(?:#|\/#)worlds"/, 'homepage section anchor remains intact');
  assert.match(home, /id="worlds"/, 'homepage anchor target remains intact');
  const tour = read('tours/andaman-island-escape-mh-009.html');
  assert.match(tour, /href="\/domestic-holidays\?destination=Andaman"/, 'destination-filter query is preserved');
  const quote = tour.match(/<a class="btn btn-primary" href="([^"]+)"[^>]*>Request a quote/i)?.[1];
  assert.ok(quote, 'tour quote link exists');
  const quoteUrl = new URL(quote, `${DOMAIN}/tours/andaman-island-escape-mh-009`);
  assert.equal(quoteUrl.pathname, '/plan-my-holiday');
  assert.equal(quoteUrl.searchParams.get('destination'), 'Andaman Island Escape');
});

test('client-generated tour navigation uses extensionless URLs', () => {
  const searchScript = read('assets/bespoke/prototype.js');
  const legacyRedirect = read('assets/package-redirect.js');
  assert.match(searchScript, /itinerary\.href='\/tours\/'\+p\.slug/);
  assert.doesNotMatch(searchScript, /itinerary\.href=[^;]*\.html/);
  assert.match(legacyRedirect, /location\.replace\('\/tours\/'\s*\+/);
  assert.doesNotMatch(legacyRedirect, /p\.slug\)\s*\+\s*['"]\.html/);
});

test('package collection schema matches the visible heading, introduction and canonical', () => {
  const html = read('packages.html');
  const hero = html.match(/<section class="page-hero">([\s\S]*?)<\/section>/i)?.[1] || '';
  const h1 = decodeHtml(hero.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]+>/g, '').trim();
  const intro = decodeHtml(hero.match(/<h1\b[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '').replace(/<[^>]+>/g, '').trim();
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  const collection = json && JSON.parse(json);
  assert.equal(collection?.['@type'], 'CollectionPage');
  assert.equal(collection.name, h1);
  assert.equal(collection.description, intro);
  assert.equal(collection.url, canonical);
});

test('homepage has consistent verified organization identity without invented street address', () => {
  const html = read('index.html');
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  const nodes = scripts.map(match => JSON.parse(match[1]));
  const organization = nodes.find(node => node['@type'] === 'Organization');
  assert.ok(organization, 'Organization schema missing from homepage');
  assert.equal(organization.name, 'Modi Holidays');
  assert.equal(organization.foundingDate, '2009');
  assert.equal(organization.contactPoint.telephone, '+91 76660 18401');
  assert.equal(organization.contactPoint.email, 'modiholidays15@gmail.com');
  assert.ok(!organization.address, 'no verified street address is available');
});

test('public page metadata, image sizing and source records are complete', () => {
  const pages = [...publicRootPages, ...tourFiles];
  for (const file of pages) {
    const html = read(file);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${file}: expected one primary H1`);
    assert.match(html, /<title>[\s\S]+<\/title>/i, `${file}: title missing`);
    assert.match(html, /<meta\s+name="description"\s+content="[^"]{40,}"/i, `${file}: description missing`);
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
    assert.ok(canonical?.startsWith(`${DOMAIN}/`), `${file}: production canonical missing`);
    assert.equal(html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i)?.[1], canonical, `${file}: social URL mismatch`);
    for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(image[0], /\balt="[^"]+"/i, `${file}: missing image alt`);
      assert.match(image[0], /\bwidth="\d+"[^>]*\bheight="\d+"|\bheight="\d+"[^>]*\bwidth="\d+"/i, `${file}: missing intrinsic dimensions`);
    }
  }
  const manifest = JSON.parse(read('assets/image-manifest.json'));
  assert.equal(Object.keys(manifest).length, 140);
  for (const entry of Object.values(manifest)) {
    assert.ok(entry.source && entry.license && entry.author, 'photo source/licence/author missing');
    for (const key of ['image', 'small']) assert.ok(fs.existsSync(path.join(ROOT, entry[key])), `missing image asset ${entry[key]}`);
  }
});

test('answer-oriented planner FAQs are visible and match their structured data', () => {
  const html = read('plan-my-holiday.html');
  assert.match(html, /Can a family customise a tour itinerary\?/);
  assert.match(html, /How do I request a quotation\?/);
  assert.match(html, /Does an enquiry confirm a booking or price\?/);
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  const faq = JSON.parse(json);
  assert.equal(faq['@type'], 'FAQPage');
  assert.equal(faq.mainEntity.length, 3);
});

test('staging artifact stays crawlable for noindex discovery and omits private/non-staging files', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'modi-seo-test-'));
  const output = path.join(temp, 'staging');
  try {
    buildStagingArtifact(output);
    assert.ok(fs.existsSync(path.join(output, 'index.html')));
    assert.ok(!fs.existsSync(path.join(output, 'admin.html')));
    assert.ok(!fs.existsSync(path.join(output, 'admin-app')));
    assert.ok(!fs.existsSync(path.join(output, 'CNAME')));
    assert.ok(!fs.existsSync(path.join(output, 'sitemap.xml')));
    assert.match(fs.readFileSync(path.join(output, 'robots.txt'), 'utf8'), /Allow: \/\n/);
    assert.match(fs.readFileSync(path.join(output, '_headers'), 'utf8'), /X-Robots-Tag: noindex, nofollow, noarchive/);
    const artifactFiles = [];
    const collect = directory => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) collect(file);
        else artifactFiles.push(file);
      }
    };
    collect(output);
    for (const file of artifactFiles) {
      const relative = path.relative(output, file);
      assert.doesNotMatch(relative, /(^|[\\/])admin-app([\\/]|$)|(^|[\\/])\.env[^\\/]*|\.(?:pem|key|sql|db|sqlite|md)$/i, `private file in staging artifact: ${relative}`);
      if (/\.(?:html|js|json|txt)$/i.test(file)) {
        assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /SUPABASE_SERVICE_ROLE_KEY|TURNSTILE_SECRET_KEY|INGRESS_SECRET|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i, `secret marker in staging artifact: ${relative}`);
      }
    }
    for (const file of ['index.html', 'about.html', 'terms.html', 'tours/ajanta-ellora-heritage-mh-064.html']) {
      assert.match(fs.readFileSync(path.join(output, file), 'utf8'), /<meta name="robots" content="noindex, nofollow">/);
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('Cloudflare production artifact excludes admin, private files, inactive policies and uncleared review photos', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'modi-cloudflare-test-'));
  const output = path.join(temp, 'dist');
  try {
    const headers = fs.readFileSync(path.join(__dirname, '../_headers'), 'utf8');
    assert.match(headers, /^https:\/\/modi-holidays-staging\.pages\.dev\/\*\s+X-Robots-Tag: noindex/m);
    assert.match(headers, /^https:\/\/:deployment\.modi-holidays-staging\.pages\.dev\/\*\s+X-Robots-Tag: noindex/m);
    assert.doesNotMatch(headers, /modiholidays\.in/i, 'staging noindex rules must not match production');
    const result = buildCloudflareArtifact(output);
    assert.equal(result.tourPages, 140);
    assert.equal(result.sitemapUrls, 149);
    for (const file of ['admin.html', 'terms.html', 'cancellation.html', 'privacy.html', 'CNAME']) {
      assert.ok(!fs.existsSync(path.join(output, file)), `${file} must not be published`);
    }
    assert.ok(!fs.existsSync(path.join(output, 'admin-app')));
    assert.equal(fs.readFileSync(path.join(output, '_headers'), 'utf8'), headers, 'Cloudflare artifact must include staging-only response headers');
    for (const file of [
      'assets/bespoke/f89b15baf6d11ede.webp',
      'assets/bespoke/e0c10fecd0a1d461.webp',
      'assets/bespoke/8a5168c0a0034d70.webp',
      'assets/bespoke/543917baf6ca7c4b.webp',
      'assets/bespoke/f27ed012b0617351.webp',
      'assets/bespoke/73b13e168af9ad70.webp',
      'assets/bespoke/fa0f3652c190474d.webp',
    ]) {
      assert.ok(!fs.existsSync(path.join(output, file)), `${file} is uncleared review imagery and must not be published`);
    }
    assert.ok(fs.existsSync(path.join(output, 'assets/bespoke/d3ecc59c78c187be.webp')), 'approved hero artwork must remain in the public artifact');
    for (const file of ['index.html', 'about.html', 'contact.html', 'plan-my-holiday.html', 'tours/ajanta-ellora-heritage-mh-064.html']) {
      assert.ok(fs.existsSync(path.join(output, file)), `${file} must remain in the public artifact`);
      const html = fs.readFileSync(path.join(output, file), 'utf8');
      assert.doesNotMatch(html, /href=["'](?:\.\.\/)?(?:terms|cancellation|privacy)\.html(?:[?#][^"']*)?["']/i);
    }
    assert.equal(fs.existsSync(path.join(output, 'sitemap.xml')), true);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

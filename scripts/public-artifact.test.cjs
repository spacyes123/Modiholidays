'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const dist = process.env.MH_PUBLIC_ARTIFACT_DIR || path.join(root, 'dist');
const packages = JSON.parse(fs.readFileSync(path.join(dist, 'assets/packages.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const uncleared = [
  'f89b15baf6d11ede.webp', 'e0c10fecd0a1d461.webp', '8a5168c0a0034d70.webp',
  '543917baf6ca7c4b.webp', 'f27ed012b0617351.webp', '73b13e168af9ad70.webp',
  'fa0f3652c190474d.webp'
];

function filesBelow(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const relative = path.posix.join(prefix, entry.name);
    return entry.isDirectory() ? filesBelow(path.join(dir, entry.name), relative) : [relative];
  });
}

test('Cloudflare artifact contains all published catalogue pages and approved homepage', () => {
  assert.ok(fs.existsSync(dist), 'run build-cloudflare-pages.cjs before artifact tests');
  const tourFiles = filesBelow(path.join(dist, 'tours')).filter(name => name.endsWith('.html'));
  const published = packages.filter(pkg => pkg.published !== false);
  assert.equal(published.length, 140);
  assert.equal(tourFiles.length, 140);
  for (const pkg of published) {
    assert.ok(tourFiles.includes(`${pkg.slug}.html`), `missing tour page ${pkg.slug}`);
    assert.ok(fs.existsSync(path.join(dist, pkg.image)), `missing catalogue photograph ${pkg.image}`);
  }
  const homepage = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const visibleHomepageText = homepage.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  assert.match(visibleHomepageText, /The World, Exceptionally Yours\./);
  assert.match(homepage, /assets\/bespoke\/d3ecc59c78c187be\.webp/);
  assert.match(homepage, /#55234B|#F39A24/i);
});

test('artifact contains 149 unique indexable sitemap URLs with canonical files', () => {
  assert.equal(urls.length, 149);
  assert.equal(new Set(urls).size, 149);
  for (const value of urls) {
    const url = new URL(value);
    assert.equal(url.origin, 'https://modiholidays.in');
    assert.doesNotMatch(url.pathname, /\.html$/i, `sitemap URL would redirect from .html: ${value}`);
    const relative = decodeURIComponent(url.pathname.replace(/^\//, '').replace(/\/$/, ''));
    const physicalPage = relative ? `${relative}.html` : 'index.html';
    const file = path.join(dist, physicalPage);
    assert.ok(fs.existsSync(file), `missing sitemap target ${value}`);
    const html = fs.readFileSync(file, 'utf8');
    assert.equal(html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1], value, `canonical mismatch ${value}`);
    assert.equal(html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i)?.[1], value, `Open Graph URL mismatch ${value}`);
    assert.doesNotMatch(html, /<meta\s+name=["']robots["'][^>]*noindex/i, `noindex sitemap page ${value}`);
    for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
      const href = match[1].replaceAll('&amp;', '&');
      const target = new URL(href, value);
      if (target.origin === url.origin && urls.some(item => new URL(item).pathname === target.pathname)) {
        assert.doesNotMatch(target.pathname, /\.html$/i, `internal link still redirects: ${value} -> ${href}`);
      }
    }
    for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      const visit = value => {
        if (typeof value === 'string' && value.startsWith('https://modiholidays.in/')) {
          const target = new URL(value);
          if (urls.some(item => new URL(item).pathname === target.pathname)) {
            assert.doesNotMatch(target.pathname, /\.html$/i, `structured URL still redirects: ${value}`);
          }
        } else if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') Object.values(value).forEach(visit);
      };
      visit(JSON.parse(match[1]));
    }
  }
  for (const pkg of packages.filter(item => item.published !== false)) {
    assert.ok(urls.includes(`https://modiholidays.in/tours/${pkg.slug}`), `sitemap missing ${pkg.slug}`);
  }
});

test('artifact excludes admin, private configuration, inactive policies and review material', () => {
  const files = filesBelow(dist).map(file => file.replaceAll('\\', '/'));
  assert.ok(!fs.existsSync(path.join(dist, 'admin.html')));
  assert.ok(!fs.existsSync(path.join(dist, 'admin-app')));
  assert.ok(!fs.existsSync(path.join(dist, 'CNAME')));
  for (const file of files) {
    assert.doesNotMatch(file, /(^|\/)(?:admin-app|owner-review-legal|private|secrets?|\.git|node_modules)(\/|$)/i);
    assert.doesNotMatch(path.basename(file), /^(?:\.env(?:\..*)?|.*(?:secret|credential|service[-_]?role).*)$/i);
    assert.doesNotMatch(file, /\.(?:pem|key|sql|db|sqlite|md)$/i);
  }
  for (const page of ['terms.html', 'cancellation.html', 'privacy.html', 'homepage-prototype.html']) {
    assert.ok(!fs.existsSync(path.join(dist, page)), `${page} must not be published`);
  }
  for (const filename of uncleared) assert.ok(!files.includes(`assets/bespoke/${filename}`), `${filename} must remain excluded`);
  assert.ok(files.includes('assets/bespoke/d3ecc59c78c187be.webp'), 'approved hero must remain');
  const searchScript = fs.readFileSync(path.join(dist, 'assets/bespoke/prototype.js'), 'utf8');
  const packageRedirect = fs.readFileSync(path.join(dist, 'assets/package-redirect.js'), 'utf8');
  assert.match(searchScript, /itinerary\.href='\/tours\/'\+p\.slug/);
  assert.doesNotMatch(searchScript, /itinerary\.href=[^;]*\.html/);
  assert.match(packageRedirect, /location\.replace\('\/tours\/'\s*\+/);
  for (const file of files.filter(name => /\.(?:html|js|json|txt)$/i.test(name))) {
    const contents = fs.readFileSync(path.join(dist, file), 'utf8');
    assert.doesNotMatch(contents, /SUPABASE_SERVICE_ROLE_KEY|TURNSTILE_SECRET_KEY|INGRESS_SECRET|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i, file);
    assert.doesNotMatch(contents, /href=["'](?:\.\.\/)?(?:terms|cancellation|privacy)\.html(?:[?#][^"']*)?["']/i, file);
  }
});

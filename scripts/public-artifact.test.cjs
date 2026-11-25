'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const forbiddenPhotoStems = [
  'f89b15baf6d11ede', 'e0c10fecd0a1d461', '8a5168c0a0034d70',
  '543917baf6ca7c4b', 'f27ed012b0617351', '73b13e168af9ad70',
  'fa0f3652c190474d'
];

function listFiles(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.posix.join(prefix, entry.name);
    return entry.isDirectory() ? listFiles(path.join(dir, entry.name), rel) : [rel];
  });
}

test('artifact contains only the reviewed public page set and all 140 tour pages', () => {
  assert.ok(fs.existsSync(dist), 'run build-public-artifact.cjs before tests');
  const rootFiles = fs.readdirSync(dist).filter((name) => fs.statSync(path.join(dist, name)).isFile()).sort();
  assert.deepEqual(rootFiles, [
    '.nojekyll', '404.html', 'about.html', 'contact.html', 'domestic-holidays.html',
    'group-tours.html', 'index.html', 'international-holidays.html', 'packages.html',
    'pilgrimage-tours.html', 'plan-my-holiday.html', 'robots.txt', 'sitemap.xml'
  ].sort());
  assert.equal(fs.readdirSync(path.join(dist, 'tours')).filter((name) => name.endsWith('.html')).length, 140);
});

test('artifact excludes administration, private configuration, CNAME, draft policies and review files', () => {
  const files = listFiles(dist).map((name) => name.replaceAll('\\', '/'));
  for (const file of files) {
    assert.doesNotMatch(file, /(^|\/)(?:admin\.html|admin-app|owner-review-legal|\.env(?:\.|$)|CNAME|node_modules|\.git)(?:\/|$)/i);
    assert.doesNotMatch(file, /(^|\/)(?:terms|privacy|cancellation)\.html$/i);
    assert.doesNotMatch(file, /(?:review|prototype|experimental)/i);
  }
  const textFiles = files.filter((file) => /\.(?:html|js|json|xml|txt|css|svg|webmanifest)$/i.test(file));
  for (const file of textFiles) {
    const text = fs.readFileSync(path.join(dist, file), 'utf8');
    assert.doesNotMatch(text, /(?:href|src)\s*=\s*["'][^"']*(?:terms|privacy|cancellation)\.html/i, file);
    assert.doesNotMatch(text, /(SUPABASE_SERVICE_ROLE|service_role[_ -]?key|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|TURNSTILE_SECRET_KEY)/i, file);
  }
});

test('current main hero and all catalogue images remain; seven uncleared photo stems are denied', () => {
  const hero = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  assert.match(hero, /assets\/photos\/mh-008\.webp/);
  for (const stem of forbiddenPhotoStems) {
    assert.ok(!listFiles(dist).some((file) => path.basename(file).toLowerCase().startsWith(stem)), `${stem} must stay excluded`);
  }
  const packages = JSON.parse(fs.readFileSync(path.join(dist, 'assets/packages.json'), 'utf8'));
  assert.equal(packages.filter((item) => item.published === true).length, 140);
  for (const item of packages) assert.ok(fs.existsSync(path.join(dist, item.image)), `missing catalogue image ${item.image}`);
  const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'assets/image-manifest.json'), 'utf8'));
  assert.equal(Object.keys(manifest).length, 140);
  for (const item of Object.values(manifest)) {
    assert.ok(fs.existsSync(path.join(dist, item.image)), `missing credited image ${item.image}`);
    assert.ok(fs.existsSync(path.join(dist, item.small)), `missing responsive image ${item.small}`);
  }
});

test('sitemap contains exactly the public indexable pages and resolves to built files', () => {
  const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
  assert.equal(urls.length, 149);
  assert.equal(new Set(urls.map((url) => url.href)).size, 149);
  for (const url of urls) {
    const rel = decodeURIComponent(url.pathname.replace(/^\//, '')) || 'index.html';
    const target = path.join(dist, rel);
    assert.ok(fs.existsSync(target), `sitemap target is missing: ${url.href}`);
    assert.doesNotMatch(url.pathname, /(?:terms|privacy|cancellation)\.html$/i);
    const html = fs.readFileSync(target, 'utf8');
    const canonicals = [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
    assert.equal(canonicals.length, 1, `${rel} must have exactly one canonical link`);
    assert.equal(new URL(canonicals[0][1]).origin, 'https://modiholidays.in', `${rel} canonical must use the approved domain`);
    assert.doesNotMatch(html, /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i, `${rel} must remain indexable`);
  }
});

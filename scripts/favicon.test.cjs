'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const brand = path.join(root, 'assets', 'brand');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);

function pageFile(route) {
  return route === '/' ? 'index.html' : `${decodeURIComponent(route.slice(1)).replace(/\/$/, '')}.html`;
}

test('all 149 published pages reference the new theme-aware favicon set', () => {
  assert.equal(routes.length, 149);
  assert.equal(new Set(routes).size, 149);

  for (const route of routes) {
    const file = path.join(root, pageFile(route));
    assert.ok(fs.existsSync(file), `Missing sitemap page ${route}`);
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<link\s+rel="icon"[^>]+favicon-light-32\.png"(?:\s|>)/, `${route} lacks a default favicon fallback`);
    for (const size of [16, 32, 48]) {
      assert.match(html, new RegExp(`rel="icon"[^>]+sizes="${size}x${size}"[^>]+favicon-light-${size}\\.png`), `${route} lacks light ${size}px icon`);
      assert.match(html, new RegExp(`rel="icon"[^>]+sizes="${size}x${size}"[^>]+favicon-dark-${size}\\.png`), `${route} lacks dark ${size}px icon`);
    }
    assert.match(html, /rel="apple-touch-icon"[^>]+apple-touch-icon\.png/);
    assert.match(html, /rel="manifest"[^>]+site-v2\.webmanifest/);
    assert.doesNotMatch(html, /(?:icon-(?:32|48|180|192|512)\.png|site\.webmanifest)/, `${route} still references an obsolete icon path`);
  }
});

test('favicon and mobile bookmark assets have the expected square PNG dimensions', () => {
  const assets = [
    ...[16, 32, 48].flatMap((size) => [
      [`favicon-light-${size}.png`, size],
      [`favicon-dark-${size}.png`, size],
    ]),
    ['apple-touch-icon.png', 180],
    ['pwa-icon-192.png', 192],
    ['pwa-icon-512.png', 512],
  ];

  for (const [name, size] of assets) {
    const data = fs.readFileSync(path.join(brand, name));
    assert.deepEqual(data.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), `${name} is not PNG`);
    assert.equal(data.readUInt32BE(16), size, `${name} width`);
    assert.equal(data.readUInt32BE(20), size, `${name} height`);
    assert.equal(data[25], 6, `${name} should retain an alpha channel`);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(brand, 'site-v2.webmanifest'), 'utf8'));
  assert.deepEqual(manifest.icons.map(({ src, sizes, type }) => ({ src, sizes, type })), [
    { src: 'pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
  ]);
  assert.ok(fs.existsSync(path.join(brand, 'approved', 'modi-holidays-logo-light-background.png')));
  assert.ok(fs.existsSync(path.join(brand, 'approved', 'modi-holidays-logo-dark-background.png')));
  assert.ok(fs.existsSync(path.join(root, 'scripts', 'prepare-favicons.ps1')));
  const provenance = JSON.parse(fs.readFileSync(path.join(brand, 'provenance.json'), 'utf8'));
  const source = fs.readFileSync(path.join(brand, provenance.original));
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'), provenance.sha256, 'approved artwork hash changed');
  assert.deepEqual(provenance.faviconCropPixels, { x: 1600, y: 55, width: 240, height: 190 });
  assert.deepEqual(provenance.faviconSources, [
    'approved/modi-holidays-logo-light-background.png',
    'approved/modi-holidays-logo-dark-background.png',
  ]);
});

test('Cloudflare artifact includes the new icon set and omits legacy icon files', (context) => {
  const artifact = process.env.MH_PUBLIC_ARTIFACT_DIR || path.join(root, 'dist');
  if (!fs.existsSync(artifact)) {
    context.skip('Run build-cloudflare-pages.cjs before artifact favicon checks');
    return;
  }

  for (const [name] of [
    ...[16, 32, 48].flatMap((size) => [
      [`favicon-light-${size}.png`],
      [`favicon-dark-${size}.png`],
    ]),
    ['apple-touch-icon.png'],
    ['pwa-icon-192.png'],
    ['pwa-icon-512.png'],
    ['site-v2.webmanifest'],
  ]) assert.ok(fs.existsSync(path.join(artifact, 'assets', 'brand', name)), `${name} missing from artifact`);

  for (const name of ['icon-32.png', 'icon-48.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']) {
    assert.equal(fs.existsSync(path.join(artifact, 'assets', 'brand', name)), false, `${name} shipped in artifact`);
  }
});

test('published pages have no legacy icon references; unpublished pages retain their local resources', () => {
  const htmlFiles = routes.map((route) => path.join(root, pageFile(route)))
    .concat(path.join(root, '404.html'), path.join(root, 'package.html'));
  for (const file of htmlFiles) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /(?:icon-(?:32|48|180|192|512)\.png|site\.webmanifest)/, `${path.relative(root, file)} retains an obsolete icon link`);
  }
  for (const name of ['icon-32.png', 'icon-48.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']) {
    assert.ok(fs.existsSync(path.join(brand, name)), `${name} is retained for excluded local pages`);
  }
  const generator = fs.readFileSync(path.join(root, 'build_site.py'), 'utf8');
  assert.match(generator, /favicon-light-32\.png/);
  assert.match(generator, /favicon-dark-32\.png/);
  const cropScript = fs.readFileSync(path.join(root, 'scripts', 'prepare-favicons.ps1'), 'utf8');
  assert.match(cropScript, /approved\/modi-holidays-logo-light-background\.png/);
  assert.match(cropScript, /approved\/modi-holidays-logo-dark-background\.png/);
  assert.match(cropScript, /Rectangle\]::new\(1600, 55, 240, 190\)/);
});

#!/usr/bin/env node
'use strict';

// Assemble the published site from an explicit public allowlist. This script
// intentionally does not copy CNAME, admin tools, legal policy pages, or docs.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, process.argv[2] || 'dist');
const expectedRootPages = [
  'index.html', 'about.html', 'contact.html', 'domestic-holidays.html',
  'international-holidays.html', 'group-tours.html', 'packages.html',
  'pilgrimage-tours.html', 'plan-my-holiday.html', '404.html'
];
const indexedRootPages = expectedRootPages.filter((name) => name !== '404.html');
const assetFiles = [
  'brand.css', 'catalogue.js', 'config.js', 'launch.css', 'logo.svg',
  'main.js', 'package-redirect.js', 'packages.json', 'image-manifest.json',
  'styles.css', 'brand/site.webmanifest'
];
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.ico']);
const deniedPhotoStems = new Set([
  'f89b15baf6d11ede', 'e0c10fecd0a1d461', '8a5168c0a0034d70',
  '543917baf6ca7c4b', 'f27ed012b0617351', '73b13e168af9ad70',
  'fa0f3652c190474d'
]);
const deniedPolicyNames = new Set(['terms.html', 'privacy.html', 'cancellation.html']);

function fail(message) { throw new Error(`Public artifact safety check failed: ${message}`); }
function regularFile(source) {
  const stat = fs.lstatSync(source);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`Expected a regular file: ${path.relative(ROOT, source)}`);
}
function copyFile(source, relative) {
  regularFile(source);
  const destination = path.join(OUT, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
function copyImageTree(relativeDir) {
  const sourceDir = path.join(ROOT, relativeDir);
  if (!fs.existsSync(sourceDir)) fail(`Required public asset directory missing: ${relativeDir}`);
  const walk = (current) => {
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) fail(`Symlink in public asset directory: ${path.relative(ROOT, current)}`);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(current).sort()) walk(path.join(current, name));
      return;
    }
    if (!stat.isFile()) fail(`Unsupported asset entry: ${path.relative(ROOT, current)}`);
    const ext = path.extname(current).toLowerCase();
    const stem = path.basename(current, ext).toLowerCase();
    if (!imageExtensions.has(ext) || deniedPhotoStems.has(stem)) return;
    copyFile(current, path.relative(ROOT, current));
  };
  walk(sourceDir);
}
function removeUnapprovedPolicyLinks(html) {
  // Remove only footer list items linking to unapproved policy pages. Policy
  // documents remain in source for owner review but are absent from dist.
  const pattern = /<li\b[^>]*>\s*<a\b[^>]*href\s*=\s*(["'])[^"']*(?:terms|privacy|cancellation)\.html(?:[?#][^"']*)?\1[^>]*>[\s\S]*?<\/a>\s*<\/li>/gi;
  return html.replace(pattern, '');
}
function copyPublicHtml(name) {
  if (!expectedRootPages.includes(name) || deniedPolicyNames.has(name)) fail(`Page is not allowlisted: ${name}`);
  const source = path.join(ROOT, name);
  regularFile(source);
  const html = removeUnapprovedPolicyLinks(fs.readFileSync(source, 'utf8'));
  if (/(?:href|src)\s*=\s*["'][^"']*(?:terms|privacy|cancellation)\.html/i.test(html)) {
    fail(`Unapproved policy link remains in ${name}`);
  }
  fs.writeFileSync(path.join(OUT, name), html, 'utf8');
}
function writeSanitizedSitemap(packages) {
  const source = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const urls = [...source.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (urls.length !== 152) fail(`Expected 152 source sitemap URLs before policy filtering, found ${urls.length}`);
  const kept = urls.filter((value) => !deniedPolicyNames.has(path.posix.basename(new URL(value).pathname)));
  const expected = new Set([
    ...indexedRootPages.filter((name) => name !== '404.html').map((name) => new URL(name, 'https://modiholidays.in/').href),
    ...packages.map((item) => new URL(`tours/${item.slug}.html`, 'https://modiholidays.in/').href)
  ]);
  const actual = new Set(kept);
  if (kept.length !== 149 || actual.size !== 149) fail(`Expected 149 unique post-filter sitemap URLs, found ${kept.length}/${actual.size}`);
  for (const url of actual) if (!expected.has(url)) fail(`Unexpected sitemap URL: ${url}`);
  for (const url of expected) if (!actual.has(url)) fail(`Missing sitemap URL: ${url}`);
  let cursor = 0;
  const sanitized = source.replace(/<url>\s*<loc>[^<]+<\/loc>\s*<\/url>\s*/g, (block) => {
    const match = block.match(/<loc>([^<]+)<\/loc>/);
    if (!match) fail('Could not parse source sitemap entry');
    const keep = !deniedPolicyNames.has(path.posix.basename(new URL(match[1]).pathname));
    cursor += 1;
    return keep ? block : '';
  });
  if (cursor !== urls.length) fail('Sitemap transformation did not process every source entry');
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sanitized, 'utf8');
}
function scanArtifact() {
  const forbiddenPaths = [
    /^admin\.html$/i, /^admin-app(?:\/|$)/i, /^owner-review-legal(?:\/|$)/i,
    /^\.env(?:\.|$)/i, /^CNAME$/i, /(?:^|\/)(?:node_modules|\.git|dist|_site)(?:\/|$)/i,
    /(?:^|\/)(?:terms|privacy|cancellation)\.html$/i
  ];
  const secretPattern = /(SUPABASE_SERVICE_ROLE|service_role[_ -]?key|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|TURNSTILE_SECRET_KEY)/i;
  const files = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir).sort()) {
      const absolute = path.join(dir, name);
      const relative = path.relative(OUT, absolute).replace(/\\/g, '/');
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) fail(`Symlink in artifact: ${relative}`);
      if (forbiddenPaths.some((pattern) => pattern.test(relative))) fail(`Forbidden artifact path: ${relative}`);
      if (stat.isDirectory()) walk(absolute);
      else if (stat.isFile()) {
        files.push(relative);
        if (/\.(?:html|js|json|xml|txt|css|svg|webmanifest)$/i.test(relative)) {
          const text = fs.readFileSync(absolute, 'utf8');
          if (secretPattern.test(text)) fail(`Potential secret marker in ${relative}`);
          if (/(?:href|src)\s*=\s*["'][^"']*(?:terms|privacy|cancellation)\.html/i.test(text)) {
            fail(`Unapproved policy reference in ${relative}`);
          }
        }
      } else fail(`Unsupported artifact entry: ${relative}`);
    }
  };
  walk(OUT);
  return files;
}

function build() {
  if (OUT !== path.join(ROOT, 'dist')) fail('Output must be the isolated repository dist/ directory');
  const packagesPath = path.join(ROOT, 'assets', 'packages.json');
  const packages = JSON.parse(fs.readFileSync(packagesPath, 'utf8')).filter((item) => item.published === true);
  if (packages.length !== 140 || new Set(packages.map((item) => item.id)).size !== 140) {
    fail(`Expected 140 unique published catalogue packages, found ${packages.length}`);
  }
  const slugs = packages.map((item) => item.slug);
  if (slugs.some((slug) => typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) || new Set(slugs).size !== 140) {
    fail('Catalogue slugs are missing or not unique');
  }
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  else fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  for (const page of expectedRootPages) copyPublicHtml(page);
  for (const item of packages) {
    const page = `tours/${item.slug}.html`;
    const source = path.join(ROOT, page);
    if (!fs.existsSync(source)) fail(`Missing published tour page: ${page}`);
    regularFile(source);
    const html = removeUnapprovedPolicyLinks(fs.readFileSync(source, 'utf8'));
    if (/(?:href|src)\s*=\s*["'][^"']*(?:terms|privacy|cancellation)\.html/i.test(html)) fail(`Unapproved policy link remains in ${page}`);
    fs.mkdirSync(path.dirname(path.join(OUT, page)), { recursive: true });
    fs.writeFileSync(path.join(OUT, page), html, 'utf8');
  }
  copyFile(path.join(ROOT, 'robots.txt'), 'robots.txt');
  writeSanitizedSitemap(packages);
  for (const name of assetFiles) {
    const source = path.join(ROOT, 'assets', name);
    if (!fs.existsSync(source)) fail(`Required public asset missing: assets/${name}`);
    copyFile(source, `assets/${name.startsWith('brand/') ? name : name}`);
  }
  // Copy only image artwork from audited public image directories. The source
  // directories are not copied wholesale, so documentation and scripts stay out.
  for (const dir of ['assets/brand', 'assets/destinations', 'assets/photos']) copyImageTree(dir);
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '', 'utf8');
  const files = scanArtifact();
  const tourCount = fs.readdirSync(path.join(OUT, 'tours')).filter((name) => name.endsWith('.html')).length;
  if (tourCount !== 140) fail(`Artifact has ${tourCount} tour pages, expected 140`);
  console.log(`Public artifact ready: ${files.length} files; ${tourCount} tour pages; 149 sitemap URLs; 7 uncleared photo stems excluded.`);
}

if (require.main === module) {
  try { build(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { build, scanArtifact, deniedPhotoStems };

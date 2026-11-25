#!/usr/bin/env node
'use strict';

// Assemble the already-built public site for Cloudflare Pages.
// Run only after build_site.py, prepare-seo.cjs, validate.py and tests pass.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DRAFT_PAGES = new Set(['terms.html', 'cancellation.html', 'privacy.html']);
const OMIT_ROOT_PAGES = new Set(['admin.html', 'homepage-prototype.html', ...DRAFT_PAGES]);
const OMIT_UNCLEARED_REFERENCE_ASSETS = new Set([
  'assets/bespoke/f89b15baf6d11ede.webp',
  'assets/bespoke/e0c10fecd0a1d461.webp',
  'assets/bespoke/8a5168c0a0034d70.webp',
  'assets/bespoke/543917baf6ca7c4b.webp',
  'assets/bespoke/f27ed012b0617351.webp',
  'assets/bespoke/73b13e168af9ad70.webp',
  'assets/bespoke/fa0f3652c190474d.webp',
]);
const OMIT_FILE = /^(?:\.env(?:\..*)?|.*(?:secret|credential|service[-_]?role).*)$|\.(?:pem|key|sql|db|sqlite|md)$/i;
const SECRET_MARKER = /SUPABASE_SERVICE_ROLE_KEY|TURNSTILE_SECRET_KEY|INGRESS_SECRET|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i;
const POLICY_LINK = /<a\b(?=[^>]*\bhref=["'](?:\.\.\/)?(?:terms|cancellation|privacy)\.html(?:[?#][^"']*)?["'])[^>]*>[\s\S]*?<\/a>/gi;

function copyPublicTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const relativePath = path.relative(ROOT, from).split(path.sep).join('/');
    if (OMIT_UNCLEARED_REFERENCE_ASSETS.has(relativePath) || entry.name.toLowerCase() === 'admin.html' || OMIT_FILE.test(entry.name) || /^(?:admin-app|admin|private|secrets?)$/i.test(entry.name)) continue;
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      copyPublicTree(from, to);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.html')) fs.writeFileSync(to, fs.readFileSync(from, 'utf8').replace(POLICY_LINK, ''), 'utf8');
      else fs.copyFileSync(from, to);
    }
  }
}

function htmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function assemble(outputArgument) {
  if (!outputArgument) throw new Error('Pass the Pages output directory (Cloudflare setting: dist).');
  const output = path.resolve(ROOT, outputArgument);
  if (output === ROOT || fs.existsSync(output)) throw new Error(`Refusing to overwrite output directory: ${output}`);
  for (const input of ['assets', 'tours']) {
    const source = path.join(ROOT, input);
    const outputInSource = path.relative(source, output);
    const sourceInOutput = path.relative(output, source);
    if ((outputInSource === '' || (!outputInSource.startsWith('..') && !path.isAbsolute(outputInSource))) ||
        (sourceInOutput === '' || (!sourceInOutput.startsWith('..') && !path.isAbsolute(sourceInOutput)))) {
      throw new Error(`Output directory must not contain source tree: ${input}`);
    }
  }

  fs.mkdirSync(output, { recursive: true });
  for (const name of fs.readdirSync(ROOT)) {
    if (!name.endsWith('.html') || OMIT_ROOT_PAGES.has(name)) continue;
    const source = path.join(ROOT, name);
    if (!fs.statSync(source).isFile()) continue;
    const html = fs.readFileSync(source, 'utf8').replace(POLICY_LINK, '');
    fs.writeFileSync(path.join(output, name), html, 'utf8');
  }

  copyPublicTree(path.join(ROOT, 'assets'), path.join(output, 'assets'));
  copyPublicTree(path.join(ROOT, 'tours'), path.join(output, 'tours'));
  for (const name of ['robots.txt', 'sitemap.xml', '_headers']) {
    const source = path.join(ROOT, name);
    if (!fs.existsSync(source)) throw new Error(`Required public file missing: ${name}`);
    fs.copyFileSync(source, path.join(output, name));
  }

  const packages = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/packages.json'), 'utf8'));
  const expectedTours = packages.filter(pkg => pkg.published !== false);
  const builtTours = htmlFiles(path.join(output, 'tours'));
  if (builtTours.length !== expectedTours.length) throw new Error(`Expected ${expectedTours.length} tour pages; found ${builtTours.length}`);
  if (fs.existsSync(path.join(output, 'admin.html')) || fs.existsSync(path.join(output, 'admin-app'))) throw new Error('Admin code found in public artifact');
  for (const name of DRAFT_PAGES) if (fs.existsSync(path.join(output, name))) throw new Error(`Inactive policy draft included: ${name}`);
  if (fs.existsSync(path.join(output, 'CNAME'))) throw new Error('CNAME must remain outside the Cloudflare artifact until domain approval');

  const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  if (urls.length !== new Set(urls).size) throw new Error('Duplicate URLs in sitemap');
  for (const pkg of expectedTours) {
    const url = `https://modiholidays.in/tours/${pkg.slug}`;
    if (!urls.includes(url)) throw new Error(`Sitemap omits published package ${pkg.slug}`);
  }
  for (const url of urls) {
    const parsed = new URL(url);
    if (/\.html$/i.test(parsed.pathname)) throw new Error(`Sitemap URL would redirect from .html: ${url}`);
    const relative = parsed.pathname === '/' ? 'index.html' : `${decodeURIComponent(parsed.pathname.slice(1)).replace(/\/$/, '')}.html`;
    const file = path.join(output, relative);
    if (!fs.existsSync(file)) throw new Error(`Sitemap URL has no artifact page: ${url}`);
    const html = fs.readFileSync(file, 'utf8');
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
    if (canonical !== url) throw new Error(`Sitemap canonical mismatch: ${url}`);
    if (/\bnoindex\b/i.test(html.match(/<meta\s+name=["']robots["'][^>]*>/i)?.[0] || '')) throw new Error(`Sitemap page is noindex: ${url}`);
  }

  const allFiles = [];
  const collect = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) collect(full);
      else if (entry.isFile()) allFiles.push(full);
    }
  };
  collect(output);
  for (const file of allFiles) {
    const relative = path.relative(output, file);
    if (OMIT_FILE.test(path.basename(file))) throw new Error(`Private file included: ${relative}`);
    if (/\.(?:html|js|json|txt)$/i.test(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (SECRET_MARKER.test(content)) throw new Error(`Secret marker found in public text asset: ${relative}`);
      if (/\bhref=["'](?:\.\.\/)?(?:terms|cancellation|privacy)\.html(?:[?#][^"']*)?["']/i.test(content)) {
        throw new Error(`Policy draft link remains in public file: ${relative}`);
      }
    }
  }

  return { output, tourPages: builtTours.length, sitemapUrls: urls.length, files: allFiles.length };
}

if (require.main === module) {
  try {
    const result = assemble(process.argv[2] || 'dist');
    console.log(`Cloudflare Pages artifact ready: ${result.tourPages} tours, ${result.sitemapUrls} sitemap URLs, ${result.files} files at ${result.output}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { assemble };

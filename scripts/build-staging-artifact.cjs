#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function copyPublicTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.name.startsWith('.env') || /\.(?:pem|key|sql|db|sqlite)$/i.test(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyPublicTree(from, to);
    else if (entry.isFile() && !/\.md$/i.test(entry.name)) fs.copyFileSync(from, to);
  }
}

function markHtmlNoindex(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) markHtmlNoindex(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      fs.writeFileSync(file, markNoindex(fs.readFileSync(file, 'utf8')), 'utf8');
    }
  }
}

function markNoindex(html) {
  const tag = '<meta name="robots" content="noindex, nofollow">';
  if (/<meta\s+name="robots"[^>]*>/i.test(html)) return html.replace(/<meta\s+name="robots"[^>]*>/i, tag);
  return html.replace('</head>', `${tag}</head>`);
}

function buildStagingArtifact(outputArgument) {
  if (!outputArgument) throw new Error('Provide a new output directory path.');
  const output = path.resolve(outputArgument);
  const relative = path.relative(ROOT, output);
  if (!relative || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new Error('Staging artifact output must be outside the repository.');
  }
  if (fs.existsSync(output)) throw new Error(`Refusing to overwrite existing output: ${output}`);
  fs.mkdirSync(output, { recursive: true });

  for (const name of fs.readdirSync(ROOT).filter(file => file.endsWith('.html') && !['admin.html', 'homepage-prototype.html'].includes(file))) {
    fs.writeFileSync(path.join(output, name), markNoindex(fs.readFileSync(path.join(ROOT, name), 'utf8')), 'utf8');
  }
  copyPublicTree(path.join(ROOT, 'assets'), path.join(output, 'assets'));
  copyPublicTree(path.join(ROOT, 'tours'), path.join(output, 'tours'));
  markHtmlNoindex(path.join(output, 'tours'));

  // Keep staging crawlable so search engines can see its noindex response;
  // production robots.txt and sitemap are deliberately not copied.
  fs.writeFileSync(path.join(output, 'robots.txt'), 'User-agent: *\nAllow: /\n', 'utf8');
  fs.writeFileSync(path.join(output, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n', 'utf8');
  return output;
}

if (require.main === module) {
  try {
    console.log(`Prepared noindex staging artifact at ${buildStagingArtifact(process.argv[2])}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { buildStagingArtifact };

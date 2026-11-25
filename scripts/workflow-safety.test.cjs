'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workflow = fs.readFileSync(path.resolve(__dirname, '../.github/workflows/pages.yml'), 'utf8');

test('GitHub Actions validates PRs and relevant pushes with pinned runtimes', () => {
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /branches:\s*\n\s*- main/m);
  assert.match(workflow, /release\/website-integration-20261125/);
  assert.match(workflow, /python-version:\s*['"]?3\.12/);
  assert.match(workflow, /python build_site\.py/);
  assert.match(workflow, /python scripts\/validate\.py/);
  assert.match(workflow, /node-version:\s*['"]24['"]/);
  assert.match(workflow, /node scripts\/prepare-seo\.cjs/);
  assert.match(workflow, /scripts\/build-cloudflare-pages\.cjs dist/);
  for (const suite of ['whatsapp', 'seo-quality', 'homepage-prototype', 'prototype-interactions', 'public-artifact', 'workflow-safety']) {
    assert.match(workflow, new RegExp(`scripts\/${suite}\\.test\\.cjs`));
  }
});

test('GitHub Actions cannot publish GitHub Pages or deploy Cloudflare', () => {
  assert.doesNotMatch(workflow, /workflow_dispatch|deploy-pages|upload-pages-artifact|pages:\s*write|id-token:\s*write|deploy-production|github-pages|wrangler\s+deploy|cloudflare.*deploy/i);
  assert.match(workflow, /^permissions:\s*\n\s+contents:\s*read\s*$/m);
  assert.doesNotMatch(workflow, /^\s+(?:contents|pages|id-token):\s*(?:write|read-all|write-all)\s*$/m);
});

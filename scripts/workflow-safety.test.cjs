'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workflow = fs.readFileSync(path.resolve(__dirname, '../.github/workflows/pages.yml'), 'utf8');

test('GitHub Actions remains validation-only on PRs and main pushes', () => {
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /branches:\s*\n\s*- main/m);
  assert.match(workflow, /python-version:\s*['"]?3\.12/);
  assert.match(workflow, /python scripts\/validate\.py/);
  assert.match(workflow, /node-version:\s*['"]24['"]/);
  assert.match(workflow, /scripts\/build-public-artifact\.cjs dist/);
  assert.match(workflow, /scripts\/public-artifact\.test\.cjs scripts\/workflow-safety\.test\.cjs/);
});

test('workflow cannot deploy or publish GitHub Pages', () => {
  assert.doesNotMatch(workflow, /workflow_dispatch|deploy-pages|upload-pages-artifact|pages:\s*write|id-token:\s*write|deploy-production|github-pages/i);
  const permissionBlock = workflow.match(/^permissions:\s*\n((?:\s+[^\n]*\n)+)/m)?.[1] || '';
  assert.match(permissionBlock, /contents:\s*read/);
  assert.doesNotMatch(permissionBlock, /write|id-token|pages/i);
});

'use strict';

// Backward-compatible command retained for existing release notes. The
// Cloudflare Pages builder is the single audited public-artifact allowlist.
const { assemble } = require('./build-cloudflare-pages.cjs');

if (require.main === module) {
  try {
    const result = assemble(process.argv[2] || 'dist');
    console.log(`Public artifact ready: ${result.tourPages} tours, ${result.sitemapUrls} sitemap URLs, ${result.files} files at ${result.output}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { assemble };

# Modi Holidays — Cloudflare Pages build preparation

**Status:** Prepared locally; not connected, deployed, or applied to the Cloudflare account. No DNS or Cloudflare project settings changed.

## Cloudflare Pages project settings

Use Git integration with repository `spacyes123/Modiholidays` after owner approval:

- Framework preset: **None**
- Root directory: `/`
- Production branch: `main`
- Build command:

  ```sh
  python build_site.py && node scripts/prepare-seo.cjs && python scripts/validate.py && node --test scripts/whatsapp.test.cjs scripts/seo-quality.test.cjs scripts/homepage-prototype.test.cjs scripts/prototype-interactions.test.cjs && node scripts/build-cloudflare-pages.cjs dist
  ```

- Build output directory: `dist`
- Build environment variables: `PYTHON_VERSION=3.12`, `NODE_VERSION=24`
- Secrets: **none**. This is a static public site; do not add Supabase service-role, Worker ingress, Turnstile-secret or admin credentials to Pages.
- Custom domains: leave unconfigured until separately approved. The builder omits `CNAME`.

Cloudflare Pages accepts a build command and output directory in project settings. The Pages build image supports Node.js and Python and lets the project select their versions through `NODE_VERSION` and `PYTHON_VERSION`. [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) · [Build image](https://developers.cloudflare.com/pages/configuration/build-image/)

## Artifact safeguards

`scripts/build-cloudflare-pages.cjs` assembles the `dist` artifact only after the Python build, optimizer, validator and Node tests succeed. It includes the public root pages, 140 tour pages, assets, `robots.txt` and the canonical production sitemap. It excludes `admin.html`, `admin-app`, the homepage prototype, credentials/private-file patterns, `CNAME`, and the unapproved `terms.html`, `cancellation.html` and incomplete `privacy.html` drafts. It removes footer links to those unpublished draft pages and validates sitemap pages/canonicals before returning success.

Because the policies are excluded, the resulting footer has no Terms, Cancellation or Privacy links until approved documents are supplied. That is a production launch blocker; the builder does not present a draft as effective policy.

## Deployment and rollback controls

- Do not configure Cloudflare Git integration or start a deployment in this task.
- Cloudflare Pages Git integration can deploy branch pushes and previews. Use the `[CF-Pages-Skip]` commit-message prefix for this SEO-only branch push so it does not start a Pages build/deployment; keep the normal GitHub Actions workflow active. Cloudflare documents this prefix as a per-commit deployment skip. [GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
- When Cloudflare is later approved, configure branch controls so only explicitly selected branches create previews. Keep `main` as the Cloudflare production branch.
- Keep the current GitHub Pages deployment workflow until Cloudflare production rendering, links, SEO, form handoff, HTTPS, domain, and privacy/legal requirements have all been verified and the owner approves the switch.
- After that approval, retire only the GitHub Pages deployment job; retain the GitHub Actions build/test job.

## Local validation limitation

The Cloudflare artifact script can be tested with Node using the existing source files. The full command still requires Python: `build_site.py` generates the page catalogue and `scripts/validate.py` validates it. The local machine currently has no Python runtime. GitHub Actions already installs Python 3.12; the Pages build image also supports selecting Python 3.12. Do not label the complete Cloudflare build as locally verified until the full command succeeds in an approved CI build.

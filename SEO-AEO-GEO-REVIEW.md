# Modi Holidays — SEO, AEO and GEO local review

**Status:** Local branch preparation. No DNS, hosted database, public deployment, production policy or Supabase setting has been changed.

## Final release-readiness verification — 19 November 2026

| Check | Result | Evidence / limitation |
|---|---|---|
| Sitemap coverage | **PASS** | 149 unique URLs: all 140 published package URLs plus nine public landing pages. Every URL resolves to a local HTML file, has exactly one matching canonical, and has no `noindex` directive. |
| Sitemap removals | **PASS** | The three removed content URLs are `/terms.html`, `/cancellation.html` and `/privacy.html`. The old `/index.html` entry was replaced by canonical `/`; that alias replacement accounts for the fourth removal and one addition, making the net sitemap change −3. |
| Structured data | **PASS after one correction** | All JSON-LD parses. Checked all 140 `TouristTrip`, `BreadcrumbList` and `FAQPage` nodes against package names, canonicals, day-by-day catalogue data, breadcrumb links and visible FAQ text. The homepage `Organization` facts (brand, 2009, public phone/email and logo file) match visible/verified details. |
| Collection page schema | **FIXED / PASS** | `packages.html` had a CollectionPage name and description that did not match its visible H1 and introductory paragraph. The markup now uses the visible heading/intro and canonical URL. `scripts/prepare-seo.cjs` applies the same correction after the generated build. |
| Typography | **PARTIAL** | The approved font declarations are Cormorant Garamond and Manrope. CSS fallbacks are Georgia/Times and Arial/system, respectively; no local WOFF/TTF/OTF assets were found. A previous Chromium run used fallback fonts. Direct requests to both `fonts.googleapis.com` and `fonts.gstatic.com` in this environment were blocked by socket permissions, so live font-file loading remains unverified. No visual design was changed. |
| Privacy policy | **FAIL — not indexable** | Still a drafting template with `[Insert date]`, a missing actual legal-entity name, generic/conditional processor and system descriptions, incomplete retention/security/access and data-request procedures, and an instruction to replace the contact with a monitored address. Clarify whether CRM/Turnstile capture and analytics are actually active. The page remains `noindex` and absent from the sitemap. |
| Build/runtime | **PASS in GitHub Actions** | Run [44699448933](https://github.com/spacyes123/Modiholidays/actions/runs/44699448933), commit `9885e2313a87a570f1c1c16ece5bef7f07b1e0db`, installed Python 3.12 and successfully ran `python build_site.py`, `node scripts/prepare-seo.cjs` and `python scripts/validate.py`. The Python WindowsApps alias remains unavailable locally; the hosted run supplies the requested build evidence. |
| Automated tests | **PASS** | GitHub Actions ran the configured Node suite: 14 passed, 0 failed. The initial run exposed a build-generated homepage logo without intrinsic dimensions; `scripts/prepare-seo.cjs` now adds its verified 2077×724 dimensions. The subsequent complete Python/Node workflow passed. The broader local public-site suite had 22 passed, 0 failed before this final one-file correction; the targeted 14-test suite passes locally after it. Staging and Cloudflare artifact tests cover all 140 tour URLs and exclude `admin.html`, `admin-app`, private-file patterns, secret markers and inactive policy drafts. |
| Cloudflare Pages preparation | **PREPARED / NOT DEPLOYED** | Added a public-only artifact builder and setup instructions. Output is `dist`; its recipe runs Python generation/validation, SEO optimization and Node tests first. It excludes admin/private files, `CNAME` and inactive policy drafts, and strips links to unpublished legal drafts. No Cloudflare settings changed. |
| GitHub Pages feature CI | **PASS / DEPLOY SKIPPED** | Workflow run [44699448933](https://github.com/spacyes123/Modiholidays/actions/runs/44699448933) passed its validation job on the feature branch. Its `deploy` job was skipped as configured; no GitHub Pages deployment occurred. |
| Cloudflare Pages artifact | **PREPARED / NOT DEPLOYED** | The exact build command and `dist` output directory are in [CLOUDFLARE-PAGES-SETUP.md](CLOUDFLARE-PAGES-SETUP.md). Artifact assembly/exclusion behavior passed the Node regression test; the full Cloudflare build command has not been run as a separate hosted Pages build, and no Cloudflare project configuration was changed. |

### Remaining release blockers

1. Complete and review the privacy policy using owner-confirmed legal entity, actual data flows/processors, retention, security/access practices, request handling and monitored contact details. Keep it non-indexable until complete.
2. Confirm intended font rendering in an environment that can reach Google Fonts, or make a separate decision about properly licensed self-hosted font files. Fallback behavior is safe but does not complete the typography verification.
3. Configure and verify the Cloudflare Pages project with the prepared `dist` build before retiring the GitHub Pages deployment workflow. Keep the existing production deployment untouched until that validation and owner approval.

Privacy content, font delivery and a successful Python build remain the outstanding release-readiness blockers. Cloudflare Git integration and settings still require owner-controlled configuration and later verification. Search Console, live-domain, DNS and Google Business Profile setup remain post-domain owner tasks; none were changed here.

## Baseline audit

- The source catalogue contains 140 package records and 140 corresponding tour-detail pages. Each page already had a unique canonical URL, one H1, a day-wise itinerary, visible enquiry links and `TouristTrip`, `BreadcrumbList` and `FAQPage` JSON-LD.
- All 140 pages had titles and descriptions. 121 tour descriptions exceeded 170 characters; four title strings exceeded 70 characters in the original HTML. The generic `package.html` template duplicated the domestic catalogue description and canonicalised to `packages.html` while lacking `noindex`.
- The 152-entry sitemap included three noindex policy/privacy pages. It also listed `/index.html` instead of the canonical root URL; the current sitemap removes the three pages and consolidates that alias.
- The privacy page still contains template language and a `[Insert date]` placeholder. The homepage had no Organization schema. Homepage photography and logo images lacked intrinsic dimensions; package-image source and licence details were already recorded in the image manifest.
- `robots.txt` allows crawling and points to the production sitemap. The build artifact workflow excludes the insecure root editor `admin.html` and the homepage prototype.

## Local changes

- Generated distinct, catalogue-derived tour titles and 127–150 character descriptions using each package name, duration, category and route. The original itinerary data, package identity and URLs remain unchanged.
- Replaced repeated generic package FAQ copy with visible, package-specific duration and route questions. Added three operational FAQs to the enquiry page covering customisation, quote requests and written confirmation. Answers use existing business and package facts.
- Added homepage `Organization` JSON-LD with the verified public name, 2009 history, phone and email. No street address, hours, awards, reviews or credentials were inferred.
- Aligned Open Graph URLs with page canonicals. Added intrinsic dimensions to supplied logo artwork and catalogue WebP images.
- Marked `404.html`, the generic `package.html` template and the incomplete privacy template `noindex`. Removed noindex pages and unapproved terms/cancellation drafts from the sitemap. The sitemap now contains 149 canonical, indexable URLs: 140 tours and nine public site pages. Final verification matched every URL to a local page, canonical and indexability directive.
- Added a staging artifact builder that excludes `admin.html`, `admin-app`, the prototype, production `CNAME` and production sitemap. It emits crawlable `robots.txt` plus HTML `noindex` and `X-Robots-Tag` headers so staging remains testable but is not intended for indexing. It was tested locally only; it was not deployed.
- Added the SEO optimizer to the Pages validation workflow so generated pages receive these refinements before validation and artifact creation. The feature branch is included in validation triggers; the deploy condition still permits deployment only from `main`.

The enquiry remains WhatsApp-first. Local public configuration has no CRM endpoint or Turnstile site key, so no CRM persistence is claimed. No online booking or checkout was added.

## Before and after

| Check | Before | After |
|---|---:|---:|
| Tour pages with descriptions over 170 characters | 121 / 140 | 0 / 140 |
| Duplicate description between catalogue and generic package template | 1 | Template is noindex; indexable descriptions are unique |
| Noindex URLs listed in production sitemap | 3 policy/privacy draft pages | 0 |
| Sitemap URLs | 152 | 149 canonical/indexable URLs |
| Tour pages with package-specific FAQ content | Repeated generic questions | Duration and route answers derived from each package |
| Homepage Organization schema | Missing | Added with verified identity/contact facts |
| Explicit dimensions on public logo/photo tags | Missing on homepage photos and logo tags | Added from supplied artwork and standard catalogue image dimensions |

## Tests and evidence

- `node --test scripts/seo-quality.test.cjs scripts/homepage-prototype.test.cjs scripts/whatsapp.test.cjs scripts/prototype-interactions.test.cjs`: **22 passed, 0 failed** after adding Cloudflare artifact exclusion and schema regression assertions.
- The SEO tests verify 140 pages, unique concise metadata, a single H1, itinerary preservation, structured-data syntax, sitemap/canonical alignment, local links, image files/alt/dimensions, source records and staging artifact exclusions. A separate final consistency check matched all 140 tour schemas to catalogue details and visible page content.
- Headless Chromium local responsive check from the previous review: **16 checks** across homepage, catalogue, enquiry and one tour detail page at 390, 768, 1024 and 1440 px. No horizontal overflow, missing H1, broken images or JavaScript page errors were observed.
- Sitemap parsed as XML with 149 URLs. A final source-level comparison against `HEAD:sitemap.xml` found the three excluded content pages (`terms.html`, `cancellation.html`, `privacy.html`) plus `/index.html` replaced by the root canonical `/`.
- Google Fonts requests failed in the earlier local Chromium session; direct requests to both font hosts failed with a local socket-permission error during final verification. CSS declares Cormorant Garamond and Manrope with Georgia/Times and Arial/system fallbacks. The browser displayed fallbacks in the earlier test; font downloads remain **unverified**. No self-hosted font files were found.
- The Python validator/build could not run locally: `py` is unavailable and `python.exe` resolves to the WindowsApps alias. The GitHub Pages workflow pins Python 3.12 and runs both Python scripts. Node checks passed but do not replace that build/validator, so a clean production-style build was not claimed.
- No Lighthouse/PageSpeed run, live-domain crawl, Search Console check or Google Business Profile verification was performed.

The staging artifact builder emits `_headers` with `X-Robots-Tag: noindex`. No Cloudflare Pages deployment was performed, so hosted header behavior remains unverified. The checked-in `.github/workflows/pages.yml` still deploys GitHub Pages only from `main`; its feature-branch push path runs validation but cannot deploy. See [Cloudflare Pages setup](CLOUDFLARE-PAGES-SETUP.md) for the prepared build recipe.

## Remaining owner actions / blockers

1. **Privacy policy:** Confirm the legal entity, effective date, actual processors/data flows, retention and security/access practices, request procedure and monitored contact. The current page contains explicit placeholders and remains noindexed/out of the sitemap.
2. **Fonts:** Verify approved Google Fonts load in an environment with outbound access or make a separate owner decision on properly licensed self-hosted fonts. Re-run visual checks after the intended font files load.
3. **Business identity:** Confirm whether a Google Business Profile exists and that the owner has access. Verify its exact name, address/service area, public phone, email, hours and website URL before making local-SEO changes. This review did not verify or change a profile.
4. **Build environment:** Run `python build_site.py` and `python scripts/validate.py` in CI or a clean review checkout with Python. GitHub Actions currently pins Python 3.12; the local runtime is unavailable. This repository workflow is GitHub Pages, not Cloudflare Pages.
5. **Production launch:** After the domain is connected and final pages are approved, verify HTTPS, canonical host redirects, `robots.txt`, sitemap retrieval and public page rendering. No DNS change was made.

## Google Search Console setup checklist

- After the owner connects the domain, verify the `modiholidays.in` Domain property using the owner's DNS verification record.
- Confirm the preferred HTTPS host and redirects before submitting URLs.
- Submit `https://modiholidays.in/sitemap.xml`; inspect the homepage, category pages and representative tour URLs, then review indexing/canonical reports after crawling.
- Keep staging `noindex` and confirm the staging host is not submitted as a production sitemap.

Google recommends sitemap URLs that agree with canonical URLs and a self-referential canonical on the selected page. [Canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) · [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

## Google Business Profile consistency checklist

- Owner confirms a profile exists and grants authorized access.
- Verify the public business name, phone, email, website, service area/address and operating hours directly against owner-approved records.
- Do not add a street address, local-business schema, hours, category, reviews or credentials without evidence.
- Keep website contact details consistent with the verified profile. No profile was viewed or edited in this local task.

The homepage uses `Organization` rather than `LocalBusiness` structured data because a verified public street address and profile were not available. Google recommends organization data on the homepage; local-business structured data has additional requirements. [Organization markup guidance](https://developers.google.com/search/docs/appearance/structured-data/organization) · [Local business markup guidance](https://developers.google.com/search/docs/appearance/structured-data/local-business)

FAQ text and markup describe useful customer answers; they do not guarantee a Google FAQ rich result. Google says FAQ rich results are generally limited to well-known, authoritative government and health websites. [Google FAQ result update](https://developers.google.com/search/blog/2023/08/howto-faq-changes)

## Exact files changed

Final verification corrected the CollectionPage schema and added regression checks. Cloudflare hosting preparation adds a public artifact builder and setup guide. These are the reviewed public-site files; no private admin/Supabase files are part of this release set.

- `.github/workflows/pages.yml`
- Root public pages: `404.html`, `about.html`, `cancellation.html`, `contact.html`, `domestic-holidays.html`, `group-tours.html`, `index.html`, `international-holidays.html`, `package.html`, `packages.html`, `pilgrimage-tours.html`, `plan-my-holiday.html`, `privacy.html`, `terms.html`
- `sitemap.xml`
- All 140 existing `tours/{slug}.html` files corresponding to `assets/packages.json`
- `CLOUDFLARE-PAGES-SETUP.md`
- `scripts/build-cloudflare-pages.cjs`
- `scripts/prepare-seo.cjs`
- `scripts/build-staging-artifact.cjs`
- `scripts/seo-quality.test.cjs`
- `SEO-AEO-GEO-REVIEW.md`

No catalogue JSON, image manifest, admin application, Supabase file or production setting was changed.

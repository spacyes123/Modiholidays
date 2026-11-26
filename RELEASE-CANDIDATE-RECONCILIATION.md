# Modi Holidays release candidate reconciliation

**Candidate branch:** `release/website-integration-20261125`

**Base:** `main` at `3b5b8f67df3582a8a9d4ef2f45498174bd18de70`

**Website source:** `feature/website-homepage-approval` at `0e97ae8a4a2101e89f0a8bcc0decdd5c4c78a5c6`
**Status:** Local merge commit on this release branch; not merged into `main`, pushed or deployed.

## Reconciliation decisions

| Area | Decision | Reason / check |
|---|---|---|
| Homepage, public navigation, catalogue, package pages and public styles | Use the approved feature-branch versions | The feature commit contains the reviewed public design. All 140 `tours/*.html` pages are retained. |
| Approved logo and supporting public assets | Use feature assets | Includes the approved brand artwork, selected destination assets and hero. The seven specifically uncleared reference photos remain excluded from the publish artifact. |
| Search and WhatsApp flow | Keep feature form/search functionality and carry forward main's same-tab navigation | Direct and generated WhatsApp links remain native same-tab anchors; the primary form handoff prepares a link rather than opening a new window. Regression coverage checks the target is absent. |
| `.github/workflows/pages.yml` | Keep main's CI-only policy, updated for this candidate's full validation path | The workflow grants only read access, runs Python 3.12 and Node 24 checks, and has no Pages artifact upload/deploy or Cloudflare deployment. |
| Public artifact assembly | Use `scripts/build-cloudflare-pages.cjs` as the only strict allowlist | It omits admin/private files, inactive legal pages, `CNAME`, review files and the seven uncleared photos; it verifies 140 package pages and sitemap targets/canonicals. |
| `scripts/build-public-artifact.cjs` | Retain as a compatibility entry point delegating to the Cloudflare allowlist | Prevents older instructions or scripts from invoking the stale main-branch assembly logic. |
| Artifact and workflow tests | Update for the merged website and CI-only release policy | Previous main assertions referenced the old hero/photo set and old artifact builder. New checks cover the approved hero, package imagery, 149 sitemap URLs, exclusions and no-deploy workflow. |
| `admin-app/`, Supabase migrations/configuration, PDF renderer and tests | Keep current main versions unchanged | No admin/Supabase files are needed to integrate the static public website. |
| Legal review documents and policy source pages | Preserve source files as review material; exclude policy pages and links from the public artifact | Proposed policies remain unapproved and inactive. |
| GitHub Pages production workflow | Do not restore | Main's CI-only safeguard remains. GitHub Actions validates but cannot publish Pages. |

## Deliberately resolved conflict set

The merge reported conflicts in the public workflow, `assets/main.js`, homepage, planner, WhatsApp test and all 140 tour HTML files. Public pages and catalogue pages use the approved website versions. The workflow uses main's CI-only control but invokes the Cloudflare artifact builder and the complete relevant test suite. WhatsApp form handoff uses the main branch's same-tab anchor behavior, while retaining the feature's message composition and public functionality. No admin/Supabase conflict was accepted from the feature branch.

## Release controls retained

- No automatic GitHub Pages publishing job or Pages write permission.
- No Cloudflare deployment command in GitHub Actions.
- No production DNS, custom domain, or Cloudflare production setting changes.
- Legal drafts are not included in the public artifact.
- The exact seven uncleared image files are filtered by the Cloudflare artifact builder; approved hero and catalogue photos remain.
- The staging noindex header rules are scoped to the staging hostnames and do not target `modiholidays.in`.

## Validation status

Completed locally on 2026-11-25:

- Python 3.12.10 `build_site.py`: passed; generated 140 tour pages and four catalogue pages, then preserved the approved homepage.
- `scripts/prepare-seo.cjs`: passed; refreshed 140 catalogue pages and the production sitemap.
- Python `scripts/validate.py`: passed; 140 unique packages (88 Domestic, 9 Pilgrimage, 43 International), 140 image-manifest records, 156 static pages and link/metadata/JSON-LD/navigation/catalogue checks.
- `scripts/build-cloudflare-pages.cjs dist`: passed; artifact has 140 tour pages, 149 sitemap URLs and 522 files.
- Node regression suites: **36 passed, 0 failed** across WhatsApp, SEO, homepage preservation/search, prototype interactions, public artifact exclusions and workflow safety.
- Browser: local artifact and approved Preview each returned HTTP 200 at 390, 768, 1024 and 1440 CSS px. At all widths, `documentElement.scrollWidth === innerWidth`; hero headline, descriptor, CTA and search controls stayed within viewport bounds; there were no broken `<img>` elements, console errors or failed network requests. Cormorant Garamond and Manrope reported loaded.
- Browser interactions: Andaman / Domestic / November / 4 nights returned one exact package. Changing to 9 nights returned one consolidated no-match explanation, three relevant alternatives and a WhatsApp URL carrying destination/type/month/duration. Reset cleared the selected values. The synthetic lead form remained invalid until consent was checked; its WhatsApp handoff was intercepted locally, and its prefilled message contained only synthetic QA details. Nothing was sent to WhatsApp.
- The 390px and 1440px full-page screenshots of the built candidate and approved Preview were byte-identical (SHA-256 hashes matched), confirming visual parity at those two viewports. Evidence is saved outside the repository under the temporary workspace QA evidence folder.

GitHub Actions has not been run on this candidate because it has not been pushed or opened as a pull request. No website or Worker deployment, merge to `main`, DNS change or production release occurred. Local test success is not evidence of a deployed or production release.

# Modi Holidays — Deployment Safety Review

**Purpose:** Stage-only deployment safeguards, prepared on `release/deployment-safety`. No production deployment was run.

## Baseline and deployment risk

- GitHub reports `main` at `02af36b07bd73664e69daf13030086f3570b36cd` and `feature/website-homepage-approval` at `0e97ae8a4a2101e89f0a8bcc0decdd5c4c78a5c6`.
- The isolated local release checkout is based on `2c79b9a0489cb0600dbbf4623e24586b1bf52614`; its tree is exactly `5d8aac884a0a9aa405b0e61971ed8eb3b8e43819`, matching the reported `main` tree. Git could not fetch the signed `02af...` merge commit because local Git credentials returned `SEC_E_NO_CREDENTIALS`. The source content is tree-identical, but the local release branch does not have the exact `main` merge commit as its parent.
- GitHub repository metadata says Pages is enabled. Existing workflow run [41205587213](https://github.com/spacyes123/Modiholidays/actions/runs/41205587213) completed with both validation and deployment successful. Therefore the GitHub Pages path is active, not merely historical.
- The current main workflow deployed automatically on a push to `main`. It copied every root HTML file, `CNAME`, all `assets`, and `tours`; this could publish `admin.html`, unapproved policy pages, internal assets, and any uncleared photographs present in the source tree.
- `main` is reported as unprotected. The GitHub environment reviewer and deployment-branch rules for `github-pages` could not be read: GitHub CLI authentication is invalid in this environment, the integration cannot read the protected settings endpoints, and the environment endpoint was unavailable through the connector. Do not assume an approval gate exists.
- The failed local browser lookup for `modiholidays.in` returned `ERR_NAME_NOT_RESOLVED`; it does not establish whether Cloudflare currently serves production. Cloudflare production configuration was not verifiable here.

## Prepared safeguards

`.github/workflows/pages.yml` now:

1. Runs validation on pull requests, pushes to `main`, and pushes to this safety branch.
2. Builds/uploads a Pages artifact for inspection only on those CI runs; that does not publish a website.
3. Has no deploy path for ordinary pushes or pull requests.
4. Allows a deployment job only from a manual `workflow_dispatch` on `main` with `publish_production: true`, after validation succeeds.
5. Uses read-only permissions for validation and job-scoped `pages: write` / `id-token: write` permissions for the manual deployment job.
6. Targets the `github-pages` environment.

The workflow's manual trigger and confirmation input are source-level controls. **The separate human approval is not verified until a required reviewer is configured on the `github-pages` environment.** Before enabling this workflow for production use, require at least one independent reviewer, restrict deployment branches to `main`, and verify whether administrators can bypass the rule. `main` branch protection/ruleset should also require pull requests and successful checks; its current protection was reported disabled.

## Public artifact policy

`scripts/build-public-artifact.cjs` builds `dist/` from explicit public inputs rather than copying the repository root. It includes the ten approved public shell pages (including non-indexable `404.html`), all 140 published tour pages, the public catalogue and required runtime assets, approved image formats from the public image directories, `robots.txt`, and a filtered sitemap.

It excludes `admin.html`, `admin-app`, the editor script, owner-review/legal documents, `terms.html`, `privacy.html`, `cancellation.html`, `CNAME`, `image-queries.json`, `site-settings.json`, docs/review material, symlinks, secret-like configuration, and the seven denied photo stems:

`f89b15baf6d11ede`, `e0c10fecd0a1d461`, `8a5168c0a0034d70`, `543917baf6ca7c4b`, `f27ed012b0617351`, `73b13e168af9ad70`, `fa0f3652c190474d`.

Because the unapproved policy pages are omitted, matching footer list links are removed from the generated artifact. They are not changed in source. The sitemap is reduced from 152 to 149 URLs: the three removed URLs are `/terms.html`, `/privacy.html`, and `/cancellation.html`; all 140 tour URLs and nine remaining public indexable pages remain.

This builder is intentionally prepared against the current `main` tree. It does not import the approved feature branch's later website assets or redesign. Re-run the builder and review its explicit asset allowlist against the integrated website before any production release.

## Validation evidence

Locally, with Node `v22.23.5`:

- Public artifact builder: passed; output contained 509 files, 140 tour pages, and 149 sitemap URLs.
- Node tests: 9 passed, 0 failed across `scripts/whatsapp.test.cjs` and `scripts/public-artifact.test.cjs`.
- Artifact tests confirmed page count, sitemap targets/canonicals/indexability, no admin/private/policy/CNAME/review artifacts, no service-role/Turnstile secret markers, retention of the current main hero and all catalogue image references, and exclusion of all seven photo stems.
- Python 3.12 build and `scripts/validate.py`: **not run locally**. Python 3.12 and the `py` launcher are unavailable; the Windows Store `python.exe` shim fails to launch. The new GitHub workflow pins Python 3.12, but it cannot be run until the branch is pushed and CI executes.
- Workflow YAML/Actions validation: not run; no local YAML parser or `actionlint` is installed. GitHub Actions has not run for this unpushed branch.
- No deployment job was invoked; no deployment occurred.

## Release sequence

1. Restore authenticated Git fetch/push for `spacyes123/Modiholidays`, then rebase this isolated branch onto exact remote `main` SHA `02af36b...` (the current local base is tree-identical but not that merge commit).
2. Review the diff and push only `release/deployment-safety`.
3. Open a draft PR to `main`; wait for Python 3.12 CI and artifact inspection. Do not merge automatically.
4. In GitHub Settings, require independent reviewers for environment `github-pages`, restrict it to `main`, and verify bypass rules. Enable required PR review/checks for `main`.
5. Confirm whether Cloudflare or GitHub Pages is the actual production publisher and which system owns `modiholidays.in`. Do not change DNS or deploy until this is resolved and the public artifact is re-reviewed after website integration.
6. Only after explicit release approval, use the manual workflow dispatch on `main`, confirm `publish_production: true`, and satisfy the verified environment review.

## Readiness

**Prepared locally; not release-ready yet.** Ordinary pushes no longer reach a deploy job in the proposed workflow, and the local artifact passed its Node checks. Required blockers remain: exact-main ancestry/fetch, Python 3.12 CI, workflow syntax/Actions validation, GitHub environment reviewer and branch rules verification, actual production-host ownership verification, and review of the artifact after the approved feature website is integrated.

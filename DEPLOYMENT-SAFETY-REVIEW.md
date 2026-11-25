# Modi Holidays — Deployment Safety Review

**Purpose:** Stage-only deployment safeguards, prepared on `release/deployment-safety`. Cloudflare Pages is the sole intended production host. No production deployment was run.

## Baseline and deployment risk

- GitHub reports `main` at `02af36b07bd73664e69daf13030086f3570b36cd` and `feature/website-homepage-approval` at `0e97ae8a4a2101e89f0a8bcc0decdd5c4c78a5c6`.
- Existing draft PR [#5](https://github.com/spacyes123/Modiholidays/pull/5) is open and its remote branch head is `bf820f78158d6cb8a89999477cf1eae755a7502d`, directly based on `02af36b...`. This local worktree is still at `2c79b9a0489cb0600dbbf4623e24586b1bf52614`, whose tree is identical to `main` (`5d8aac884a0a9aa405b0e61971ed8eb3b8e43819`). Local Git fetch/push authentication is unavailable (`SEC_E_NO_CREDENTIALS`), so this CI-only revision has not been transferred to PR #5.
- GitHub repository metadata says Pages is enabled. Existing workflow run [41205587213](https://github.com/spacyes123/Modiholidays/actions/runs/41205587213) completed with both validation and deployment successful. Therefore the GitHub Pages path is active, not merely historical.
- The current main workflow deployed automatically on a push to `main`. It copied every root HTML file, `CNAME`, all `assets`, and `tours`; this could publish `admin.html`, unapproved policy pages, internal assets, and any uncleared photographs present in the source tree.
- `main` is reported as unprotected. The GitHub environment reviewer and deployment-branch rules for `github-pages` could not be read: GitHub CLI authentication is invalid in this environment, the integration cannot read the protected settings endpoints, and the environment endpoint was unavailable through the connector. Do not assume an approval gate exists.
- PR #5 is verified open and `draft: true`; its current remote commit still contains the manual deploy job, so it must remain unmerged until the CI-only revision is pushed and reviewed.
- The failed local browser lookup for `modiholidays.in` returned `ERR_NAME_NOT_RESOLVED`; it does not establish whether Cloudflare currently serves production. Cloudflare production configuration was not verifiable here.

## Prepared safeguards

`.github/workflows/pages.yml` now:

1. Runs validation on pull requests, pushes to `main`, and pushes to this safety branch.
2. Builds and tests the allowlisted public artifact locally inside the CI job; it does not upload a Pages artifact.
3. Contains only the `validate` job. There is no `workflow_dispatch`, deploy job, Pages publishing action, or Pages publishing permission.
4. Uses `contents: read` only.

GitHub Actions in this workflow cannot publish Pages. The current GitHub Pages deployment/settings are left untouched, as requested; this change does not unpublish the existing site. The repository's Pages source/settings still require owner review before deciding whether to disable that separate publishing path. `main` branch protection/ruleset should require pull requests and successful checks; its current protection was reported disabled.

## Public artifact policy

`scripts/build-public-artifact.cjs` builds `dist/` from explicit public inputs rather than copying the repository root. It includes the ten approved public shell pages (including non-indexable `404.html`), all 140 published tour pages, the public catalogue and required runtime assets, approved image formats from the public image directories, `robots.txt`, and a filtered sitemap.

It excludes `admin.html`, `admin-app`, the editor script, owner-review/legal documents, `terms.html`, `privacy.html`, `cancellation.html`, `CNAME`, `image-queries.json`, `site-settings.json`, docs/review material, symlinks, secret-like configuration, and the seven denied photo stems:

`f89b15baf6d11ede`, `e0c10fecd0a1d461`, `8a5168c0a0034d70`, `543917baf6ca7c4b`, `f27ed012b0617351`, `73b13e168af9ad70`, `fa0f3652c190474d`.

Because the unapproved policy pages are omitted, matching footer list links are removed from the generated artifact. They are not changed in source. The sitemap is reduced from 152 to 149 URLs: the three removed URLs are `/terms.html`, `/privacy.html`, and `/cancellation.html`; all 140 tour URLs and nine remaining public indexable pages remain.

This builder is intentionally prepared against the current `main` tree. It does not import the approved feature branch's later website assets or redesign. Re-run the builder and review its explicit asset allowlist against the integrated website before any production release.

## Validation evidence

Locally, with Node `v22.23.5`:

- Public artifact builder: passed; output contained 509 files, 140 tour pages, and 149 sitemap URLs.
- Node tests: 11 passed, 0 failed across `scripts/whatsapp.test.cjs`, `scripts/public-artifact.test.cjs`, and `scripts/workflow-safety.test.cjs`.
- Artifact tests confirmed page count, sitemap targets/canonicals/indexability, no admin/private/policy/CNAME/review artifacts, no service-role/Turnstile secret markers, retention of the current main hero and all catalogue image references, and exclusion of all seven photo stems.
- Workflow regression tests confirm PR/main validation remains enabled and no deploy job, Pages permission, deployment action, artifact publication, or manual deployment trigger exists.
- Python 3.12 build and `scripts/validate.py`: **not run locally**. Python 3.12 and the `py` launcher are unavailable; the Windows Store `python.exe` shim fails to launch. The new GitHub workflow pins Python 3.12, but it cannot be run until the branch is pushed and CI executes.
- Workflow YAML: parsed successfully with `js-yaml`. GitHub Actions has not run for this unpushed revision.
- No deployment job was invoked; no deployment occurred.

## Release sequence

1. Restore authenticated Git fetch/push for `spacyes123/Modiholidays`, fetch PR #5’s `bf820f...` head, and apply the reviewed CI-only changes as a fast-forward commit. Do not force-push.
2. Keep PR #5 in draft and wait for Python 3.12 CI and artifact checks. Do not merge automatically.
3. In GitHub Settings, verify Pages source and that no branch-source publisher bypasses this CI-only workflow. Keep the existing Pages site published as requested; do not change settings in this task.
4. Enable required PR review/checks for `main`. Confirm Cloudflare Pages is the sole intended production host and which system owns `modiholidays.in`; no DNS or Cloudflare changes are part of this task.
5. Re-review the artifact after the approved feature website is integrated. The workflow itself has no production deploy path.

## Readiness

**Prepared locally; not release-ready yet.** GitHub Actions is CI-only in this local revision and the local artifact and YAML checks passed. Required blockers remain: sync to the newer remote PR head without force-pushing, Python 3.12 GitHub Actions results, verification that GitHub Pages has no separate branch-source publishing path, and review of the artifact after the approved feature website is integrated. No `github-pages` approval gate is proposed because the workflow no longer deploys; the existing Pages site remains untouched.

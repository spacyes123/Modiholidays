# Modi Holidays

A static, enquiry-led travel website for **modiholidays.in**, retaining the existing forest-green, ivory and gold branding. No payments, booking engine, backend or automatic booking confirmation.

## Build and preview

Requires Python 3.10+. No dependencies are needed for building or static validation.

```sh
python build_site.py
python scripts/validate.py
python -m http.server 8000
```

Visit `http://localhost:8000`. Commit generated HTML, tour pages and sitemap alongside source changes. The builder reads the catalogue without rewriting it and produces repeatable output.

## Package editing

`assets/packages.json` is the central source: **140 unique records — 88 Domestic, 9 Pilgrimage, 43 International**. IDs and day-by-day itineraries are preserved; only image fields changed. IDs have historical gaps; do not renumber them.

All Packages contains 140 static cards. Domestic contains 97 under All tours, or 88 Domestic / 9 Pilgrimage when filtered. International contains 43. Every published package has its own static itinerary URL. Catalogues need neither pagination nor runtime fetching to show their cards.

Use GitHub's file editor or a local editor on a feature branch:

| Change | Edit |
| --- | --- |
| Name, category, destination, duration, route, summary | Corresponding fields in `assets/packages.json` |
| Itinerary | One complete day per string in `days`; include truthful sightseeing and overnight information |
| Unpublish / withdraw | Set `published: false`; keep its ID and record. The build removes its generated page and sitemap entry |
| Add | Copy a suitable record; assign a new unused ID and unique descriptive slug; write the route, duration and days; add an image-manifest entry for that ID |
| Featured homepage tours | `featuredPackageIds` in `assets/site-settings.json` |
| Homepage hero | `homeHeroPackageId` in `assets/site-settings.json` |
| Replace photo | Update the package's `image`, its manifest entry, both WebP files and attribution |
| Verified inclusions / exclusions | Set `inclusionsVerified` / `exclusionsVerified` to true only after business verification. Otherwise the data remains stored but is not shown as a confirmed offer |

Rebuild and validate after every edit. The validator deliberately locks the launch baseline of 140 records and the category totals. For an intentional addition, removal or category change, update these baseline assertions with the reviewed change. Unpublishing keeps the 140 source records; rendered counts adapt to publication status.

`admin.html` remains a browser-local JSON editor, not a secure backend. Save/download its JSON, replace the source file, rebuild and commit. Its image field now accepts local paths. The legacy editor regenerates slugs from names; edit JSON directly to preserve established public slugs.

## Photography and attribution

`assets/image-manifest.json` explicitly maps every package ID to a photograph, source page, author, licence, alt text, search phrase and review status. `assets/photos/` stores WebP versions at up to 1280px and 640px, without enlarging smaller originals. Cards use lazy loading and responsive sizing; itinerary heroes load eagerly. Visitors perform no runtime image search.

[IMAGE-CREDITS.md](IMAGE-CREDITS.md) lists all 140 sources. Photos retain their original CC BY, CC BY-SA, CC0 or public-domain terms; share-alike derivatives retain their respective terms. Visible credits link to the source and licence and disclose resize/cropping. Images illustrate destinations and do not promise a hotel or included activity.

Optional replacement sourcing: `scripts/source-images.cjs` requires Node and `sharp` (`npm install --no-save sharp`, or set `SHARP_PATH` to an existing installation). `assets/image-queries.json` documents destination and itinerary queries. The tool checks metadata and downloads/optimises candidates. **Manually check each new photo against its source and itinerary before publishing.** The current set was source-checked and visually reviewed; this does not warrant third-party upload provenance.

## Contacts — intentionally pending

Per the owner's instruction, `whatsappNumber`, `businessEmail` and `businessPhoneDisplay` in `assets/config.js` remain blank. The interface identifies setup as pending. Before launch, add verified details; WhatsApp accepts 10–15 digits including country code, without punctuation.

The form collects name, mobile, optional email, destination/package, dates, adults, children, departure city, budget and special requirements. It prepares a message and displays **Open WhatsApp with my enquiry**. The visitor must then press Send in WhatsApp; the website neither sends nor stores the enquiry. Missing configuration explicitly reports that nothing was sent. Package quote links preselect the itinerary.

For local message QA only, run `python scripts/enquiry-fixture.py` and open `/work/enquiry-configured.html`. This ignored fixture contains a test number: do not send messages through it or deploy `work/`.

## GitHub Pages and launch

`.github/workflows/pages.yml` builds and validates PRs. It stages public HTML, assets, tours, robots, sitemap and CNAME. Deployment uses GitHub Pages artifacts and OIDC only on `main` (or manual dispatch against main). A feature branch / PR does not deploy.

1. Push the feature branch and open a PR; review before merging.
2. In the existing repository's **Settings → Pages**, select **GitHub Actions**.
3. Retain `modiholidays.in` as the custom domain. Verify registrar DNS against GitHub's current instructions and enable HTTPS after validation.
4. Configure contacts and verify actual WhatsApp receipt before public launch.
5. Verify itinerary routing, nights, seasons, permits and arrangements with the business/suppliers. Existing itineraries remain suggested drafts; no new hotels, prices or guaranteed departures were invented.
6. Review actual company, privacy, cancellation and legal details.
7. Merge when ready, verify the actual Actions deployment and smoke-test the live domain.
8. Verify Google Search Console ownership, submit `https://modiholidays.in/sitemap.xml` and inspect representative URLs. No verification token was invented.
9. Test physical iOS/Android devices, Safari and Firefox; measure field Core Web Vitals after deployment.

The implementation uses GitHub Pages-compatible static assets. Live deployment, DNS, HTTPS, Search Console, actual message receipt and field performance are not verified from this local checkout. See [QA-REPORT.md](QA-REPORT.md) and [MODIFIED-FILES.md](MODIFIED-FILES.md). Older audit/update documents remain historical; this README and the current manifest/report describe the final implementation.

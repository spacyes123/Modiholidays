# Modi Holidays

A static, enquiry-led travel website for **modiholidays.in**, using the owner-approved Modi Holidays logo and Plum + Saffron identity. No payments, booking engine, backend or automatic booking confirmation.

## Approved brand identity

The original owner-supplied PNG is retained byte-for-byte in `assets/brand/modi-holidays-approved.png`, with its SHA-256 recorded in `assets/brand/provenance.json`. Header, footer, favicon and social assets use only resized copies of the complete approved artwork. The logo is never redrawn, recoloured, inverted, cropped or stretched. Its light background stays intact on a light panel within the plum footer.

Shared palette tokens in `assets/brand.css`: deep plum `#55234B`, saffron `#F39A24`, warm ivory `#FFF8F0`, soft plum `#8C4879` and charcoal `#29232B`. Primary buttons use dark text on saffron for readable contrast. The brand stylesheet loads after existing shared layout styles on all pages.

To regenerate only the faithful brand derivatives, use `scripts/prepare-brand.cjs` with Node and `sharp` (or `SHARP_PATH`). Existing destination photographs must not be regenerated for a branding update. Run `python scripts/validate-brand.py` after the normal validator to check preservation against the completed launch-preparation revision. See `REBRAND-REPORT.md` for review evidence and publication status.

## Build and preview

The production validation workflow uses Python 3.12 and Node.js 24. No Python dependencies are needed for the static site build or validation.

```sh
python build_site.py
node scripts/prepare-seo.cjs
python scripts/validate.py
node scripts/build-cloudflare-pages.cjs dist
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

`admin.html` and `assets/editor.js` are local-only authoring tools, not secure backend features. The strict Cloudflare artifact builder excludes them; do not publish them. For safe catalogue edits, edit source JSON directly, preserve existing IDs and slugs, then rebuild and validate.

## Photography and attribution

`assets/image-manifest.json` explicitly maps every package ID to a photograph, source page, author, licence, alt text, search phrase and review status. `assets/photos/` stores WebP versions at up to 1280px and 640px, without enlarging smaller originals. Cards use lazy loading and responsive sizing; itinerary heroes load eagerly. Visitors perform no runtime image search.

[IMAGE-CREDITS.md](IMAGE-CREDITS.md) lists all 140 sources. Photos retain their original CC BY, CC BY-SA, CC0 or public-domain terms; share-alike derivatives retain their respective terms. Visible credits link to the source and licence and disclose resize/cropping. Images illustrate destinations and do not promise a hotel or included activity.

Optional replacement sourcing: `scripts/source-images.cjs` requires Node and `sharp` (`npm install --no-save sharp`, or set `SHARP_PATH` to an existing installation). `assets/image-queries.json` documents destination and itinerary queries. The tool checks metadata and downloads/optimises candidates. **Manually check each new photo against its source and itinerary before publishing.** The current set was source-checked and visually reviewed; this does not warrant third-party upload provenance.

## Current public enquiry configuration

The approved public contacts in `assets/config.js` are WhatsApp `+91 76660 18401` and `modiholidays15@gmail.com`. The website enquiry form prepares a prefilled WhatsApp message. Visitors must press Send in WhatsApp themselves. The static website does not save enquiries to the CRM, send email, accept payment or confirm bookings. `publicEnquiryEndpoint` and `turnstileSiteKey` are blank; do not describe CRM intake as active.

The form uses entered name, mobile, optional email, destination/package, dates, traveller counts, departure city, budget and special requests to create the message. On handoff, WhatsApp receives the prefilled message URL; no enquiry is persisted by this static site. Package enquiry links can preselect an itinerary. There is no customer portal, online booking, checkout or payment gateway in the approved public launch.

## Cloudflare Pages deployment and launch

Cloudflare Pages is the intended host. GitHub Actions is CI-only: it runs the Python 3.12 site build and validation, SEO preparation, strict public-artifact assembly and Node regression tests. It does not publish GitHub Pages. The Pages output directory is `dist`; assemble it with `node scripts/build-cloudflare-pages.cjs dist` after building the catalogue, preparing SEO and validating. The strict builder checks the 140 tours and 149 sitemap URLs and excludes admin tools, private files, inactive policy pages, seven uncleared reference photos, `assets/editor.js` and CNAME.

Production has not been approved or deployed from this checkout. Before a release, obtain legal approval for policy publication and resolve the blockers in `LAUNCH-READINESS.md`. Then: (1) verify the release commit and CI, (2) confirm the Cloudflare Pages project, production branch and `dist` build configuration, (3) publish a preview and smoke-test it, (4) verify and preserve existing DNS and email records, (5) only after explicit owner approval attach `modiholidays.in` to the Pages project and verify HTTPS, (6) check live headers, canonicals, sitemap, WhatsApp handoff and all 140 tour pages, and (7) retain the prior successful Pages deployment for rollback. Do not use GitHub Pages deployment or connect/change DNS without approval.

Live project settings, DNS, email records and deployed response headers were not verifiable from the current local network/account session. No DNS, production setting or deployment was changed.

## Private operations dashboard

A protected Next.js/Supabase admin application is in [admin-app](admin-app/README.md), separate from the public artifact and requiring a server-capable host and owner-provisioned employee accounts. It is not required to host the public website. Staff can create an internal enquiry manually without public-site CRM intake, then create and save an itinerary linked to that record and create a quotation from the saved itinerary. A truly no-enquiry itinerary is not supported by the current schema/UI. No admin code or database settings were changed for this website-preparation task.

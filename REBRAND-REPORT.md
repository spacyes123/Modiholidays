# Modi Holidays — approved logo and Plum + Saffron rebrand

29 October 2026. Branch: `feature/plum-saffron-rebrand`, based on the completed launch work at `88282ca`. That work is also present in current `main` through merged PR #1. No automatic merge or deployment is part of this branding change.

## Design and implementation

- Preserved the supplied `Centered Modi Holidays Logo.png` byte-for-byte in `assets/brand/modi-holidays-approved.png`. Original and saved file share SHA-256 `d274cb251d002d4aa3148be6327dd7f0d7fb0b6e715539b901a29c6a3bcfe24b`.
- No logo redesign, cropping, recolouring, inversion, distortion, text replacement or alternate logo generation. Header/footer derivatives preserve the complete square artwork and its existing light background. The footer supplies a light panel against plum rather than making an unapproved dark logo variant.
- Added 256/512px PNG logo copies; 32/48px browser icons; 180px touch icon; 192/512px manifest icons; and a 1200×630 social asset containing the whole artwork with white side margins. Exact icon pixels were compared with a direct resize of the original and matched.
- Applied shared deep plum `#55234B`, saffron `#F39A24`, warm ivory `#FFF8F0`, soft plum `#8C4879` and charcoal `#29232B` tokens throughout navigation, headings, photo overlays, cards, forms, focus/hover states, footer, editor and browser theme. The approved logo's own colours remain unchanged.
- Kept bright destination photography and light page backgrounds. Primary enquiry buttons use charcoal text on saffron, while decorative saffron accents and borders add warmth.
- Updated the static builder so every generated itinerary uses the same artwork, favicons, theme and final brand stylesheet. Root sharing metadata uses the approved brand asset; itinerary sharing keeps its destination image.

## Files changed

- `assets/styles.css`, `assets/launch.css`: migrate the previous green/gold theme to semantic plum/saffron tokens.
- `assets/brand.css`: shared final branding, logo sizing, light/dark application, accessible controls and responsive treatment.
- `assets/brand/*`: approved original, faithful logo/icon/social derivatives, manifest and artwork provenance.
- `build_site.py`: reusable approved-logo markup and consistent brand metadata/style loading.
- All 15 root HTML pages and 140 itinerary HTML pages: regenerated shared branding only; existing catalogue and itinerary content preserved.
- `scripts/prepare-brand.cjs`: deterministic artwork resizing; `scripts/validate-brand.py`: preservation, branding and contrast regression checks.
- `README.md`: current brand maintenance instructions. This report records the change separately from the historical launch QA report.

## Validation results

- Existing catalogue/static validator passed: **140 unique packages, 88 Domestic, 9 Pilgrimage, 43 International**, and local links/metadata/structured-data checks across **155 HTML pages**.
- Regression checks verified exact preservation of the complete package JSON, all **280 destination WebP files**, image manifest, image credits, catalogue/enquiry scripts, sitemap and GitHub Pages workflow against the completed launch revision.
- Page titles, descriptions, canonicals and parsed JSON-LD remained identical on all 155 pages. Only brand-related theme, icon, stylesheet, logo and root sharing-image metadata changed.
- The original PNG checksum matches the supplied attachment. All nine derived/original PNG files decoded successfully; all five icon sizes exactly match direct source resizing.
- Tested contrast ratios: body 15.33:1; headings 11.54:1; primary CTA 6.91:1; secondary accent text 6.01:1; footer body 9.70:1; footer highlights 9.11:1. These tested text pairs exceed 4.5:1.
- Browser checked homepage, catalogue, enquiry and itinerary at 320, 390, 768, 1024 and 1440px: **20 layouts**, no horizontal overflow, correct approved logo and plum browser theme.
- Desktop and mobile dropdowns opened, and Escape closed them. Filters showed 140 total, 88 Domestic, 4 Sikkim & Darjeeling and 1 Krabi result. Search/reset and count changes worked.
- Enquiry form retained package preselection and clearly reported that no message was sent while the business number remains unconfigured. No outbound message was sent. Core enquiry/WhatsApp JavaScript is unchanged.
- No warnings or errors appeared in the tested browser flows. Matching desktop/mobile before-and-after screenshots, plus a footer screenshot, were saved as review artifacts outside the deployed source.

## Remaining setup and scope

Phone, email and WhatsApp remain intentionally pending per the owner's earlier instruction. Configure and test real receipt before launch. Physical devices, Safari/Firefox, full assistive-technology audits and field Core Web Vitals were not tested in this change. The supplied full logo becomes small in a 32px favicon; no unapproved simplified mark was created to change that.

The existing Pages configuration is unchanged. Publishing this feature branch or opening a PR must not be treated as permission to merge or deploy it. GitHub delivery results and any permission blocker are reported separately in the chat after the final push attempt.

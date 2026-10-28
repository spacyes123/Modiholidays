# Modi Holidays — package editing and SEO deployment

## What works now
- 59 draft packages, searchable by Domestic / International and destination.
- 59 static, search-indexable tour pages under `tours/` with unique canonical URLs, descriptive metadata, TouristTrip / BreadcrumbList / FAQPage structured data and sitemap entries.
- Detailed day-wise drafts, hotel category, meals, transport, inclusions and exclusions. All arrangements remain subject to confirmation; no prices are displayed.
- `admin.html` is a **local package editor**, not a secure internet admin panel. Do **not** expose it as a private or secure management system. It contains no login, server database or direct online publishing.

## Editing packages
1. On your Mac, extract this ZIP and start the local server in the project folder: `python3 -m http.server 8004`.
2. Open `http://localhost:8004/admin.html` in Chrome.
3. Choose **Open packages.json for editing** and select the `assets/packages.json` file in the extracted project folder. (Or choose **Load included catalogue**.)
4. Edit any package, add new packages or hide drafts. Click **Apply changes to catalogue**.
5. Click **Save to selected JSON file**. If file writing is unavailable, click **Download updated packages.json**, then move the downloaded file into `assets/` replacing the old one.
6. Stop the server (Control+C), run `python3 build_site.py` from the project folder, then restart the server. This regenerates the indexed `tours/` HTML pages and sitemap.
7. Upload updated files to GitHub. Publishing requires a GitHub commit/deployment; editing locally does not change the live website.

## Before public launch
- Confirm WhatsApp number and email in `assets/config.js`.
- Confirm all sightseeing, routing, hotel categories, meals, transport, permits and policies. Draft content is not supplier-confirmed.
- Confirm image licenses. Some image URLs are externally hosted and may fail offline.
- Verify domain ownership and GitHub Pages DNS/HTTPS.
- Avoid claiming verified reviews, ratings, guarantees, specific hotel reservations or fixed departures unless documented.
- `admin.html` can be removed from the published repository if you prefer to keep the local editor private. Its source is public on static hosting even if it is noindexed.

## SEO / GEO / AEO
- Static HTML tour pages expose readable content to crawlers without requiring JavaScript.
- Individual titles, meta descriptions, canonical URLs and XML sitemap entries are generated.
- FAQ and TouristTrip schema are included; search engines decide whether to use them.
- Keep real, original travel information up to date; avoid copying competitors' package text or images.
- Submit sitemap at `https://modiholidays.in/sitemap.xml` to Google Search Console and Bing Webmaster Tools after launch.
- Static tour pages regenerate after JSON edits. This is important; the live site does not automatically rebuild pages from JSON.

## Future full online dashboard
For edit-and-publish from anywhere, add authenticated CMS hosting (e.g. Supabase + role-based access or a managed headless CMS) and a build/deploy hook. This ZIP does not pretend to have a secure online backend.

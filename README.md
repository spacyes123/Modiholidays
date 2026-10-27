# Modi Holidays — Website

A responsive, static website for Modi Holidays. English-language, enquiry-led travel website for Mumbai launch and pan-India customers.

## Features
- Premium forest-green, ivory and gold visual identity
- Responsive mobile navigation
- Domestic, international, group and pilgrimage tour categories
- Destination/package detail pages with indicative pricing wording
- Enquiry form that prepares a WhatsApp message (no booking engine or online payment)
- Editable contact details and WhatsApp number in `assets/config.js`
- Basic SEO metadata, sitemap, robots file, privacy/cancellation/terms starter pages
- GitHub Pages deployment workflow

## Before launch — required configuration

1. Open `assets/config.js`.
2. Replace `WHATSAPP_NUMBER` with the business WhatsApp number in international format, digits only, e.g. `919876543210`.
3. Replace `BUSINESS_EMAIL`, `BUSINESS_PHONE_DISPLAY`, and the business address/operating hours if needed.
4. Review all tour information, itinerary and indicative pricing. Package details are illustrative starting content, not confirmed live offers.
5. Review legal pages with an Indian professional and replace placeholder company/contact details.
6. Replace any sample testimonials only with genuine reviews used with permission.
7. Use original/licensed images and check image licensing before commercial launch. The current design uses remote Unsplash image URLs for prototype imagery.
8. Check that `modiholidays.in` is registered to the business and configure DNS after hosting is selected.

## Run locally
No build step required. Open `index.html` in a browser, or run a local static server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish on GitHub Pages

1. Create a new GitHub repository named `modi-holidays-website` (or another name you prefer).
2. Upload all files and folders in this project to the repository root. Do not upload the ZIP itself as the only repository file.
3. In GitHub, go to **Settings → Pages**.
4. Under build and deployment, choose **GitHub Actions**. The included workflow `.github/workflows/pages.yml` deploys the static site.
5. After the workflow succeeds, GitHub will show the Pages URL.
6. For a custom domain, go to **Settings → Pages → Custom domain**, enter `modiholidays.in`, and follow GitHub's current DNS instructions at your domain registrar.
7. Configure the apex-domain A records / recommended DNS records exactly as GitHub currently documents, and add a `www` CNAME if you want `www.modiholidays.in`. DNS changes may take time to propagate.
8. Enable HTTPS in GitHub Pages once the DNS check passes.

**Important:** GitHub Pages is static hosting. The enquiry form does not store submissions on a server; it opens WhatsApp with the visitor's details pre-filled. A working WhatsApp number must be configured first.

## Project structure

```text
modi-holidays/
├── index.html
├── domestic-holidays.html
├── international-holidays.html
├── group-tours.html
├── pilgrimage-tours.html
├── plan-my-holiday.html
├── about.html
├── contact.html
├── privacy.html
├── terms.html
├── cancellation.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── CNAME
├── assets/
│   ├── config.js
│   ├── main.js
│   ├── styles.css
│   └── logo.svg
└── .github/workflows/pages.yml
```

## Important notes
- No online booking engine, payment gateway, live availability, or automatic quote engine is included.
- All package pricing and availability must be confirmed manually before accepting a booking.
- The enquiry form currently sends information to WhatsApp; don't collect unnecessary sensitive personal information.
- Add real business registration, contact, tax, and policy details before launch.


## Package catalogue (v2)
The `packages.html` listing and `package.html?id=MH-001` detail pages read from `assets/packages.json`. To add or edit a package, update that JSON file and commit to GitHub. This is **not** an admin backend; changes require GitHub editing. The day-wise itineraries are illustrative planning drafts and must be verified with suppliers before selling. Prices and departures are not confirmed.

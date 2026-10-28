# Destination photography — important

This build replaces the repeated generic illustrations with real destination photography **when the visitor has an internet connection and Wikimedia Commons returns a suitable freely licensed image**.

The website uses 56 destination-specific search phrases and retrieves Wikimedia Commons photographs. Each loaded photograph has a source and license attribution link below it. Images load on all package listings, Domestic and International listings, and individual itinerary pages.

The original local destination illustrations remain as offline / failed-lookup fallbacks. This ZIP does NOT bundle actual photographs, because this build environment could not access the image-hosting network to download and verify them. Online photo matches are not individually verified and must be reviewed before production.

For fully reliable offline photographs, manually obtain licensed photos, store them in `assets/photos/`, change the `image` field in `assets/packages.json`, and remove `data-destination` from the rendered HTML / JS or disable `destination-photos.js`. Preserve photographer and license attribution.

Images are illustrative destination photos, not guaranteed hotels or activities.

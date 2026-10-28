# Image status and next steps

The previous ZIP used a generic travel photograph on many packages. This version replaces those incorrect photographs with **locally bundled destination-labelled illustrations**. These illustrations are placeholders, not actual destination photography. They work offline and do not rely on unpredictable third-party image lookups.

To publish a photographic website, collect licensed, destination-accurate images, save them in `assets/destinations/`, and update each package `image` property in `assets/packages.json`. Regenerate static pages using `python3 build_site.py` and check that the generated pages use the selected images. Images must be verified and licensed before publishing.

# Web photographs

Run from the website checkout:

```powershell
py -X utf8 scripts/optimize-photos.py
```

The generator uses the installed Chrome or Edge browser's native encoder to
produce WebP copies under `images/photography/web/`, plus the generated
`data/photo-variants.js` manifest. Python 3.8+ is enough; no imaging packages or
website server dependencies are installed. The temporary local server and
headless browser close when generation finishes.

- 480 px and 960 px wide previews use quality 80/82.
- Enlargement copies are at most 1920 px wide, quality 88.
- Smaller originals are never upscaled. Aspect ratio, browser-decoded image
  orientation, and transparency are preserved.
- Source hashes skip unchanged photographs on subsequent runs.
- Original files and the original paths in `photo-data.js` remain untouched.

After adding or replacing an original in `photo-data.js`, run the generator and
commit the generated files with the website changes. New photos without generated
copies still work using their original source as a fallback.

`photo-images.js` selects responsive previews for the collage and travel cards.
It switches to the enlargement copy only on a photo click. The homepage's three
preview images also use WebP `srcset`, `sizes`, and lazy loading; if those photos
are replaced, update their HTML attributes to match the generated manifest.

The collage reserves each photograph's aspect ratio before loading. Its in-place
enlargement does not change the masonry layout while a larger copy downloads.

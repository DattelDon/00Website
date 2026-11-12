# Travel globe geography

`globe-geography.js` contains rounded longitude/latitude coastline and land-border
lines, plus land-surface samples for the holographic globe. It is bundled locally;
visitors do not need an API, account, or external map service.

Source: Natural Earth, 1:110m resolution, public domain.

Java, Bali, and nearby small islands use the more detailed 1:50m land outlines,
with matching land dots, so Bali is separate from Java. The rest of the globe
keeps its original 1:110m geometry.

- https://www.naturalearthdata.com/about/terms-of-use/
- https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson
- https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_boundary_lines_land.geojson
- https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_land.geojson

The map is decorative and is not intended for navigation or precise boundaries.

# Adding photographs and destinations

Edit `photo-data.js` in the website root. Both the collage and the globe read this
catalogue, including when the HTML files are opened directly from disk.

1. Add a country to `countries` if needed: `id`, `name`, `label`, representative
   `latitude` / `longitude`, and a country-view `zoom` (typically 3–6).
2. Add a destination to `locations` with a unique `id`, `name`, `label`,
   `country` matching a country ID, `latitude`, `longitude`, and a human-readable `precision` (for example,
   `Country-level location` or `Island-level location`).
3. Add or edit a photo in `photos`: give it a unique `id`, its image `src`, an
   accessible `alt` description, and `location` matching the destination ID.
4. Omit `location` for photos whose location has not been identified yet.

Example photo:

```js
{
    id: "rainbowrhinos",
    src: "images/photography/rainbowrhinos.JPG",
    alt: "Rhinos with rainbow",
    location: "south-africa"
}
```

The gallery generates `<figure class="gallery-item" data-location="south-africa">`
from this entry. Adding more photos to that location enables the destination's
previous/next controls automatically. Only destinations with tagged photos appear
on the globe. Marker coordinates describe the destination, not an exact camera
position. All 36 photos are tagged across 10 destinations: South Africa,
Tanegashima, Biarritz, Kyoto, Anchor Point, Bali, Kagoshima, Switzerland, Tokyo,
and Taghazout. Uji / Byodo-in is grouped under Kyoto as requested.

`coordinateSource` on the added destination records links to the coordinate
reference (GeoNames, or the regional tourism board for Anchor Point). The
coordinates describe representative places, not the exact camera positions.
The globe first shows one pin per country. Selecting a country smoothly rotates
and zooms toward it; only then do its destination pins appear. Anchor Point and
Taghazout therefore appear only inside Morocco, and the four Japanese
destinations appear only inside Japan. The sidebar follows the same hierarchy.
The World button in the globe controls, Back to world in the sidebar, or Escape
returns to the country overview. Country-only geotags (South Africa and
Switzerland) open their photographs without inventing a city. Gallery deep links
still open the correct destination and its country automatically.

`locationNote` preserves uncertain assignments: Protecting Arms is provisionally
Kyoto; MossyHead is assigned Kyoto by interpreting the repeated “Massive” in the
spoken list according to the catalogue order. A note appears with those photos.

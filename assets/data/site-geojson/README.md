# Atlas Site GeoJSON

This directory stores local/static map data for the Project Atlas. The public website should load only these files; it should not call Overpass, Google Maps, Google Earth, raster tile servers, or other live map APIs at runtime.

Run this from the repository root to build all Atlas map data:

```sh
npm run atlas:data
```

That command:

- builds `assets/data/atlas-global-land-dots.json` from Natural Earth land geometry
- fetches local OpenStreetMap vector data from Overpass for each sited project
- writes one `{slug}.geojson` file per site when data is available
- writes `manifest.json` with `ok`, `missing`, or `error` status for each site

If network access is blocked, the scripts fail gracefully and the Atlas displays fallback messaging such as:

`Detailed site data has not been added for this project yet.`

Expected local files:

- `enfield-food-pantry.geojson`
- `borinquen-healing-center.geojson`
- `design-district-canteen.geojson`
- `hunters-point-housing.geojson`
- `curanto-cookhouse.geojson`
- `wood-street-pool.geojson`
- `sustainable-education.geojson`

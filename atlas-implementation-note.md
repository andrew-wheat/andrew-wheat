# Work Atlas Tester Note

`atlas-tester.html` is an isolated tester page for a future Atlas view of the Work page.

The final target is `work.html` as an alternate Work view alongside Grid, List, and Atlas. The eventual Atlas control is expected to use `@`.

The homepage is out of scope for this prototype. This branch does not add the tester to public navigation, `index.html`, the homepage carousel, homepage vellum, Work grid/list/filter behavior, About, Contact, or existing project rendering.

Current Atlas positions use the abstract `position` metadata already present in `assets/js/projects.js`. Local detail, true site outlines, neighborhoods, parcels, water edges, and project-specific geographic overlays require real GeoJSON/site data before this becomes a production Work view.

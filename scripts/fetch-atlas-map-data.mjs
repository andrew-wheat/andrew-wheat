import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ATLAS_DATA = path.join("assets", "data", "project-atlas.json");
const OUTPUT_DIR = path.join("assets", "data", "site-geojson");
const MANIFEST = path.join(OUTPUT_DIR, "manifest.json");
const OVERPASS_URL = process.env.ATLAS_OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const FETCHED_AT = new Date().toISOString();
const USER_AGENT = "AndrewWheatPortfolioAtlas/0.1 (+https://andrew-wheat.com; contact: andrewwheat3@gmail.com)";
const DEFAULT_CONTEXT_RADIUS_METERS = 450;
const DEFAULT_SITES = [
  { title: "Enfield Food Pantry", slug: "enfield-food-pantry", lat: 42.422528, lng: -76.573472, radiusMeters: 450 },
  { title: "Borinquen Healing Center", slug: "borinquen-healing-center", lat: 18.485750, lng: -67.164139, radiusMeters: 450 },
  { title: "Design District Canteen", slug: "design-district-canteen", lat: 51.500139, lng: 0.005722, radiusMeters: 450 },
  { title: "Hunters Point Housing", slug: "hunters-point-housing", lat: 40.743694, lng: -73.952472, radiusMeters: 450 },
  { title: "Curanto Cookhouse", slug: "curanto-cookhouse", lat: -41.882778, lng: -73.988194, radiusMeters: 450 },
  { title: "Wood Street Pool", slug: "wood-street-pool", lat: 42.432139, lng: -76.506639, radiusMeters: 450 },
  { title: "Sustainable Education", slug: "sustainable-education", lat: 27.934722, lng: 84.405278, radiusMeters: 450 }
];

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const sites = await loadSites();
  const manifest = [];

  for (const site of sites) {
    const filename = `${site.slug}.geojson`;
    const entry = {
      slug: site.slug,
      title: site.title,
      lat: site.lat,
      lng: site.lng,
      radiusMeters: site.radiusMeters,
      filename,
      source: "OpenStreetMap",
      fetchedAt: FETCHED_AT,
      featureCount: 0,
      status: "missing"
    };

    try {
      console.log(`[atlas:fetch] Fetching ${site.title}`);
      const overpass = await fetchOverpass(site);
      const geojson = overpassToGeojson(overpass, site);
      entry.featureCount = geojson.features.length;
      entry.status = geojson.features.length ? "ok" : "missing";
      await writeFile(path.join(OUTPUT_DIR, filename), `${JSON.stringify(geojson)}\n`);
      console.log(`[atlas:fetch] Wrote ${entry.featureCount} features to ${filename}`);
    } catch (error) {
      entry.status = "error";
      entry.error = error.message;
      console.warn(`[atlas:fetch] ${site.slug} failed: ${error.message}`);
    }

    manifest.push(entry);
    await delay(1400);
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[atlas:fetch] Wrote manifest to ${MANIFEST}`);
}

async function loadSites() {
  try {
    const projects = JSON.parse(await readFile(ATLAS_DATA, "utf8"));
    const sited = projects
      .filter((project) => project.atlasType === "sited" && Number.isFinite(project.lat) && Number.isFinite(project.lng))
      .map((project) => ({
        title: project.title,
        slug: project.slug,
        lat: project.lat,
        lng: project.lng,
        radiusMeters: project.siteContextRadiusMeters || project.radiusMeters || DEFAULT_CONTEXT_RADIUS_METERS
      }));
    return sited.length ? sited : DEFAULT_SITES;
  } catch {
    return DEFAULT_SITES;
  }
}

async function fetchOverpass(site) {
  const bbox = bboxFromRadius(site.lat, site.lng, site.radiusMeters);
  const query = `
    [out:json][timeout:40];
    (
      way["building"](${bbox});
      relation["building"](${bbox});
      way["highway"](${bbox});
      relation["highway"](${bbox});
      way["waterway"](${bbox});
      relation["waterway"](${bbox});
      way["natural"~"water|coastline"](${bbox});
      relation["natural"~"water|coastline"](${bbox});
      way["landuse"](${bbox});
      relation["landuse"](${bbox});
      way["leisure"](${bbox});
      relation["leisure"](${bbox});
      way["boundary"](${bbox});
      relation["boundary"](${bbox});
    );
    out body;
    >;
    out skel qt;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": USER_AGENT
    },
    body: new URLSearchParams({ data: query })
  });
  if (!response.ok) throw new Error(`Overpass ${response.status} ${response.statusText}`);
  return response.json();
}

function overpassToGeojson(overpass, site) {
  const nodes = new Map();
  const ways = new Map();
  const features = [];

  for (const element of overpass.elements || []) {
    if (element.type === "node") nodes.set(element.id, element);
    if (element.type === "way") ways.set(element.id, element);
  }

  for (const way of ways.values()) {
    if (!isUseful(way.tags)) continue;
    const coordinates = (way.nodes || [])
      .map((id) => nodes.get(id))
      .filter(Boolean)
      .map((node) => [round(node.lon), round(node.lat)]);
    if (coordinates.length < 2) continue;
    const compacted = compactCoordinates(coordinates);
    if (compacted.length < 2) continue;
    const closed = compacted.length > 3 && sameCoord(compacted[0], compacted[compacted.length - 1]);
    features.push(feature(site, way, {
      type: closed ? "Polygon" : "LineString",
      coordinates: closed ? [compacted] : compacted
    }));
  }

  for (const relation of (overpass.elements || []).filter((element) => element.type === "relation")) {
    if (!isUseful(relation.tags)) continue;
    const rings = (relation.members || [])
      .filter((member) => member.type === "way" && member.role !== "inner")
      .map((member) => ways.get(member.ref))
      .filter(Boolean)
      .map((way) => compactCoordinates((way.nodes || []).map((id) => nodes.get(id)).filter(Boolean).map((node) => [round(node.lon), round(node.lat)])))
      .filter((coords) => coords.length > 3);
    for (const ring of rings) {
      features.push(feature(site, relation, {
        type: sameCoord(ring[0], ring[ring.length - 1]) ? "Polygon" : "LineString",
        coordinates: sameCoord(ring[0], ring[ring.length - 1]) ? [ring] : ring
      }));
    }
  }

  return {
    type: "FeatureCollection",
    name: site.slug,
    features
  };
}

function feature(site, element, geometry) {
  const tags = element.tags || {};
  const height = buildingHeight(tags);
  return {
    type: "Feature",
    properties: {
      source: "OpenStreetMap",
      fetchedAt: FETCHED_AT,
      siteSlug: site.slug,
      siteTitle: site.title,
      featureClass: featureClass(tags),
      osmType: element.type,
      osmId: element.id,
      heightMeters: height.heightMeters,
      heightSource: height.heightSource,
      tags: compactTags(tags)
    },
    geometry
  };
}

function buildingHeight(tags = {}) {
  if (!tags.building) return { heightMeters: null, heightSource: "none" };
  const heightMeters = parseHeightMeters(tags.height);
  if (heightMeters) return { heightMeters, heightSource: "height" };
  const levels = Number.parseFloat(tags["building:levels"]);
  if (Number.isFinite(levels) && levels > 0) {
    return { heightMeters: round(levels * 3.2, 2), heightSource: "building:levels" };
  }
  return { heightMeters: null, heightSource: "none" };
}

function parseHeightMeters(value) {
  if (!value) return null;
  const text = String(value).trim().toLowerCase();
  const numeric = Number.parseFloat(text.replace(",", "."));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  if (text.includes("ft") || text.includes("'")) return round(numeric * 0.3048, 2);
  return round(numeric, 2);
}

function featureClass(tags = {}) {
  if (tags.building) return "building";
  if (tags.highway) return ["footway", "path", "cycleway", "steps", "pedestrian"].includes(tags.highway) ? "path" : "road";
  if (tags.waterway || tags.natural === "water" || tags.natural === "coastline") return "water";
  if (tags.landuse || tags.leisure) return "landuse";
  if (tags.boundary) return "boundary";
  return "other";
}

function isUseful(tags = {}) {
  return Boolean(tags.building || tags.highway || tags.waterway || tags.natural || tags.landuse ||
    tags.leisure || tags.boundary);
}

function bboxFromRadius(lat, lng, radiusMeters) {
  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.max(0.2, Math.cos(lat * Math.PI / 180)));
  return [
    round(lat - latDelta, 7),
    round(lng - lngDelta, 7),
    round(lat + latDelta, 7),
    round(lng + lngDelta, 7)
  ].join(",");
}

function sameCoord(a, b) {
  return a && b && a[0] === b[0] && a[1] === b[1];
}

function compactCoordinates(coordinates) {
  const compacted = [];
  for (const coord of coordinates) {
    const previous = compacted[compacted.length - 1];
    if (!sameCoord(previous, coord)) compacted.push(coord);
  }
  return compacted;
}

function compactTags(tags = {}) {
  const usefulKeys = [
    "building",
    "highway",
    "waterway",
    "natural",
    "landuse",
    "leisure",
    "boundary",
    "height",
    "building:levels",
    "name",
    "surface",
    "foot",
    "access",
    "service"
  ];
  return usefulKeys.reduce((result, key) => {
    if (tags[key]) result[key] = tags[key];
    return result;
  }, {});
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function round(value, places = 6) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

main().catch((error) => {
  console.error(`[atlas:fetch] ${error.stack || error.message}`);
  process.exitCode = 1;
});

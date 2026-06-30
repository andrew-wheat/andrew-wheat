import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUTPUT = path.join("assets", "data", "atlas-global-land-dots.json");
const NATURAL_EARTH_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson";
const TARGET_DOT_COUNT = Number.parseInt(process.env.ATLAS_DOT_COUNT || "12000", 10);
const MAX_CANDIDATES = TARGET_DOT_COUNT * 9;

async function main() {
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  let land;
  try {
    land = await fetchJson(NATURAL_EARTH_URL);
  } catch (error) {
    console.warn(`[atlas:build-global] Could not fetch Natural Earth land data: ${error.message}`);
    await writeFile(OUTPUT, `${JSON.stringify([], null, 2)}\n`);
    console.warn("[atlas:build-global] Wrote an empty placeholder. TODO: rerun npm run atlas:data with network access.");
    return;
  }

  const polygons = flattenLandPolygons(land);
  const indexed = polygons.map((polygon) => ({
    polygon,
    bbox: polygonBbox(polygon[0] || [])
  }));
  const dots = [];

  for (let index = 0; index < MAX_CANDIDATES && dots.length < TARGET_DOT_COUNT; index += 1) {
    const candidate = fibonacciPoint(index, MAX_CANDIDATES);
    const polygon = indexed.find((item) => inBbox(candidate, item.bbox) && pointInPolygon(candidate, item.polygon));
    if (!polygon) continue;
    const grain = seededNoise(Math.round(candidate.lat * 1000), Math.round(candidate.lng * 1000));
    dots.push({
      lat: round(candidate.lat, 5),
      lng: round(candidate.lng, 5),
      size: round(0.7 + grain * 1.6, 2),
      opacity: round(0.24 + grain * 0.34, 2)
    });
  }

  await writeFile(OUTPUT, `${JSON.stringify(dots, null, 2)}\n`);
  console.log(`[atlas:build-global] Wrote ${dots.length} Natural Earth land dots to ${OUTPUT}`);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AndrewWheatPortfolioAtlas/0.1 (+https://andrew-wheat.com; contact: andrewwheat3@gmail.com)"
    }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function flattenLandPolygons(geojson) {
  const polygons = [];
  for (const feature of geojson.features || []) {
    const geometry = feature.geometry;
    if (!geometry) continue;
    if (geometry.type === "Polygon") polygons.push(geometry.coordinates);
    if (geometry.type === "MultiPolygon") polygons.push(...geometry.coordinates);
  }
  return polygons;
}

function fibonacciPoint(index, count) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / Math.max(1, count - 1)) * 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = goldenAngle * index;
  const x = Math.cos(theta) * radius;
  const z = Math.sin(theta) * radius;
  return {
    lat: Math.asin(y) * 180 / Math.PI,
    lng: Math.atan2(z, x) * 180 / Math.PI
  };
}

function pointInPolygon(point, polygon) {
  if (!polygon.length || !pointInRing(point, polygon[0])) return false;
  for (let index = 1; index < polygon.length; index += 1) {
    if (pointInRing(point, polygon[index])) return false;
  }
  return true;
}

function pointInRing(point, ring) {
  let inside = false;
  const x = point.lng;
  const y = point.lat;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonBbox(ring) {
  return ring.reduce((bbox, coord) => ({
    minLng: Math.min(bbox.minLng, coord[0]),
    minLat: Math.min(bbox.minLat, coord[1]),
    maxLng: Math.max(bbox.maxLng, coord[0]),
    maxLat: Math.max(bbox.maxLat, coord[1])
  }), { minLng: 180, minLat: 90, maxLng: -180, maxLat: -90 });
}

function inBbox(point, bbox) {
  return point.lng >= bbox.minLng && point.lng <= bbox.maxLng &&
    point.lat >= bbox.minLat && point.lat <= bbox.maxLat;
}

function seededNoise(x, y) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function round(value, places) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

main().catch((error) => {
  console.error(`[atlas:build-global] ${error.stack || error.message}`);
  process.exitCode = 1;
});

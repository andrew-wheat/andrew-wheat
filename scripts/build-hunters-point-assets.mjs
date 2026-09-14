import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const sourceDirectory = path.join(
  projectRoot,
  "assets",
  "images",
  "Projects",
  "Hunter's Point Cooperative Housing",
);
const optimizedDirectory = path.join(projectRoot, "assets", "images", "optimized");

const digestFor = async (sourcePath, operation = "") => {
  const source = await readFile(sourcePath);
  return createHash("sha1").update(source).update(operation).digest("hex").slice(0, 10);
};

const renderings = [
  ["hero.png", "hero"],
  ["Front Facade Render More Saturated.png", "front-facade-render-more-saturated"],
];

for (const [sourceName, slug] of renderings) {
  const sourcePath = path.join(sourceDirectory, sourceName);
  const digest = await digestFor(sourcePath, "width:2400;webp:84");
  const outputName = `${slug}-${digest}.webp`;
  const info = await sharp(sourcePath)
    .rotate()
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 90, effort: 5 })
    .toFile(path.join(optimizedDirectory, outputName));
  console.log(JSON.stringify({ type: "rendering", sourceName, outputName, ...info }));
}

const drawings = [
  "Section Perspective render.png",
  "Long Site Section render.png",
  "Long Section render.png",
  "Long Elevation render.png",
];

for (const sourceName of drawings) {
  const sourcePath = path.join(sourceDirectory, sourceName);
  const operation = "trim:white:8;extend:2;webp:88";
  const digest = await digestFor(sourcePath, operation);
  const outputName = `${path.parse(sourceName).name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-cropped-${digest}.webp`;
  const info = await sharp(sourcePath)
    .rotate()
    .trim({ background: "#ffffff", threshold: 8 })
    .extend({ top: 2, right: 2, bottom: 2, left: 2, background: "#ffffff" })
    .webp({ quality: 88, alphaQuality: 95, effort: 5 })
    .toFile(path.join(sourceDirectory, outputName));
  console.log(JSON.stringify({ type: "drawing", sourceName, outputName, ...info }));
}

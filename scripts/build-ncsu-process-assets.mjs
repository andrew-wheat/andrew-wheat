import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const sourceDirectory = path.resolve(
  projectRoot,
  "..",
  "assets",
  "images",
  "Projects",
  "NCSU Cates West Development",
);
const outputDirectory = path.join(projectRoot, "assets", "images", "optimized");

await mkdir(outputDirectory, { recursive: true });

for (const number of [1, 2, 3]) {
  const source = path.join(sourceDirectory, `process ${number}.jpg`);
  const output = path.join(outputDirectory, `ncsu-cates-west-process-${number}.webp`);
  const info = await sharp(source)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(output);
  console.log(`${path.basename(output)}: ${info.width}x${info.height}, ${info.size} bytes`);
}

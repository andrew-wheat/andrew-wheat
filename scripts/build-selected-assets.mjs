import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const sourceRoot = path.resolve(projectRoot, "..", "assets", "images");
const outputRoot = path.join(projectRoot, "assets", "images", "selected");
const manifestPath = path.join(projectRoot, "assets", "js", "selected-collections.js");
const categories = ["models", "photography", "sketchbook", "renderings"];
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const hiddenSelectedAssets = {
  renderings: new Set(["exterior 2 edited noisy copy.jpg"])
};
const projectTitles = {
  models: {
    "1.png": "Hunter's Point Cooperative Housing",
    "3x6a0205.png": "Enfield Food Pantry",
    "3x6a0280 cropped smaller.png": "Enfield Food Pantry",
    "andrew wheat_ajw288_01b_study model (1).jpg": "Curanto Cookhouse",
    "andrew wheat_ajw288_problem 03c_final model (15).png": "Borinquen Healing Center",
    "do4a0315.png": "[de]construct + [re]configure",
    "hero 2.jpg": "Curanto Cookhouse",
    "main hero shot.png": "A Chair is a Toy!",
    "model 01 cropped.png": "[de]construct + [re]configure",
    "model front view shot 03 reduced.png": "Design District Canteen",
    "model full shot.png": "Hunter's Point Cooperative Housing",
    "work cover photo.png": "Enfield Food Pantry"
  },
  sketchbook: {
    "20231129_andrew wheat_a04_isosection.png": "Woven Pavilion",
    "andrew wheat_ajw288_cookhouse program diagram cropped.png": "Curanto Cookhouse",
    "iso_section_clean_scan.jpg": "Woven Pavilion"
  },
  renderings: {
    "andrew wheat_ajw288_03c_exterior render 02.jpg": "Borinquen Healing Center",
    "andrew wheat_ajw288_03c_interior render.jpg": "Borinquen Healing Center",
    "corridor render.png": "Hunter's Point Cooperative Housing",
    "exterior 2 edited noisy copy.jpg": "Sustainable Education Nepal",
    "hero 2.png": "Wood Street Pool",
    "hero.png": "Wood Street Pool",
    "market render.png": "Hunter's Point Cooperative Housing",
    "updated pantry interior.webp": "Enfield Food Pantry"
  }
};

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";
}

function projectTitle(filename, category) {
  return (
    projectTitles[category]?.[filename.toLowerCase()] ||
    `${category.charAt(0).toUpperCase()}${category.slice(1)}`
  );
}

const manifest = Object.fromEntries(categories.map((category) => [category, []]));

for (const category of categories) {
  const sourceDirectory = path.join(sourceRoot, category);
  const outputDirectory = path.join(outputRoot, category);
  await mkdir(outputDirectory, { recursive: true });

  let entries = [];
  try {
    entries = await readdir(sourceDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const files = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        supportedExtensions.has(path.extname(entry.name).toLowerCase()) &&
        !hiddenSelectedAssets[category]?.has(entry.name.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
  const expectedOutputs = new Set();

  for (const file of files) {
    const sourcePath = path.join(sourceDirectory, file.name);
    const sourceBuffer = await readFile(sourcePath);
    const digest = createHash("sha1").update(sourceBuffer).digest("hex").slice(0, 8);
    const outputName = `${slugify(path.parse(file.name).name)}-${digest}.webp`;
    const outputPath = path.join(outputDirectory, outputName);
    expectedOutputs.add(outputName);
    const image = sharp(sourcePath).rotate().resize({
      width: 2000,
      height: 2000,
      fit: "inside",
      withoutEnlargement: true
    });
    const info = await image.webp({ quality: 84, alphaQuality: 90, effort: 5 }).toFile(outputPath);

    manifest[category].push({
      key: slugify(path.parse(file.name).name),
      src: `/assets/images/selected/${category}/${outputName}`,
      title: projectTitle(file.name, category),
      width: info.width,
      height: info.height
    });
  }

  const generatedFiles = await readdir(outputDirectory, { withFileTypes: true });
  for (const generatedFile of generatedFiles) {
    if (
      generatedFile.isFile() &&
      path.extname(generatedFile.name).toLowerCase() === ".webp" &&
      !expectedOutputs.has(generatedFile.name)
    ) {
      await unlink(path.join(outputDirectory, generatedFile.name));
    }
  }
}

const output = `window.SELECTED_COLLECTIONS = ${JSON.stringify(manifest, null, 2)};\n`;
await writeFile(manifestPath, output, "utf8");

for (const category of categories) {
  console.log(`${category}: ${manifest[category].length}`);
}

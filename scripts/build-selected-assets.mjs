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
  photography: new Set(["img_1932.jpg"]),
  renderings: new Set(["exterior 2 edited noisy copy.jpg"])
};
const photographyCameraOverrides = {
  "img_2273.jpg": {
    make: "Canon",
    model: "Canon EOS R50",
    exposureTime: 1 / 250,
    fNumber: 8,
    iso: 100,
    focalLength: 45
  },
  "img_2623.jpg": {
    make: "Canon",
    model: "Canon EOS R50",
    exposureTime: 1 / 640,
    fNumber: 5.6,
    iso: 100,
    focalLength: 33
  },
  "img_2793-2.jpg": {
    make: "Canon",
    model: "Canon EOS R50",
    exposureTime: 1 / 320,
    fNumber: 9,
    iso: 100,
    focalLength: 45
  }
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

function readExifData(exifBuffer) {
  if (!Buffer.isBuffer(exifBuffer) || exifBuffer.length < 14) return null;

  try {
    const tiffStart =
      exifBuffer.subarray(0, 6).toString("ascii") === "Exif\u0000\u0000" ? 6 : 0;
    const byteOrder = exifBuffer.subarray(tiffStart, tiffStart + 2).toString("ascii");
    if (byteOrder !== "II" && byteOrder !== "MM") return null;
    const littleEndian = byteOrder === "II";
    const readUInt16 = (offset) =>
      littleEndian ? exifBuffer.readUInt16LE(offset) : exifBuffer.readUInt16BE(offset);
    const readUInt32 = (offset) =>
      littleEndian ? exifBuffer.readUInt32LE(offset) : exifBuffer.readUInt32BE(offset);
    const readInt32 = (offset) =>
      littleEndian ? exifBuffer.readInt32LE(offset) : exifBuffer.readInt32BE(offset);
    const typeSizes = new Map([
      [1, 1],
      [2, 1],
      [3, 2],
      [4, 4],
      [5, 8],
      [7, 1],
      [9, 4],
      [10, 8]
    ]);

    function entryValue(entryOffset) {
      const type = readUInt16(entryOffset + 2);
      const count = readUInt32(entryOffset + 4);
      const byteLength = (typeSizes.get(type) || 0) * count;
      if (!byteLength) return undefined;
      const valueOffset =
        byteLength <= 4 ? entryOffset + 8 : tiffStart + readUInt32(entryOffset + 8);
      if (valueOffset < 0 || valueOffset + byteLength > exifBuffer.length) return undefined;

      if (type === 2) {
        return exifBuffer
          .subarray(valueOffset, valueOffset + byteLength)
          .toString("utf8")
          .replace(/\u0000+$/g, "")
          .trim();
      }
      if (type === 3) {
        const values = Array.from({ length: count }, (_, index) =>
          readUInt16(valueOffset + index * 2)
        );
        return values.length === 1 ? values[0] : values;
      }
      if (type === 4) {
        const values = Array.from({ length: count }, (_, index) =>
          readUInt32(valueOffset + index * 4)
        );
        return values.length === 1 ? values[0] : values;
      }
      if (type === 5 || type === 10) {
        const values = Array.from({ length: count }, (_, index) => {
          const position = valueOffset + index * 8;
          const numerator = type === 10 ? readInt32(position) : readUInt32(position);
          const denominator =
            type === 10 ? readInt32(position + 4) : readUInt32(position + 4);
          return denominator ? numerator / denominator : 0;
        });
        return values.length === 1 ? values[0] : values;
      }
      return undefined;
    }

    function readIfd(relativeOffset) {
      const directoryOffset = tiffStart + Number(relativeOffset || 0);
      if (directoryOffset < 0 || directoryOffset + 2 > exifBuffer.length) return new Map();
      const entryCount = readUInt16(directoryOffset);
      const tags = new Map();
      for (let index = 0; index < entryCount; index += 1) {
        const entryOffset = directoryOffset + 2 + index * 12;
        if (entryOffset + 12 > exifBuffer.length) break;
        tags.set(readUInt16(entryOffset), entryValue(entryOffset));
      }
      return tags;
    }

    const rootIfd = readIfd(readUInt32(tiffStart + 4));
    const exifIfd = rootIfd.get(0x8769) ? readIfd(rootIfd.get(0x8769)) : new Map();
    const clean = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value);
    const camera = {
      make: clean(rootIfd.get(0x010f)),
      model: clean(rootIfd.get(0x0110)),
      lens: clean(exifIfd.get(0xa434)),
      exposureTime: exifIfd.get(0x829a),
      fNumber: exifIfd.get(0x829d),
      iso: exifIfd.get(0x8827),
      focalLength: exifIfd.get(0x920a)
    };
    return Object.values(camera).some((value) => value !== undefined && value !== "")
      ? camera
      : null;
  } catch {
    return null;
  }
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
    const sourceMetadata = await sharp(sourcePath).metadata();
    const camera =
      category === "photography"
        ? photographyCameraOverrides[file.name.toLowerCase()] || readExifData(sourceMetadata.exif)
        : null;
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
      height: info.height,
      ...(camera ? { camera } : {})
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

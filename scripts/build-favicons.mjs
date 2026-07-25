import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = new URL("../", import.meta.url);
const source = await readFile(new URL("favicon.svg", root));

async function renderPng(size) {
  return sharp(source, { density: 384 })
    .resize(size, size, { fit: "fill" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

function createIco(images) {
  const headerSize = 6 + images.length * 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = headerSize;
  images.forEach(({ size, buffer }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size === 256 ? 0 : size, entry);
    header.writeUInt8(size === 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(buffer.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += buffer.length;
  });

  return Buffer.concat([header, ...images.map(({ buffer }) => buffer)]);
}

const outputs = [
  ["favicon-48.png", 48],
  ["favicon-192.png", 192],
  ["favicon-512.png", 512],
  ["favicon.png", 512],
  ["apple-touch-icon.png", 180],
];

for (const [file, size] of outputs) {
  const png = await renderPng(size);
  await writeFile(new URL(file, root), png);
  await writeFile(new URL(`assets/${file}`, root), png);
}

const icoImages = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, buffer: await renderPng(size) })),
);
await writeFile(new URL("favicon.ico", root), createIco(icoImages));

console.log("Built black-and-white favicon assets from favicon.svg.");

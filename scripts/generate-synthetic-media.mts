import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { deflateSync } from "node:zlib";

import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const contentSlugs = [
  "media-policy-demo",
  "media-policy-article-demo",
  "media-policy-retrospective-demo",
] as const;
const outputDirectories = contentSlugs.map((slug) =>
  resolve(root, "public/media", slug),
);
const width = 320;
const height = 180;
const usage = `Usage: node --import tsx scripts/generate-synthetic-media.mts --allow-write

Regenerates the permission-safe geometric assets used by the synthetic mixed-
content example. This command writes only the three public/media/media-policy-*
demo/ directories listed in the script.
Install the pinned Playwright Chromium build before running it.`;

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const name = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return chunk;
}

function createPng() {
  const rows = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    for (let x = 0; x < width; x++) {
      const offset = row + 1 + x * 3;
      const band = Math.floor(x / 80) % 2;
      rows[offset] = band ? 31 : 244;
      rows[offset + 1] = band ? 100 : 241;
      rows[offset + 2] = band ? 76 : 233;
      if (Math.abs(y - (45 + x / 4)) < 4) {
        rows[offset] = 168;
        rows[offset + 1] = 71;
        rows[offset + 2] = 18;
      }
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(rows)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function littleEndian(value: number) {
  return [value & 0xff, (value >> 8) & 0xff];
}

function gifImageData(pixels: Uint8Array) {
  const codes: number[] = [4];
  for (const pixel of pixels) codes.push(pixel, 4);
  codes.push(5);
  const packed = Buffer.alloc(Math.ceil((codes.length * 3) / 8));
  codes.forEach((code, index) => {
    const bit = index * 3;
    packed[bit >> 3] |= code << (bit & 7);
    if ((bit & 7) > 5) packed[(bit >> 3) + 1] |= code >> (8 - (bit & 7));
  });
  const blocks: Buffer[] = [Buffer.from([2])];
  for (let offset = 0; offset < packed.length; offset += 255) {
    const block = packed.subarray(offset, offset + 255);
    blocks.push(Buffer.from([block.length]), block);
  }
  blocks.push(Buffer.from([0]));
  return Buffer.concat(blocks);
}

function createGif() {
  const frames: Buffer[] = [];
  for (const shift of [0, 36]) {
    const pixels = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        pixels[y * width + x] = (x + y + shift) % 72 < 36 ? 0 : 1;
      }
    }
    frames.push(
      Buffer.from([0x21, 0xf9, 0x04, 0x00, 0x32, 0x00, 0x00, 0x00]),
      Buffer.from([
        0x2c,
        0x00,
        0x00,
        0x00,
        0x00,
        ...littleEndian(width),
        ...littleEndian(height),
        0x00,
      ]),
      gifImageData(pixels),
    );
  }
  return Buffer.concat([
    Buffer.from("GIF89a", "ascii"),
    Buffer.from([
      ...littleEndian(width),
      ...littleEndian(height),
      0xf1,
      0x00,
      0x00,
      0x1f,
      0x64,
      0x4c,
      0xf4,
      0xf1,
      0xe9,
      0xa8,
      0x47,
      0x12,
      0x17,
      0x22,
      0x1c,
    ]),
    Buffer.from([
      0x21,
      0xff,
      0x0b,
      ...Buffer.from("NETSCAPE2.0", "ascii"),
      0x03,
      0x01,
      0x00,
      0x00,
      0x00,
    ]),
    ...frames,
    Buffer.from([0x3b]),
  ]);
}

async function canvasAsset(
  type: "image/jpeg" | "image/webp",
  quality: number,
  design: "blocks" | "stripes",
) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const dataUrl = await page.evaluate(
      ({ design, height, quality, type, width }) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable.");
        if (design === "stripes") {
          const image = context.createImageData(width, height);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const offset = (y * width + x) * 4;
              const green = (x + y) % 72 < 36;
              image.data[offset] = green ? 31 : 244;
              image.data[offset + 1] = green ? 100 : 241;
              image.data[offset + 2] = green ? 76 : 233;
              image.data[offset + 3] = 255;
            }
          }
          context.putImageData(image, 0, 0);
        } else {
          context.fillStyle = "#f4f1e9";
          context.fillRect(0, 0, width, height);
          context.fillStyle = "#1f644c";
          context.fillRect(24, 24, 118, 132);
          context.fillStyle = "#a84712";
          context.fillRect(178, 24, 118, 132);
          context.fillStyle = "#17221c";
          context.font = "bold 18px sans-serif";
          context.fillText("SYNTHETIC", 101, 96);
        }
        return canvas.toDataURL(type, quality);
      },
      { design, height, quality, type, width },
    );
    const encoded = dataUrl.split(",")[1];
    if (!encoded) throw new Error("Browser image encoding failed.");
    return Buffer.from(encoded, "base64");
  } finally {
    await browser.close();
  }
}

async function main() {
  let values;
  try {
    values = parseArgs({
      options: {
        "allow-write": { type: "boolean" },
        help: { type: "boolean" },
      },
    }).values;
  } catch {
    throw new Error(usage);
  }
  if (values.help) {
    console.log(usage);
    return;
  }
  if (!values["allow-write"]) throw new Error(usage);
  await Promise.all(
    outputDirectories.map((directory) => mkdir(directory, { recursive: true })),
  );
  const [jpeg, poster] = await Promise.all([
    canvasAsset("image/jpeg", 0.84, "blocks"),
    canvasAsset("image/webp", 0.82, "stripes"),
  ]);
  const png = createPng();
  const gif = createGif();
  await Promise.all(
    outputDirectories.flatMap((directory) => [
      writeFile(resolve(directory, "architecture.png"), png),
      writeFile(resolve(directory, "still.jpg"), jpeg),
      writeFile(resolve(directory, "interaction.gif"), gif),
      writeFile(resolve(directory, "interaction.poster.webp"), poster),
    ]),
  );
  console.log(
    `Generated synthetic media for ${contentSlugs.join(", ")} under public/media/.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : usage);
  process.exitCode = 2;
});

import { lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import { extname, posix, resolve, sep } from "node:path";

export const DETAIL_MEDIA_BUDGETS = {
  bodyBytes: 10 * 1024 * 1024,
  gifBytes: 5 * 1024 * 1024,
  stillBytes: 1024 * 1024,
} as const;

export type DetailMediaAsset = Readonly<{
  bytes: number;
  height: number;
  path: string;
  width: number;
}>;

export type ResolvedDetailMedia = Readonly<{
  assets: readonly DetailMediaAsset[];
  height: number;
  kind: "gif" | "still";
  posterPath?: string;
  sourcePath: string;
  width: number;
}>;

export type DetailMediaFailure =
  | "alternative-text"
  | "dimensions"
  | "file"
  | "format"
  | "path"
  | "poster"
  | "size";

export type DetailMediaResolution =
  | Readonly<{ media: ResolvedDetailMedia; ok: true }>
  | Readonly<{ reason: DetailMediaFailure; ok: false }>;

type ImageFormat = "gif" | "jpeg" | "png" | "webp";
type ImageInfo = Readonly<{
  animated: boolean;
  format: ImageFormat;
  height: number;
  width: number;
}>;

const contentSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function positiveDimensions(width: number, height: number) {
  return (
    Number.isSafeInteger(width) &&
    Number.isSafeInteger(height) &&
    width > 0 &&
    height > 0
  );
}

function inspectPng(buffer: Buffer): ImageInfo | null {
  if (
    buffer.length < 24 ||
    !buffer.subarray(0, pngSignature.length).equals(pngSignature) ||
    buffer.toString("ascii", 12, 16) !== "IHDR"
  ) {
    return null;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  let offset = 8;
  let animated = false;
  let complete = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > buffer.length) return null;
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (type === "acTL") animated = true;
    offset = end;
    if (type === "IEND") {
      complete = length === 0;
      break;
    }
  }
  return complete ? { animated, format: "png", height, width } : null;
}

function inspectGif(buffer: Buffer): ImageInfo | null {
  const signature = buffer.toString("ascii", 0, 6);
  if (
    buffer.length < 13 ||
    (signature !== "GIF87a" && signature !== "GIF89a")
  ) {
    return null;
  }
  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  let offset = 13;
  if ((buffer[10] & 0x80) !== 0) {
    offset += 3 * (2 << (buffer[10] & 0x07));
  }
  let frames = 0;
  const skipBlocks = () => {
    while (offset < buffer.length) {
      const length = buffer[offset++];
      if (length === 0) return true;
      if (offset + length > buffer.length) return false;
      offset += length;
    }
    return false;
  };
  while (offset < buffer.length) {
    const marker = buffer[offset++];
    if (marker === 0x3b) {
      return frames > 0
        ? { animated: frames > 1, format: "gif", height, width }
        : null;
    }
    if (marker === 0x21) {
      if (offset >= buffer.length) return null;
      offset++;
      if (!skipBlocks()) return null;
      continue;
    }
    if (marker !== 0x2c || offset + 9 > buffer.length) return null;
    const packed = buffer[offset + 8];
    offset += 9;
    if ((packed & 0x80) !== 0) offset += 3 * (2 << (packed & 0x07));
    if (offset >= buffer.length || buffer[offset] < 2 || buffer[offset] > 8) {
      return null;
    }
    offset++;
    if (!skipBlocks()) return null;
    frames++;
  }
  return null;
}

function inspectJpeg(buffer: Buffer): ImageInfo | null {
  if (
    buffer.length < 4 ||
    buffer[0] !== 0xff ||
    buffer[1] !== 0xd8 ||
    buffer[buffer.length - 2] !== 0xff ||
    buffer[buffer.length - 1] !== 0xd9
  ) {
    return null;
  }
  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);
  let offset = 2;
  while (offset < buffer.length) {
    while (buffer[offset] === 0xff) offset++;
    if (offset >= buffer.length) return null;
    const marker = buffer[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) return null;
    if (startOfFrameMarkers.has(marker)) {
      if (length < 7) return null;
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      return { animated: false, format: "jpeg", height, width };
    }
    offset += length;
  }
  return null;
}

function readUint24LittleEndian(buffer: Buffer, offset: number) {
  return (
    buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16)
  );
}

function inspectWebp(buffer: Buffer): ImageInfo | null {
  if (
    buffer.length < 20 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP" ||
    buffer.readUInt32LE(4) + 8 !== buffer.length
  ) {
    return null;
  }
  let animated = false;
  let canvasDimensions: { height: number; width: number } | null = null;
  let imageDimensions: { height: number; width: number } | null = null;
  let hasImageData = false;
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    const end = dataOffset + length;
    if (end > buffer.length) return null;
    if (type === "VP8X") {
      if (length < 10) return null;
      animated ||= (buffer[dataOffset] & 0x02) !== 0;
      canvasDimensions = {
        width: readUint24LittleEndian(buffer, dataOffset + 4) + 1,
        height: readUint24LittleEndian(buffer, dataOffset + 7) + 1,
      };
    } else if (type === "VP8 ") {
      if (
        length < 10 ||
        buffer[dataOffset + 3] !== 0x9d ||
        buffer[dataOffset + 4] !== 0x01 ||
        buffer[dataOffset + 5] !== 0x2a
      ) {
        return null;
      }
      hasImageData = true;
      imageDimensions = {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    } else if (type === "VP8L") {
      if (length < 5 || buffer[dataOffset] !== 0x2f) return null;
      hasImageData = true;
      const bits = buffer.readUInt32LE(dataOffset + 1);
      imageDimensions = {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    } else if (type === "ANIM" || type === "ANMF") {
      animated = true;
    }
    offset = end + (length % 2);
  }
  const dimensions = canvasDimensions ?? imageDimensions;
  return dimensions &&
    hasImageData &&
    (!canvasDimensions ||
      !imageDimensions ||
      (canvasDimensions.width === imageDimensions.width &&
        canvasDimensions.height === imageDimensions.height)) &&
    positiveDimensions(dimensions.width, dimensions.height)
    ? { animated, format: "webp", ...dimensions }
    : null;
}

function inspectImage(buffer: Buffer): ImageInfo | null {
  return (
    inspectPng(buffer) ??
    inspectJpeg(buffer) ??
    inspectWebp(buffer) ??
    inspectGif(buffer)
  );
}

function expectedFormat(path: string): ImageFormat | null {
  switch (extname(path)) {
    case ".png":
      return "png";
    case ".jpg":
    case ".jpeg":
      return "jpeg";
    case ".webp":
      return "webp";
    case ".gif":
      return "gif";
    default:
      return null;
  }
}

function isNormalizedSourcePath(sourcePath: string) {
  try {
    const decoded = decodeURIComponent(sourcePath);
    return (
      decoded === sourcePath &&
      !sourcePath.includes("\\") &&
      !/[?#\u0000-\u001f\u007f]/u.test(sourcePath) &&
      posix.normalize(sourcePath) === sourcePath
    );
  } catch {
    return false;
  }
}

function resolveAssetPath(
  sourcePath: string,
  mediaRoot: string,
): Readonly<{ path: string; size: number }> | null {
  try {
    const relativePath = sourcePath.slice("/media/".length);
    const root = realpathSync(mediaRoot);
    const candidate = resolve(root, relativePath);
    if (candidate === root || !candidate.startsWith(`${root}${sep}`))
      return null;
    const candidateInfo = lstatSync(candidate);
    if (!candidateInfo.isFile() && !candidateInfo.isSymbolicLink()) {
      return null;
    }
    const real = realpathSync(candidate);
    const info = statSync(real);
    if (!real.startsWith(`${root}${sep}`) || !info.isFile()) return null;
    return { path: real, size: info.size };
  } catch {
    return null;
  }
}

function inspectAsset(
  sourcePath: string,
  mediaRoot: string,
):
  | Readonly<{ asset: DetailMediaAsset; info: ImageInfo; ok: true }>
  | Readonly<{ reason: DetailMediaFailure; ok: false }> {
  const format = expectedFormat(sourcePath);
  if (!format) return { ok: false, reason: "format" };
  const file = resolveAssetPath(sourcePath, mediaRoot);
  if (!file) return { ok: false, reason: "file" };
  const limit =
    format === "gif"
      ? DETAIL_MEDIA_BUDGETS.gifBytes
      : DETAIL_MEDIA_BUDGETS.stillBytes;
  if (file.size === 0 || file.size > limit) {
    return { ok: false, reason: "size" };
  }
  let buffer: Buffer;
  try {
    buffer = readFileSync(file.path);
  } catch {
    return { ok: false, reason: "file" };
  }
  const info = inspectImage(buffer);
  if (!info || info.format !== format) return { ok: false, reason: "format" };
  if (!positiveDimensions(info.width, info.height)) {
    return { ok: false, reason: "dimensions" };
  }
  if (format !== "gif" && info.animated) {
    return { ok: false, reason: "format" };
  }
  if (buffer.length !== file.size) {
    return { ok: false, reason: "size" };
  }
  return {
    ok: true,
    asset: {
      bytes: buffer.length,
      height: info.height,
      path: sourcePath,
      width: info.width,
    },
    info,
  };
}

export function resolveDetailMedia(
  sourcePath: string,
  alternativeText: string | undefined,
  options: Readonly<{ contentSlug: string; mediaRoot?: string }>,
): DetailMediaResolution {
  if (!alternativeText?.trim()) {
    return { ok: false, reason: "alternative-text" };
  }
  const expectedPrefix = `/media/${options.contentSlug}/`;
  if (
    !contentSlugPattern.test(options.contentSlug) ||
    !isNormalizedSourcePath(sourcePath) ||
    !sourcePath.startsWith(expectedPrefix) ||
    sourcePath.length <= expectedPrefix.length
  ) {
    return { ok: false, reason: "path" };
  }
  const mediaRoot = options.mediaRoot ?? resolve(process.cwd(), "public/media");
  const source = inspectAsset(sourcePath, mediaRoot);
  if (!source.ok) return source;
  if (source.info.format !== "gif") {
    return {
      ok: true,
      media: {
        assets: [source.asset],
        height: source.info.height,
        kind: "still",
        sourcePath,
        width: source.info.width,
      },
    };
  }
  const posterPath = sourcePath.replace(/\.gif$/u, ".poster.webp");
  const poster = inspectAsset(posterPath, mediaRoot);
  if (
    !poster.ok ||
    poster.info.format !== "webp" ||
    poster.info.animated ||
    poster.info.width !== source.info.width ||
    poster.info.height !== source.info.height
  ) {
    return { ok: false, reason: "poster" };
  }
  return {
    ok: true,
    media: {
      assets: [source.asset, poster.asset],
      height: source.info.height,
      kind: "gif",
      posterPath,
      sourcePath,
      width: source.info.width,
    },
  };
}

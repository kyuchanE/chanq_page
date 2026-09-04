import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  DETAIL_MEDIA_BUDGETS,
  resolveDetailMedia,
} from "@/features/content/infrastructure/markdown/detail-media";
import { analyzeDetailMarkdown } from "@/features/content/infrastructure/markdown/detail-markdown";

const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const exampleRoot = join(repositoryRoot, "public/media/media-policy-demo");
const contentSlug = "media-policy-demo";
let temporaryRoot: string;
let mediaRoot: string;
let contentRoot: string;

async function copy(name: string, destination = name) {
  const path = join(contentRoot, destination);
  await mkdir(dirname(path), { recursive: true });
  await copyFile(join(exampleRoot, name), path);
}

beforeAll(async () => {
  temporaryRoot = await mkdtemp(join(tmpdir(), "chanq-detail-media-"));
  mediaRoot = join(temporaryRoot, "media");
  contentRoot = join(mediaRoot, contentSlug);
  await mkdir(contentRoot, { recursive: true });
  await Promise.all([
    copy("architecture.png"),
    copy("still.jpg"),
    copy("still.jpg", "still.jpeg"),
    copy("interaction.gif"),
    copy("interaction.poster.webp"),
  ]);
});

afterAll(async () => {
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true });
});

function resolveMedia(path: string, alt = "Useful synthetic alternative") {
  return resolveDetailMedia(path, alt, { contentSlug, mediaRoot });
}

describe("detail media filesystem policy", () => {
  it.each([
    ["architecture.png", "still"],
    ["still.jpg", "still"],
    ["still.jpeg", "still"],
    ["interaction.poster.webp", "still"],
    ["interaction.gif", "gif"],
  ] as const)("accepts reviewed %s content", (name, kind) => {
    const result = resolveMedia(`/media/${contentSlug}/${name}`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.media).toMatchObject({ height: 180, kind, width: 320 });
    expect(result.media.assets.every((asset) => asset.bytes > 0)).toBe(true);
    if (kind === "gif") {
      expect(result.media.posterPath).toBe(
        "/media/media-policy-demo/interaction.poster.webp",
      );
      expect(result.media.assets).toHaveLength(2);
    }
  });

  it.each([
    ["", "alternative-text"],
    ["   ", "alternative-text"],
    ["/media/media-policy-demo/missing.png", "file"],
    ["/media/another-slug/architecture.png", "path"],
    ["https://example.com/image.png", "path"],
    ["data:image/png;base64,AA==", "path"],
    ["/media/media-policy-demo/../architecture.png", "path"],
    ["/media/media-policy-demo/%2e%2e/architecture.png", "path"],
    ["/media/media-policy-demo/%252e%252e/architecture.png", "path"],
    ["/media/media-policy-demo/%2Farchitecture.png", "path"],
    ["/media/media-policy-demo/architecture.png?raw=1", "path"],
    ["/media/media-policy-demo/architecture.png#fragment", "path"],
    ["/media/media-policy-demo/architecture.svg", "format"],
  ] as const)("rejects an invalid reference (%s)", (value, reason) => {
    const source =
      value.startsWith("/") || value.includes(":")
        ? value
        : "/media/media-policy-demo/architecture.png";
    expect(resolveMedia(source, value)).toEqual({ ok: false, reason });
  });

  it("rejects mismatched content, zero dimensions, animated WebP, and oversized files", async () => {
    const png = await readFile(join(contentRoot, "architecture.png"));
    await writeFile(join(contentRoot, "mismatch.jpg"), png);
    const zero = Buffer.from(png);
    zero.writeUInt32BE(0, 16);
    await writeFile(join(contentRoot, "zero.png"), zero);
    const webp = await readFile(join(contentRoot, "interaction.poster.webp"));
    const animatedWebp = Buffer.from(webp);
    animatedWebp[20] |= 0x02;
    await writeFile(join(contentRoot, "animated.webp"), animatedWebp);
    const animatedPng = Buffer.from(png);
    animatedPng.write("acTL", 37, "ascii");
    await writeFile(join(contentRoot, "animated.png"), animatedPng);
    const oversized = Buffer.concat([
      png,
      Buffer.alloc(DETAIL_MEDIA_BUDGETS.stillBytes + 1 - png.length),
    ]);
    await writeFile(join(contentRoot, "oversized.png"), oversized);

    expect(resolveMedia(`/media/${contentSlug}/zero.png`)).toEqual({
      ok: false,
      reason: "dimensions",
    });
    for (const name of [
      "mismatch.jpg",
      "animated.png",
      "animated.webp",
      "oversized.png",
    ]) {
      expect(resolveMedia(`/media/${contentSlug}/${name}`).ok).toBe(false);
    }
  });

  it("rejects missing and dimension-mismatched GIF posters", async () => {
    await copy("interaction.gif", "unpaired.gif");
    await copy("interaction.gif", "mismatched.gif");
    const poster = await readFile(join(contentRoot, "interaction.poster.webp"));
    const mismatchedPoster = Buffer.from(poster);
    mismatchedPoster[24] = 0;
    await writeFile(
      join(contentRoot, "mismatched.poster.webp"),
      mismatchedPoster,
    );
    expect(resolveMedia(`/media/${contentSlug}/unpaired.gif`)).toEqual({
      ok: false,
      reason: "poster",
    });
    expect(resolveMedia(`/media/${contentSlug}/mismatched.gif`)).toEqual({
      ok: false,
      reason: "poster",
    });
  });

  it("rejects a symlink that escapes the media root", async () => {
    const outside = join(temporaryRoot, "outside.png");
    await copyFile(join(exampleRoot, "architecture.png"), outside);
    await symlink(outside, join(contentRoot, "escape.png"));
    expect(resolveMedia(`/media/${contentSlug}/escape.png`)).toEqual({
      ok: false,
      reason: "file",
    });
  });

  it("counts unique assets once and rejects a body above the aggregate budget", async () => {
    const repeated = analyzeDetailMarkdown(
      "![First](/media/media-policy-demo/architecture.png)\n\n![Again](/media/media-policy-demo/architecture.png)",
      { contentSlug, mediaRoot },
    );
    expect(repeated.issues).toEqual([]);
    expect(repeated.media).toHaveLength(2);
    expect(repeated.uniqueAssets).toHaveLength(1);

    const png = await readFile(join(contentRoot, "architecture.png"));
    const budgetSized = Buffer.concat([
      png,
      Buffer.alloc(DETAIL_MEDIA_BUDGETS.stillBytes - png.length),
    ]);
    const lines: string[] = [];
    for (let index = 0; index < 11; index++) {
      const name = `budget-${index}.png`;
      await writeFile(join(contentRoot, name), budgetSized);
      lines.push(`![Budget asset ${index}](/media/${contentSlug}/${name})`);
    }
    const oversized = analyzeDetailMarkdown(lines.join("\n\n"), {
      contentSlug,
      mediaRoot,
    });
    expect(oversized.uniqueAssetBytes).toBe(11 * 1024 * 1024);
    expect(oversized.issues).toMatchObject([{ rule: "media-budget" }]);
  });
});

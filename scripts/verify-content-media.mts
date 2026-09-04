import { open } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { ContentImportError } from "../src/features/content/imports";
import {
  inspectContentImportMedia,
  MAX_IMPORT_BYTES,
  parseContentImportJson,
} from "../src/features/content/imports.server";

const root = fileURLToPath(new URL("../", import.meta.url));
const usage = `Usage: pnpm content:media:verify --file <path.json>

Reads a version-1 content input and verifies every referenced local body asset.
The command never connects to PostgreSQL, fetches remote URLs, or writes files.
Input paths resolve from the repository root.
Exit codes: 0 success; 2 invalid input or media.`;

async function readInput(path: string) {
  try {
    const file = await open(resolve(root, path), "r");
    try {
      const info = await file.stat();
      if (!info.isFile() || info.size > MAX_IMPORT_BYTES) {
        throw new Error("Unsupported file.");
      }
      const buffer = Buffer.alloc(MAX_IMPORT_BYTES + 1);
      let size = 0;
      while (size < buffer.length) {
        const { bytesRead } = await file.read(
          buffer,
          size,
          buffer.length - size,
          null,
        );
        if (!bytesRead) break;
        size += bytesRead;
      }
      if (size > MAX_IMPORT_BYTES) throw new Error("Input too large.");
      return new TextDecoder("utf-8", { fatal: true }).decode(
        buffer.subarray(0, size),
      );
    } finally {
      await file.close();
    }
  } catch {
    throw new ContentImportError(
      "invalid-input",
      "Cannot read input: use a UTF-8 JSON file no larger than 2 MiB.",
    );
  }
}

async function main() {
  let options;
  try {
    options = parseArgs({
      options: {
        file: { type: "string" },
        help: { type: "boolean" },
      },
    }).values;
  } catch {
    throw new ContentImportError("invalid-input", usage);
  }
  if (options.help) {
    console.log(usage);
    return;
  }
  if (!options.file) throw new ContentImportError("invalid-input", usage);

  const mediaRoot = resolve(root, "public/media");
  const document = parseContentImportJson(await readInput(options.file), {
    mediaRoot,
  });
  const summary = inspectContentImportMedia(document, { mediaRoot });
  console.log(JSON.stringify({ file: options.file, ...summary }, null, 2));
}

main().catch((error: unknown) => {
  console.error(
    error instanceof ContentImportError
      ? error.message
      : "Media verification failed without exposing source content.",
  );
  process.exitCode = 2;
});

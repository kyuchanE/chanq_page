import { open } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { config as loadEnvironment } from "dotenv";

import {
  ContentImportError,
  importContent,
} from "../src/features/content/imports";
import {
  connectPostgresContentImport,
  MAX_IMPORT_BYTES,
  parseContentImportJson,
  parseLocalImportTarget,
} from "../src/features/content/imports.server";

const root = fileURLToPath(new URL("../", import.meta.url));
const usage = `Usage: pnpm content:import --target development|test --file <path.json> [--dry-run | --apply] [--allow-publish]

Defaults to a read-only dry-run. --apply explicitly confirms local writes.
--allow-publish is also required for any new publication, including drafts.
Input paths and .env.local are resolved from the repository root.
Production targets are unsupported.
Exit codes: 0 success; 1 database failure; 2 input/usage/target failure; 3 conflict.`;

async function main() {
  let options;
  try {
    const parsed = parseArgs({
      tokens: true,
      options: {
        target: { type: "string" },
        file: { type: "string" },
        "dry-run": { type: "boolean" },
        apply: { type: "boolean" },
        "allow-publish": { type: "boolean" },
        help: { type: "boolean" },
      },
    });
    const names = parsed.tokens
      .filter((token) => token.kind === "option")
      .map((token) => token.name);
    if (new Set(names).size !== names.length)
      throw new Error("Duplicate option.");
    options = parsed.values;
  } catch {
    throw new ContentImportError("invalid-input", usage);
  }
  if (options.help) {
    console.log(usage);
    return;
  }
  if (
    !options.target ||
    !options.file ||
    (options.apply && options["dry-run"])
  ) {
    throw new ContentImportError("invalid-input", usage);
  }

  loadEnvironment({ path: resolve(root, ".env.local"), quiet: true });
  const target = parseLocalImportTarget(options.target, process.env);
  let source: string;
  try {
    const file = await open(resolve(root, options.file), "r");
    try {
      const info = await file.stat();
      if (!info.isFile() || info.size > MAX_IMPORT_BYTES)
        throw new Error("Unsupported file.");
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
      source = new TextDecoder("utf-8", { fatal: true }).decode(
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
  const document = parseContentImportJson(source, {
    mediaRoot: resolve(root, "public/media"),
  });
  const connection = connectPostgresContentImport(target);
  try {
    const summary = await importContent(connection.repository, document, {
      mode: options.apply ? "apply" : "dry-run",
      allowPublish: options["allow-publish"] ?? false,
    });
    console.log(JSON.stringify({ target: target.name, ...summary }, null, 2));
  } finally {
    await connection.close();
  }
}

main().catch((error: unknown) => {
  if (error instanceof ContentImportError) {
    console.error(error.message);
    process.exitCode =
      error.code === "conflict" ? 3 : error.code === "unavailable" ? 1 : 2;
  } else {
    console.error(
      "Content import failed without exposing source data or connection details.",
    );
    process.exitCode = 1;
  }
});

import example from "../../content/examples/local-draft.json";
import { parseContentImport } from "../../src/features/content/imports.server";

export function importFixture() {
  return parseContentImport(
    JSON.parse(JSON.stringify(example).replaceAll("example-", "import-check-")),
  );
}

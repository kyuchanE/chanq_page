import { describe, expect, it } from "vitest";
import { parseLocalImportTarget } from "@/features/content/imports.server";

const development =
  "postgresql://chanq_page_app:secret@127.0.0.1:5433/chanq_page";
const test =
  "postgresql://chanq_page_test_app:secret@127.0.0.1:5433/chanq_page_test";

describe("local import target", () => {
  it("selects only the explicit application target", () => {
    expect(
      parseLocalImportTarget("development", { DATABASE_URL: development }),
    ).toMatchObject({ database: "chanq_page", role: "chanq_page_app" });
    expect(
      parseLocalImportTarget("test", { TEST_DATABASE_URL: test }),
    ).toMatchObject({
      database: "chanq_page_test",
      role: "chanq_page_test_app",
    });
  });
  it.each(["production", "", "staging"])("rejects unsupported %s", (target) => {
    expect(() => parseLocalImportTarget(target, {})).toThrow(/Production/);
  });
  it.each([
    development,
    test.replace("127.0.0.1", "remote.example.com"),
    test.replace("5433", "5432"),
    test.replace("chanq_page_test_app", "root"),
    `${test}?host=remote.example.com`,
    `${test}?options=-c%20role=root`,
    `${test}#fragment`,
    "not-a-url-with-secret",
  ])(
    "rejects a wrong or overridable connection without disclosing it",
    (connectionString) => {
      try {
        parseLocalImportTarget("test", { TEST_DATABASE_URL: connectionString });
        throw new Error("Unexpected acceptance");
      } catch (error) {
        expect(error).toMatchObject({ code: "invalid-target" });
        expect(String(error)).not.toContain("secret");
      }
    },
  );
});

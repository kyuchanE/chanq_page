import { describe, expect, it } from "vitest";

import { parseDatabaseEnvironment } from "@/shared/config/database-environment";

describe("parseDatabaseEnvironment", () => {
  it("accepts PostgreSQL URLs for development and test databases", () => {
    const environment = {
      DATABASE_URL: "postgresql://app:password@127.0.0.1:5433/chanq_page",
      TEST_DATABASE_URL:
        "postgres://app:password@127.0.0.1:5433/chanq_page_test",
    };

    expect(parseDatabaseEnvironment(environment)).toEqual(environment);
  });

  it("rejects invalid URLs without exposing their values", () => {
    const invalidValue = "not-a-database-url-with-a-secret";

    expect(() =>
      parseDatabaseEnvironment({
        DATABASE_URL: invalidValue,
        TEST_DATABASE_URL: "https://example.com/not-postgresql",
      }),
    ).toThrow(
      "Invalid database environment configuration. Check DATABASE_URL and TEST_DATABASE_URL.",
    );

    try {
      parseDatabaseEnvironment({
        DATABASE_URL: invalidValue,
        TEST_DATABASE_URL: "https://example.com/not-postgresql",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain(invalidValue);
    }
  });
});

import { describe, expect, it } from "vitest";

import {
  parseApplicationDatabaseEnvironment,
  parseDatabaseEnvironment,
  parseMigrationDatabaseEnvironment,
} from "@/shared/config/database-environment";

describe("parseApplicationDatabaseEnvironment", () => {
  it("requires only the runtime application database URL", () => {
    const environment = {
      DATABASE_URL: "postgresql://app:password@127.0.0.1:5433/chanq_page",
    };

    expect(parseApplicationDatabaseEnvironment(environment)).toEqual(
      environment,
    );
  });

  it("rejects a non-PostgreSQL runtime URL without exposing it", () => {
    const invalidValue = "https://example.com/secret";

    expect(() =>
      parseApplicationDatabaseEnvironment({ DATABASE_URL: invalidValue }),
    ).toThrow(
      "Invalid application database configuration. Check DATABASE_URL.",
    );

    try {
      parseApplicationDatabaseEnvironment({ DATABASE_URL: invalidValue });
    } catch (error) {
      expect((error as Error).message).not.toContain(invalidValue);
    }
  });
});

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

describe("parseMigrationDatabaseEnvironment", () => {
  it("accepts separate development and test migration URLs", () => {
    const environment = {
      MIGRATION_DATABASE_URL:
        "postgresql://migration:password@127.0.0.1:5433/chanq_page",
      TEST_MIGRATION_DATABASE_URL:
        "postgresql://migration:password@127.0.0.1:5433/chanq_page_test",
    };

    expect(parseMigrationDatabaseEnvironment(environment)).toEqual(environment);
  });

  it("rejects application URLs in place of missing migration URLs", () => {
    expect(() =>
      parseMigrationDatabaseEnvironment({
        DATABASE_URL: "postgresql://app:password@127.0.0.1:5433/chanq_page",
        TEST_DATABASE_URL:
          "postgresql://app:password@127.0.0.1:5433/chanq_page_test",
      }),
    ).toThrow(
      "Invalid migration database configuration. Check MIGRATION_DATABASE_URL and TEST_MIGRATION_DATABASE_URL.",
    );
  });
});

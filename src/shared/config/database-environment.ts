import { z } from "zod";

const postgresUrl = z
  .string()
  .min(1)
  .superRefine((value, context) => {
    try {
      const url = new URL(value);

      if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
        context.addIssue({
          code: "custom",
          message: "Expected a PostgreSQL connection URL.",
        });
      }
    } catch {
      context.addIssue({
        code: "custom",
        message: "Expected a valid connection URL.",
      });
    }
  });

const databaseEnvironmentSchema = z.object({
  DATABASE_URL: postgresUrl,
  TEST_DATABASE_URL: postgresUrl,
});

const migrationDatabaseEnvironmentSchema = z.object({
  MIGRATION_DATABASE_URL: postgresUrl,
  TEST_MIGRATION_DATABASE_URL: postgresUrl,
});

export type DatabaseEnvironment = z.infer<typeof databaseEnvironmentSchema>;
export type MigrationDatabaseEnvironment = z.infer<
  typeof migrationDatabaseEnvironmentSchema
>;

export function parseDatabaseEnvironment(
  environment: Record<string, string | undefined>,
): DatabaseEnvironment {
  const result = databaseEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    throw new Error(
      "Invalid database environment configuration. Check DATABASE_URL and TEST_DATABASE_URL.",
    );
  }

  return result.data;
}

export function parseMigrationDatabaseEnvironment(
  environment: Record<string, string | undefined>,
): MigrationDatabaseEnvironment {
  const result = migrationDatabaseEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    throw new Error(
      "Invalid migration database configuration. Check MIGRATION_DATABASE_URL and TEST_MIGRATION_DATABASE_URL.",
    );
  }

  return result.data;
}

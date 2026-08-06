import { config as loadEnvironment } from "dotenv";
import { defineConfig } from "drizzle-kit";

import { parseMigrationDatabaseEnvironment } from "./src/shared/config/database-environment";

loadEnvironment({ path: ".env.local", quiet: true });

const environment = parseMigrationDatabaseEnvironment(process.env);
const target = process.env.DRIZZLE_DATABASE_TARGET ?? "development";

if (target !== "development" && target !== "test") {
  throw new Error(
    "DRIZZLE_DATABASE_TARGET must be either development or test.",
  );
}

export default defineConfig({
  schema: "./src/features/content/infrastructure/postgres/schema.ts",
  out: "./infrastructure/postgres/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      target === "test"
        ? environment.TEST_MIGRATION_DATABASE_URL
        : environment.MIGRATION_DATABASE_URL,
  },
  strict: true,
  verbose: true,
});

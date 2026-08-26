import {
  connectPostgresContentRepositories,
  type PostgresContentRepositoriesConnection,
} from "@/features/content/content.server";
import { parseApplicationDatabaseEnvironment } from "@/shared/config/database-environment";

type DatabaseGlobal = typeof globalThis & {
  chanqPageContentRepositories?: PostgresContentRepositoriesConnection;
};

const databaseGlobal = globalThis as DatabaseGlobal;

export function getContentRepositories(): PostgresContentRepositoriesConnection {
  if (databaseGlobal.chanqPageContentRepositories === undefined) {
    const environment = parseApplicationDatabaseEnvironment(process.env);

    databaseGlobal.chanqPageContentRepositories =
      connectPostgresContentRepositories({
        applicationName: "chanq_page",
        connectionString: environment.DATABASE_URL,
      });
  }

  return databaseGlobal.chanqPageContentRepositories;
}

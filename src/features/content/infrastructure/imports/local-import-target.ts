import { ContentImportError } from "../../domain/imports/content-import";

export type LocalImportTarget = {
  name: "development" | "test";
  database: string;
  role: string;
  connectionString: string;
};

export function parseLocalImportTarget(
  target: string,
  environment: Record<string, string | undefined>,
): LocalImportTarget {
  const fail = () =>
    new ContentImportError(
      "invalid-target",
      "Import requires the configured loopback development/test database and its application role. Production and connection overrides are unsupported.",
    );
  if (target !== "development" && target !== "test") throw fail();
  const database = target === "development" ? "chanq_page" : "chanq_page_test";
  const role = `${database}_app`;
  const connectionString =
    environment[
      target === "development" ? "DATABASE_URL" : "TEST_DATABASE_URL"
    ];
  if (!connectionString) throw fail();
  try {
    const url = new URL(connectionString);
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      url.hostname !== "127.0.0.1" ||
      url.port !== (environment.POSTGRES_PORT ?? "5433") ||
      decodeURIComponent(url.pathname) !== `/${database}` ||
      decodeURIComponent(url.username) !== role ||
      url.search ||
      url.hash
    )
      throw fail();
  } catch {
    throw fail();
  }
  return { name: target, database, role, connectionString };
}

import { cache } from "react";

import {
  connectPostgresProjectRepository,
  parseProjectSlug,
  type ProjectRepository,
} from "@/features/content/projects.server";
import { parseApplicationDatabaseEnvironment } from "@/shared/config/database-environment";

type DatabaseGlobal = typeof globalThis & {
  chanqPageProjectRepository?: ProjectRepository;
};

const databaseGlobal = globalThis as DatabaseGlobal;

function getProjectRepository(): ProjectRepository {
  if (databaseGlobal.chanqPageProjectRepository === undefined) {
    const environment = parseApplicationDatabaseEnvironment(process.env);

    databaseGlobal.chanqPageProjectRepository =
      connectPostgresProjectRepository({
        applicationName: "chanq_page",
        connectionString: environment.DATABASE_URL,
      }).repository;
  }

  return databaseGlobal.chanqPageProjectRepository;
}

export async function listPublishedProjects() {
  return getProjectRepository().listPublished();
}

export const findPublishedProject = cache(async (candidateSlug: unknown) => {
  const slug = parseProjectSlug(candidateSlug);

  if (slug === null) {
    return null;
  }

  return getProjectRepository().findPublishedBySlug(slug);
});

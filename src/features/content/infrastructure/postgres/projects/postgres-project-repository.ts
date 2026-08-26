import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
  ProjectRepositoryError,
  type ProjectRepository,
} from "@/features/content/application/projects/project-repository";
import type { ContentDatabase } from "@/features/content/infrastructure/postgres/database";
import * as schema from "@/features/content/infrastructure/postgres/schema";
import {
  InvalidProjectRowError,
  mapPublishedProjectDetailRows,
  mapPublishedProjectListRows,
} from "@/features/content/infrastructure/postgres/projects/project-row-mapper";

export type PostgresProjectRepositoryConnection = Readonly<{
  close: () => Promise<void>;
  repository: ProjectRepository;
}>;

type PostgresProjectRepositoryOptions = Readonly<{
  applicationName: string;
  connectionString: string;
  maxConnections?: number;
}>;

const projectListSelection = {
  featured: schema.projects.featured,
  publishedAt: schema.projects.publishedAt,
  slug: schema.projects.slug,
  summary: schema.projects.summary,
  title: schema.projects.title,
};

function translateRepositoryError(error: unknown): never {
  if (error instanceof ProjectRepositoryError) {
    throw error;
  }

  if (error instanceof InvalidProjectRowError) {
    throw new ProjectRepositoryError(
      "invalid-data",
      "Published project data is invalid.",
      { cause: error },
    );
  }

  throw new ProjectRepositoryError(
    "unavailable",
    "Published projects are temporarily unavailable.",
    { cause: error },
  );
}

export function createPostgresProjectRepository(
  database: ContentDatabase,
): ProjectRepository {
  return {
    async findPublishedBySlug(slug) {
      try {
        const rows = await database
          .select({
            body: schema.projects.body,
            featured: schema.projects.featured,
            liveUrl: schema.projects.liveUrl,
            ogImagePath: schema.projects.ogImagePath,
            publishedAt: schema.projects.publishedAt,
            repositoryUrl: schema.projects.repositoryUrl,
            seoDescription: schema.projects.seoDescription,
            seoTitle: schema.projects.seoTitle,
            skillDisplayOrder: schema.skills.displayOrder,
            skillKey: schema.skills.key,
            skillName: schema.skills.name,
            slug: schema.projects.slug,
            summary: schema.projects.summary,
            title: schema.projects.title,
          })
          .from(schema.projects)
          .leftJoin(
            schema.projectSkills,
            eq(schema.projectSkills.projectId, schema.projects.id),
          )
          .leftJoin(
            schema.skills,
            and(
              eq(schema.skills.id, schema.projectSkills.skillId),
              eq(schema.skills.visible, true),
            ),
          )
          .where(
            and(
              eq(schema.projects.slug, slug),
              eq(schema.projects.status, "published"),
            ),
          )
          .orderBy(
            asc(schema.skills.displayOrder),
            asc(schema.skills.name),
            asc(schema.skills.key),
          );

        return mapPublishedProjectDetailRows(rows);
      } catch (error) {
        return translateRepositoryError(error);
      }
    },

    async listFeatured() {
      try {
        const rows = await database
          .select(projectListSelection)
          .from(schema.projects)
          .where(
            and(
              eq(schema.projects.status, "published"),
              eq(schema.projects.featured, true),
            ),
          )
          .orderBy(
            asc(schema.projects.displayOrder),
            desc(schema.projects.publishedAt),
            asc(schema.projects.slug),
          );

        return mapPublishedProjectListRows(rows);
      } catch (error) {
        return translateRepositoryError(error);
      }
    },

    async listPublished() {
      try {
        const rows = await database
          .select(projectListSelection)
          .from(schema.projects)
          .where(eq(schema.projects.status, "published"))
          .orderBy(
            desc(schema.projects.featured),
            asc(schema.projects.displayOrder),
            desc(schema.projects.publishedAt),
            asc(schema.projects.slug),
          );

        return mapPublishedProjectListRows(rows);
      } catch (error) {
        return translateRepositoryError(error);
      }
    },
  };
}

export function connectPostgresProjectRepository({
  applicationName,
  connectionString,
  maxConnections = 10,
}: PostgresProjectRepositoryOptions): PostgresProjectRepositoryConnection {
  const pool = new Pool({
    application_name: applicationName,
    connectionString,
    max: maxConnections,
  });
  const database = drizzle(pool, { schema });

  return {
    close: () => pool.end(),
    repository: createPostgresProjectRepository(database),
  };
}

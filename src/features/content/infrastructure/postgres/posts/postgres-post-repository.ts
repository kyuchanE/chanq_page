import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
  PostRepositoryError,
  type PostRepository,
} from "@/features/content/application/posts/post-repository";
import type { ContentDatabase } from "@/features/content/infrastructure/postgres/database";
import {
  InvalidPostRowError,
  mapPublishedPostDetailRows,
  mapPublishedPostListRows,
} from "@/features/content/infrastructure/postgres/posts/post-row-mapper";
import * as schema from "@/features/content/infrastructure/postgres/schema";

export type PostgresPostRepositoryConnection = Readonly<{
  close: () => Promise<void>;
  repository: PostRepository;
}>;

type PostgresPostRepositoryOptions = Readonly<{
  applicationName: string;
  connectionString: string;
  maxConnections?: number;
}>;

function translateRepositoryError(error: unknown): never {
  if (error instanceof PostRepositoryError) {
    throw error;
  }

  if (error instanceof InvalidPostRowError) {
    throw new PostRepositoryError(
      "invalid-data",
      "Published post data is invalid.",
      { cause: error },
    );
  }

  throw new PostRepositoryError(
    "unavailable",
    "Published posts are temporarily unavailable.",
    { cause: error },
  );
}

export function createPostgresPostRepository(
  database: ContentDatabase,
): PostRepository {
  return {
    async findPublishedBySlug(kind, slug) {
      try {
        const rows = await database
          .select({
            body: schema.posts.body,
            kind: schema.posts.kind,
            ogImagePath: schema.posts.ogImagePath,
            projectDisplayOrder: schema.projects.displayOrder,
            projectFeatured: schema.projects.featured,
            projectPublishedAt: schema.projects.publishedAt,
            projectSlug: schema.projects.slug,
            projectTitle: schema.projects.title,
            publishedAt: schema.posts.publishedAt,
            seoDescription: schema.posts.seoDescription,
            seoTitle: schema.posts.seoTitle,
            slug: schema.posts.slug,
            summary: schema.posts.summary,
            tagName: schema.tags.name,
            tagSlug: schema.tags.slug,
            title: schema.posts.title,
          })
          .from(schema.posts)
          .leftJoin(
            schema.postTags,
            eq(schema.postTags.postId, schema.posts.id),
          )
          .leftJoin(schema.tags, eq(schema.tags.id, schema.postTags.tagId))
          .leftJoin(
            schema.postProjects,
            eq(schema.postProjects.postId, schema.posts.id),
          )
          .leftJoin(
            schema.projects,
            and(
              eq(schema.projects.id, schema.postProjects.projectId),
              eq(schema.projects.status, "published"),
            ),
          )
          .where(
            and(
              eq(schema.posts.kind, kind),
              eq(schema.posts.slug, slug),
              eq(schema.posts.status, "published"),
            ),
          )
          .orderBy(
            desc(schema.projects.featured),
            asc(schema.projects.displayOrder),
            desc(schema.projects.publishedAt),
            asc(schema.projects.slug),
            asc(schema.tags.name),
            asc(schema.tags.slug),
          );

        return mapPublishedPostDetailRows(rows);
      } catch (error) {
        return translateRepositoryError(error);
      }
    },

    async listPublished(kind) {
      try {
        const rows = await database
          .select({
            kind: schema.posts.kind,
            publishedAt: schema.posts.publishedAt,
            slug: schema.posts.slug,
            summary: schema.posts.summary,
            tagName: schema.tags.name,
            tagSlug: schema.tags.slug,
            title: schema.posts.title,
          })
          .from(schema.posts)
          .leftJoin(
            schema.postTags,
            eq(schema.postTags.postId, schema.posts.id),
          )
          .leftJoin(schema.tags, eq(schema.tags.id, schema.postTags.tagId))
          .where(
            and(
              eq(schema.posts.kind, kind),
              eq(schema.posts.status, "published"),
            ),
          )
          .orderBy(
            desc(schema.posts.publishedAt),
            asc(schema.posts.slug),
            asc(schema.tags.name),
            asc(schema.tags.slug),
          );

        return mapPublishedPostListRows(rows);
      } catch (error) {
        return translateRepositoryError(error);
      }
    },
  };
}

export function connectPostgresPostRepository({
  applicationName,
  connectionString,
  maxConnections = 10,
}: PostgresPostRepositoryOptions): PostgresPostRepositoryConnection {
  const pool = new Pool({
    application_name: applicationName,
    connectionString,
    max: maxConnections,
  });
  const database = drizzle(pool, { schema });

  return {
    close: () => pool.end(),
    repository: createPostgresPostRepository(database),
  };
}

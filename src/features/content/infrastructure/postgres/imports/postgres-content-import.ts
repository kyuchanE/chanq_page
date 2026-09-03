import { eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";

import type {
  ContentImportRepository,
  ContentImportSession,
} from "../../../application/imports/content-import-repository";
import {
  ContentImportError,
  type ContentImportDocument,
} from "../../../domain/imports/content-import";
import type { LocalImportTarget } from "../../imports/local-import-target";
import {
  importPostSchema,
  importProjectSchema,
  importSkillSchema,
  importTagSchema,
} from "../../imports/parse-content-import";
import type { ContentDatabase } from "../database";
import * as schema from "../schema";

function writing(
  row: typeof schema.projects.$inferSelect | typeof schema.posts.$inferSelect,
) {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogImagePath: row.ogImagePath,
  };
}

function createSession(database: ContentDatabase): ContentImportSession {
  return {
    async load(document) {
      const skillKeys = [
        ...document.skills.map((row) => row.key),
        ...document.projects.flatMap((row) => row.skillKeys),
      ];
      const tagSlugs = [
        ...document.tags.map((row) => row.slug),
        ...document.posts.flatMap((row) => row.tagSlugs),
      ];
      const projectSlugs = [
        ...document.projects.map((row) => row.slug),
        ...document.posts.flatMap((row) => row.projectSlugs),
      ];
      const postSlugs = document.posts.map((row) => row.slug);
      const skills = skillKeys.length
        ? await database
            .select()
            .from(schema.skills)
            .where(inArray(schema.skills.key, skillKeys))
        : [];
      const tags = tagSlugs.length
        ? await database
            .select()
            .from(schema.tags)
            .where(inArray(schema.tags.slug, tagSlugs))
        : [];
      const projects = projectSlugs.length
        ? await database
            .select()
            .from(schema.projects)
            .where(inArray(schema.projects.slug, projectSlugs))
        : [];
      const posts = postSlugs.length
        ? await database
            .select()
            .from(schema.posts)
            .where(inArray(schema.posts.slug, postSlugs))
        : [];
      const projectIds = projects
        .filter((row) =>
          document.projects.some((input) => input.slug === row.slug),
        )
        .map((row) => row.id);
      const postIds = posts.map((row) => row.id);
      const skillRelations = projectIds.length
        ? await database
            .select({
              projectId: schema.projectSkills.projectId,
              key: schema.skills.key,
            })
            .from(schema.projectSkills)
            .innerJoin(
              schema.skills,
              eq(schema.skills.id, schema.projectSkills.skillId),
            )
            .where(inArray(schema.projectSkills.projectId, projectIds))
        : [];
      const tagRelations = postIds.length
        ? await database
            .select({ postId: schema.postTags.postId, slug: schema.tags.slug })
            .from(schema.postTags)
            .innerJoin(schema.tags, eq(schema.tags.id, schema.postTags.tagId))
            .where(inArray(schema.postTags.postId, postIds))
        : [];
      const projectRelations = postIds.length
        ? await database
            .select({
              postId: schema.postProjects.postId,
              slug: schema.projects.slug,
            })
            .from(schema.postProjects)
            .innerJoin(
              schema.projects,
              eq(schema.projects.id, schema.postProjects.projectId),
            )
            .where(inArray(schema.postProjects.postId, postIds))
        : [];

      return {
        content: {
          version: 1,
          skills: skills
            .filter((row) =>
              document.skills.some((input) => input.key === row.key),
            )
            .map((row) =>
              importSkillSchema.parse({
                key: row.key,
                name: row.name,
                category: row.category,
                summary: row.summary,
                evidence: row.evidence,
                displayOrder: row.displayOrder,
                visible: row.visible,
              }),
            ),
          tags: tags
            .filter((row) =>
              document.tags.some((input) => input.slug === row.slug),
            )
            .map((row) =>
              importTagSchema.parse({ slug: row.slug, name: row.name }),
            ),
          projects: projects
            .filter((row) => projectIds.includes(row.id))
            .map((row) =>
              importProjectSchema.parse({
                ...writing(row),
                featured: row.featured,
                displayOrder: row.displayOrder,
                repositoryUrl: row.repositoryUrl,
                liveUrl: row.liveUrl,
                skillKeys: skillRelations
                  .filter((relation) => relation.projectId === row.id)
                  .map((relation) => relation.key),
              }),
            ),
          posts: posts.map((row) =>
            importPostSchema.parse({
              ...writing(row),
              kind: row.kind,
              tagSlugs: tagRelations
                .filter((relation) => relation.postId === row.id)
                .map((relation) => relation.slug),
              projectSlugs: projectRelations
                .filter((relation) => relation.postId === row.id)
                .map((relation) => relation.slug),
            }),
          ),
        },
        references: {
          skillKeys: skills.map((row) => row.key),
          tagSlugs: tags.map((row) => row.slug),
          projectSlugs: projects.map((row) => row.slug),
        },
      };
    },
    async save(changes: ContentImportDocument) {
      const updatedAt = new Date();
      for (const row of changes.skills) {
        await database
          .insert(schema.skills)
          .values(row)
          .onConflictDoUpdate({
            target: schema.skills.key,
            set: { ...row, updatedAt },
          });
      }
      for (const row of changes.tags) {
        await database
          .insert(schema.tags)
          .values(row)
          .onConflictDoUpdate({
            target: schema.tags.slug,
            set: { ...row, updatedAt },
          });
      }
      for (const { skillKeys, ...row } of changes.projects) {
        const values = {
          ...row,
          publishedAt:
            row.publishedAt === null ? null : new Date(row.publishedAt),
        };
        const [project] = await database
          .insert(schema.projects)
          .values(values)
          .onConflictDoUpdate({
            target: schema.projects.slug,
            set: { ...values, updatedAt },
          })
          .returning({ id: schema.projects.id });
        if (!project) throw new Error("Missing project write result.");
        const skills = skillKeys.length
          ? await database
              .select({ id: schema.skills.id })
              .from(schema.skills)
              .where(inArray(schema.skills.key, skillKeys))
          : [];
        if (skills.length !== skillKeys.length) throw missingRelation();
        await database
          .delete(schema.projectSkills)
          .where(eq(schema.projectSkills.projectId, project.id));
        if (skills.length)
          await database.insert(schema.projectSkills).values(
            skills.map((skill) => ({
              projectId: project.id,
              skillId: skill.id,
            })),
          );
      }
      for (const { tagSlugs, projectSlugs, ...row } of changes.posts) {
        const values = {
          ...row,
          publishedAt:
            row.publishedAt === null ? null : new Date(row.publishedAt),
        };
        const [post] = await database
          .insert(schema.posts)
          .values(values)
          .onConflictDoUpdate({
            target: schema.posts.slug,
            set: { ...values, updatedAt },
          })
          .returning({ id: schema.posts.id });
        if (!post) throw new Error("Missing post write result.");
        const tags = tagSlugs.length
          ? await database
              .select({ id: schema.tags.id })
              .from(schema.tags)
              .where(inArray(schema.tags.slug, tagSlugs))
          : [];
        const projects = projectSlugs.length
          ? await database
              .select({ id: schema.projects.id })
              .from(schema.projects)
              .where(inArray(schema.projects.slug, projectSlugs))
          : [];
        if (
          tags.length !== tagSlugs.length ||
          projects.length !== projectSlugs.length
        )
          throw missingRelation();
        await database
          .delete(schema.postTags)
          .where(eq(schema.postTags.postId, post.id));
        await database
          .delete(schema.postProjects)
          .where(eq(schema.postProjects.postId, post.id));
        if (tags.length)
          await database
            .insert(schema.postTags)
            .values(tags.map((tag) => ({ postId: post.id, tagId: tag.id })));
        if (projects.length)
          await database.insert(schema.postProjects).values(
            projects.map((project) => ({
              postId: post.id,
              projectId: project.id,
            })),
          );
      }
    },
  };
}

function missingRelation() {
  return new ContentImportError(
    "conflict",
    "A relation no longer exists. The full import was rolled back.",
  );
}

function databaseErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return;
  if ("code" in error && typeof error.code === "string") return error.code;
  if ("cause" in error) return databaseErrorCode(error.cause);
}

export function connectPostgresContentImport(target: LocalImportTarget): {
  repository: ContentImportRepository;
  close: () => Promise<void>;
} {
  const pool = new Pool({
    connectionString: target.connectionString,
    application_name: "chanq_page_content_import",
    max: 1,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10_000,
    lock_timeout: 5000,
  });
  const database = drizzle(pool, { schema });
  return {
    close: () => pool.end(),
    repository: {
      async transaction(mode, work) {
        try {
          return await database.transaction(
            async (transaction) => {
              const identity = await transaction.execute(sql`
              select current_database() as database, current_user as role,
                session_user as session_role, rolsuper as superuser
              from pg_roles where rolname = current_user
            `);
              const row = z
                .object({
                  database: z.literal(target.database),
                  role: z.literal(target.role),
                  session_role: z.literal(target.role),
                  superuser: z.literal(false),
                })
                .safeParse(identity.rows[0]);
              if (!row.success)
                throw new ContentImportError(
                  "invalid-target",
                  "Connected database or application role does not match the local target.",
                );
              return await work(createSession(transaction));
            },
            {
              isolationLevel: "serializable",
              accessMode: mode === "dry-run" ? "read only" : "read write",
            },
          );
        } catch (error) {
          if (error instanceof ContentImportError) throw error;
          if (
            ["23503", "23505", "40001", "40P01"].includes(
              databaseErrorCode(error) ?? "",
            )
          ) {
            throw new ContentImportError(
              "conflict",
              "A relation, identity, or concurrent write conflicted. No changes committed; review and rerun dry-run.",
            );
          }
          throw new ContentImportError(
            "unavailable",
            "Content import failed. Check local database health and stored content validity, then rerun dry-run before retrying.",
          );
        }
      },
    },
  };
}

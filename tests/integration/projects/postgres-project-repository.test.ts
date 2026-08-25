import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import { connectPostgresProjectRepository } from "@/features/content/projects.server";
import { parseProjectSlug } from "@/features/content/projects";
import { parseDatabaseEnvironment } from "@/shared/config/database-environment";

const environment = parseDatabaseEnvironment(process.env);
const fixturePool = new Pool({
  connectionString: environment.TEST_DATABASE_URL,
  max: 1,
});
const connection = connectPostgresProjectRepository({
  applicationName: "chanq_page_repository_integration",
  connectionString: environment.TEST_DATABASE_URL,
  maxConnections: 2,
});
const repository = connection.repository;

function projectSlug(value: string) {
  const slug = parseProjectSlug(value);

  if (slug === null) {
    throw new Error(`Invalid project fixture slug: ${value}`);
  }

  return slug;
}

describe("PostgreSQL project repository", () => {
  beforeAll(async () => {
    const result = await fixturePool.query<{ currentUser: string }>(
      'select current_user as "currentUser"',
    );

    expect(result.rows[0]?.currentUser).toBe(
      new URL(environment.TEST_DATABASE_URL).username,
    );

    await fixturePool.query(
      "delete from projects where slug like 'repository-test-%'",
    );
  });

  afterAll(async () => {
    await fixturePool.query(
      "delete from projects where slug like 'repository-test-%'",
    );
    await connection.close();
    await fixturePool.end();
  });

  it("lists published projects with featured and display ordering", async () => {
    const projects = await repository.listPublished();

    expect(projects.map(({ slug }) => slug)).toEqual([
      "test-fixture-featured-project",
      "test-fixture-standard-project",
    ]);
    expect(projects.every(({ publishedAt }) => publishedAt.length > 0)).toBe(
      true,
    );
  });

  it("lists only featured published projects", async () => {
    await fixturePool.query(`
      insert into projects (
        slug,
        title,
        summary,
        body,
        status,
        featured,
        display_order,
        published_at,
        seo_title,
        seo_description
      ) values (
        'repository-test-first-featured',
        'Repository Test First Featured',
        'Synthetic integration row for featured ordering.',
        '# Repository Test First Featured',
        'published',
        true,
        1,
        '2025-02-03T00:00:00Z',
        'Repository Test First Featured',
        'Synthetic integration row for featured ordering.'
      )
    `);

    try {
      const projects = await repository.listFeatured();

      expect(projects.map(({ slug }) => slug)).toEqual([
        "repository-test-first-featured",
        "test-fixture-featured-project",
      ]);
    } finally {
      await fixturePool.query(
        "delete from projects where slug = 'repository-test-first-featured'",
      );
    }
  });

  it("loads a published project with visible skills in display order", async () => {
    const project = await repository.findPublishedBySlug(
      projectSlug("test-fixture-featured-project"),
    );

    expect(project).toMatchObject({
      skills: [
        { key: "test-fixture-postgresql", name: "Fixture PostgreSQL" },
        { key: "test-fixture-typescript", name: "Fixture TypeScript" },
      ],
      slug: "test-fixture-featured-project",
      title: "Fixture Featured Project",
    });
  });

  it("does not expose draft or unknown slugs", async () => {
    await expect(
      repository.findPublishedBySlug(projectSlug("test-fixture-draft-project")),
    ).resolves.toBeNull();
    await expect(
      repository.findPublishedBySlug(projectSlug("unknown-project")),
    ).resolves.toBeNull();
  });

  it("translates invalid database rows into a project-owned error", async () => {
    await fixturePool.query(`
      insert into projects (
        slug,
        title,
        summary,
        body,
        status,
        featured,
        display_order,
        published_at,
        seo_title,
        seo_description
      ) values (
        'repository-test-invalid-row',
        ' ',
        'Synthetic integration row for boundary validation.',
        '# Repository Test Invalid Row',
        'published',
        false,
        99,
        '2025-02-03T00:00:00Z',
        'Repository Test Invalid Row',
        'Synthetic integration row for boundary validation.'
      )
    `);

    try {
      await expect(repository.listPublished()).rejects.toMatchObject({
        code: "invalid-data",
        name: "ProjectRepositoryError",
      });
    } finally {
      await fixturePool.query(
        "delete from projects where slug = 'repository-test-invalid-row'",
      );
    }
  });
});

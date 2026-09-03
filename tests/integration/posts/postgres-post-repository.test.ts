import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import { parsePostSlug } from "@/features/content/posts";
import { connectPostgresPostRepository } from "@/features/content/posts.server";
import { parseDatabaseEnvironment } from "@/shared/config/database-environment";

const environment = parseDatabaseEnvironment(process.env);
const fixturePool = new Pool({
  connectionString: environment.TEST_DATABASE_URL,
  max: 1,
});
const connection = connectPostgresPostRepository({
  applicationName: "chanq_page_post_repository_integration",
  connectionString: environment.TEST_DATABASE_URL,
  maxConnections: 2,
});
const repository = connection.repository;

function postSlug(value: string) {
  const slug = parsePostSlug(value);

  if (slug === null) {
    throw new Error(`Invalid post fixture slug: ${value}`);
  }

  return slug;
}

describe("PostgreSQL post repository", () => {
  beforeAll(async () => {
    const result = await fixturePool.query<{ currentUser: string }>(
      'select current_user as "currentUser"',
    );

    expect(result.rows[0]?.currentUser).toBe(
      new URL(environment.TEST_DATABASE_URL).username,
    );

    await fixturePool.query(
      "delete from posts where slug like 'repository-test-%'",
    );
  });

  afterAll(async () => {
    await fixturePool.query(
      "delete from posts where slug like 'repository-test-%'",
    );
    await connection.close();
    await fixturePool.end();
  });

  it("lists only published posts of the requested kind in deterministic order", async () => {
    const articles = await repository.listPublished("article");
    const retrospectives = await repository.listPublished("retrospective");

    expect(articles.map(({ slug }) => slug)).toEqual([
      "test-fixture-published-post",
      "test-fixture-older-article",
    ]);
    expect(retrospectives.map(({ slug }) => slug)).toEqual([
      "test-fixture-published-retrospective",
    ]);
    expect(articles[0]?.tags.map(({ slug }) => slug)).toEqual([
      "test-fixture-architecture",
      "test-fixture-database",
    ]);
  });

  it("uses the slug as a stable publication-order tie breaker", async () => {
    await fixturePool.query(`
      insert into posts (
        slug,
        title,
        summary,
        body,
        kind,
        status,
        published_at,
        seo_title,
        seo_description
      ) values
        (
          'repository-test-b-retrospective',
          'Repository Test B Retrospective',
          'Synthetic integration row for publication ordering.',
          '# Repository Test B Retrospective',
          'retrospective',
          'published',
          '2025-04-01T00:00:00Z',
          'Repository Test B Retrospective',
          'Synthetic integration row for publication ordering.'
        ),
        (
          'repository-test-a-retrospective',
          'Repository Test A Retrospective',
          'Synthetic integration row for publication ordering.',
          '# Repository Test A Retrospective',
          'retrospective',
          'published',
          '2025-04-01T00:00:00Z',
          'Repository Test A Retrospective',
          'Synthetic integration row for publication ordering.'
        )
    `);

    try {
      const retrospectives = await repository.listPublished("retrospective");

      expect(retrospectives.slice(0, 2).map(({ slug }) => slug)).toEqual([
        "repository-test-a-retrospective",
        "repository-test-b-retrospective",
      ]);
    } finally {
      await fixturePool.query(
        "delete from posts where slug like 'repository-test-%-retrospective'",
      );
    }
  });

  it("loads ordered tags and only published related projects", async () => {
    const retrospective = await repository.findPublishedBySlug(
      "retrospective",
      postSlug("test-fixture-published-retrospective"),
    );

    expect(retrospective).toMatchObject({
      kind: "retrospective",
      projects: [
        {
          slug: "test-fixture-standard-project",
          title: "Fixture Standard Project",
        },
      ],
      tags: [
        { name: "Fixture Architecture", slug: "test-fixture-architecture" },
        { name: "Fixture Database", slug: "test-fixture-database" },
      ],
      title: "Fixture Published Retrospective",
    });
  });

  it("does not expose drafts, kind mismatches, or unknown slugs", async () => {
    await expect(
      repository.findPublishedBySlug(
        "article",
        postSlug("test-fixture-draft-article"),
      ),
    ).resolves.toBeNull();
    await expect(
      repository.findPublishedBySlug(
        "retrospective",
        postSlug("test-fixture-draft-post"),
      ),
    ).resolves.toBeNull();
    await expect(
      repository.findPublishedBySlug(
        "article",
        postSlug("test-fixture-published-retrospective"),
      ),
    ).resolves.toBeNull();
    await expect(
      repository.findPublishedBySlug(
        "retrospective",
        postSlug("test-fixture-published-post"),
      ),
    ).resolves.toBeNull();
    await expect(
      repository.findPublishedBySlug("article", postSlug("unknown-post")),
    ).resolves.toBeNull();
  });

  it("translates invalid database rows into a post-owned error", async () => {
    await fixturePool.query(`
      insert into posts (
        slug,
        title,
        summary,
        body,
        kind,
        status,
        published_at,
        seo_title,
        seo_description
      ) values (
        'repository-test-invalid-post-row',
        ' ',
        'Synthetic integration row for boundary validation.',
        '# Repository Test Invalid Post Row',
        'article',
        'published',
        '2025-04-02T00:00:00Z',
        'Repository Test Invalid Post Row',
        'Synthetic integration row for boundary validation.'
      )
    `);

    try {
      await expect(repository.listPublished("article")).rejects.toMatchObject({
        code: "invalid-data",
        name: "PostRepositoryError",
      });
    } finally {
      await fixturePool.query(
        "delete from posts where slug = 'repository-test-invalid-post-row'",
      );
    }
  });
});

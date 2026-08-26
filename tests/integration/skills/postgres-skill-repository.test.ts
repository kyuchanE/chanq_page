import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import { connectPostgresContentRepositories } from "@/features/content/content.server";
import { parseDatabaseEnvironment } from "@/shared/config/database-environment";

const environment = parseDatabaseEnvironment(process.env);
const fixturePool = new Pool({
  connectionString: environment.TEST_DATABASE_URL,
  max: 1,
});
const connection = connectPostgresContentRepositories({
  applicationName: "chanq_page_skill_repository_integration",
  connectionString: environment.TEST_DATABASE_URL,
  maxConnections: 2,
});
const repository = connection.skills;

async function removeTemporarySkills(): Promise<void> {
  await fixturePool.query(
    "delete from skills where key like 'repository-test-skill-%'",
  );
}

async function removeDraftEvidenceRelation(): Promise<void> {
  await fixturePool.query(`
    delete from project_skills
    where project_id = '21000000-0000-4000-8000-000000000003'
      and skill_id = '20000000-0000-4000-8000-000000000001'
  `);
}

describe("PostgreSQL skill repository", () => {
  beforeAll(async () => {
    const result = await fixturePool.query<{ currentUser: string }>(
      'select current_user as "currentUser"',
    );

    expect(result.rows[0]?.currentUser).toBe(
      new URL(environment.TEST_DATABASE_URL).username,
    );

    await removeTemporarySkills();
    await removeDraftEvidenceRelation();
  });

  afterAll(async () => {
    await removeTemporarySkills();
    await removeDraftEvidenceRelation();
    await connection.close();
    await fixturePool.end();
  });

  it("lists only visible skills with deterministic category ordering", async () => {
    const skills = await repository.listVisible();

    expect(skills.map(({ key }) => key)).toEqual([
      "test-fixture-postgresql",
      "test-fixture-typescript",
    ]);
    expect(skills.map(({ category }) => category)).toEqual([
      "Database",
      "Frontend",
    ]);
    expect(skills.some(({ key }) => key.includes("hidden"))).toBe(false);
  });

  it("uses display order within a category", async () => {
    await fixturePool.query(`
      insert into skills (
        key,
        name,
        category,
        summary,
        evidence,
        display_order,
        visible
      ) values (
        'repository-test-skill-first-database',
        'Repository Test First Database',
        'Database',
        'Synthetic integration row for category ordering.',
        'Synthetic evidence for category ordering.',
        0,
        true
      )
    `);

    try {
      const skills = await repository.listVisible();

      expect(skills.slice(0, 2).map(({ key }) => key)).toEqual([
        "repository-test-skill-first-database",
        "test-fixture-postgresql",
      ]);
    } finally {
      await removeTemporarySkills();
    }
  });

  it("shows published project evidence without leaking draft projects", async () => {
    await fixturePool.query(`
      insert into project_skills (project_id, skill_id)
      values (
        '21000000-0000-4000-8000-000000000003',
        '20000000-0000-4000-8000-000000000001'
      )
    `);

    try {
      const skills = await repository.listVisible();
      const postgresql = skills.find(
        ({ key }) => key === "test-fixture-postgresql",
      );
      const typescript = skills.find(
        ({ key }) => key === "test-fixture-typescript",
      );

      expect(postgresql?.projects.map(({ slug }) => slug)).toEqual([
        "test-fixture-featured-project",
        "test-fixture-standard-project",
      ]);
      expect(typescript?.projects.map(({ slug }) => slug)).toEqual([
        "test-fixture-featured-project",
      ]);
      expect(
        skills
          .flatMap(({ projects }) => projects)
          .some(({ slug }) => slug.includes("draft")),
      ).toBe(false);
    } finally {
      await removeDraftEvidenceRelation();
    }
  });

  it("translates invalid visible rows into a skill-owned error", async () => {
    await fixturePool.query(`
      insert into skills (
        key,
        name,
        category,
        summary,
        evidence,
        display_order,
        visible
      ) values (
        'repository-test-skill-invalid-row',
        'Repository Test Invalid Skill',
        'Testing',
        ' ',
        'Synthetic evidence for boundary validation.',
        99,
        true
      )
    `);

    try {
      await expect(repository.listVisible()).rejects.toMatchObject({
        code: "invalid-data",
        name: "SkillRepositoryError",
      });
    } finally {
      await removeTemporarySkills();
    }
  });
});

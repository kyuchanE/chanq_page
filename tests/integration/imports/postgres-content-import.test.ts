import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { importContent } from "@/features/content/imports";
import { connectPostgresContentRepositories } from "@/features/content/content.server";
import { parsePostSlug } from "@/features/content/posts";
import { parseProjectSlug } from "@/features/content/projects";
import {
  connectPostgresContentImport,
  parseContentImport,
  parseLocalImportTarget,
} from "@/features/content/imports.server";
import { importFixture } from "../../fixtures/content-import";
import {
  detailMarkdownBody,
  invalidDetailBodies,
} from "../../fixtures/detail-markdown";
import { inspectDetailMarkdown } from "@/features/content/infrastructure/markdown/detail-markdown";

const target = parseLocalImportTarget("test", process.env);
const pool = new Pool({ connectionString: target.connectionString, max: 1 });
const connection = connectPostgresContentImport(target);
const apply = { mode: "apply" as const, allowPublish: false };
const dryRun = { mode: "dry-run" as const, allowPublish: false };
const script = fileURLToPath(
  new URL("../../../scripts/import-content.mts", import.meta.url),
);
const loader = createRequire(import.meta.url).resolve("tsx");
let temporaryDirectory: string;

async function cleanup() {
  for (const table of ["posts", "projects", "tags", "skills"]) {
    await pool.query(
      `delete from ${table} where ${table === "skills" ? "key" : "slug"} like 'import-check-%'`,
    );
  }
}

async function snapshot() {
  const result: Record<string, unknown> = {};
  for (const table of [
    "skills",
    "tags",
    "projects",
    "posts",
    "project_skills",
    "post_tags",
    "post_projects",
  ]) {
    const rows = await pool.query(
      `select to_jsonb(t) as row from ${table} t order by to_jsonb(t)::text`,
    );
    result[table] = rows.rows;
  }
  return result;
}

function cli(args: string[], environment: Partial<NodeJS.ProcessEnv> = {}) {
  return new Promise<{ code: number | string; stdout: string; stderr: string }>(
    (resolve) => {
      execFile(
        process.execPath,
        ["--import", loader, script, ...args],
        {
          cwd: temporaryDirectory,
          env: { ...process.env, ...environment },
          timeout: 15_000,
        },
        (error, stdout, stderr) =>
          resolve({ code: error?.code ?? 0, stdout, stderr }),
      );
    },
  );
}

beforeAll(async () => {
  const result = await pool.query(
    "select current_database() as database, current_user as role",
  );
  expect(result.rows[0]).toEqual({
    database: "chanq_page_test",
    role: "chanq_page_test_app",
  });
  temporaryDirectory = await mkdtemp(join(tmpdir(), "chanq-content-import-"));
});
beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await connection.close();
  await pool.end();
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true });
});

describe("application-role PostgreSQL content import", () => {
  it("audits the isolated existing bodies without changing them", async () => {
    const before = await snapshot();
    const { rows } = await pool.query<{ body: string }>(
      "select body from projects union all select body from posts",
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(inspectDetailMarkdown(row.body)).toEqual([]);
    expect(await snapshot()).toEqual(before);
  });

  it.each(["dry-run", "apply"] as const)(
    "rejects invalid bodies in %s with no changed rows or relations",
    async (mode) => {
      const before = await snapshot();
      for (const body of invalidDetailBodies) {
        for (const collection of ["projects", "posts"] as const) {
          const document = importFixture();
          document[collection][0].body = body;
          await expect(
            (async () =>
              importContent(
                connection.repository,
                parseContentImport(document),
                { mode, allowPublish: false },
              ))(),
          ).rejects.toMatchObject({ code: "invalid-input" });
        }
      }
      expect(await snapshot()).toEqual(before);
      // Exercise the real CLI boundary as well as the shared parser entry point.
      for (const body of [
        "<script>private-body-value</script>",
        "[unsafe][id]\n\n[id]: //example.com/private-body-value",
      ]) {
        const document = importFixture();
        document.posts[0].body = body;
        const path = join(temporaryDirectory, "invalid-body.json");
        await writeFile(path, JSON.stringify(document));
        const result = await cli([
          "--target",
          "test",
          "--file",
          path,
          `--${mode}`,
        ]);
        expect(result.code).toBe(2);
        expect(result.stderr).toContain("posts.0.body");
        expect(result.stderr).not.toContain("private-body-value");
        expect(await snapshot()).toEqual(before);
      }
    },
  );

  it("round-trips the normalized text contract for all detail kinds through preview, apply, and repeat", async () => {
    const input = importFixture();
    input.posts.push({
      ...input.posts[0],
      slug: "import-check-detail-retro",
      kind: "retrospective",
    });
    for (const row of [...input.projects, ...input.posts]) {
      row.body = `  ${detailMarkdownBody}\n\n`;
      row.status = "published";
      row.publishedAt = "2025-01-01T00:00:00.000Z";
    }
    const document = parseContentImport(input);
    const before = await snapshot();
    const preview = await importContent(connection.repository, document, {
      ...dryRun,
      allowPublish: true,
    });
    expect(preview.projects.created).toBe(1);
    expect(preview.posts.created).toBe(2);
    expect(await snapshot()).toEqual(before);
    await importContent(connection.repository, document, {
      ...apply,
      allowPublish: true,
    });
    const written = await snapshot();
    const repeat = await importContent(connection.repository, document, {
      ...apply,
      allowPublish: true,
    });
    expect(repeat.projects.unchanged).toBe(1);
    expect(repeat.posts.unchanged).toBe(2);
    expect(await snapshot()).toEqual(written);
    const reads = connectPostgresContentRepositories({
      applicationName: "chanq_page_markdown_round_trip",
      connectionString: target.connectionString,
      maxConnections: 1,
    });
    try {
      const projectSlug = parseProjectSlug(document.projects[0].slug);
      if (!projectSlug) throw new Error("Invalid fixture slug");
      expect(
        await reads.projects.findPublishedBySlug(projectSlug),
      ).toMatchObject({ body: detailMarkdownBody });
      for (const row of document.posts) {
        const postSlug = parsePostSlug(row.slug);
        if (!postSlug) throw new Error("Invalid fixture slug");
        expect(
          await reads.posts.findPublishedBySlug(row.kind, postSlug),
        ).toMatchObject({ body: detailMarkdownBody, kind: row.kind });
      }
    } finally {
      await reads.close();
    }
    await cleanup();
    expect(await snapshot()).toEqual(before);
  });

  it("lets a reviewed valid import repair incompatible legacy text without silently rewriting stored data", async () => {
    const document = importFixture();
    await importContent(connection.repository, document, apply);
    await pool.query("update posts set body = $1 where slug = $2", [
      "[unsafe](javascript:legacy)",
      document.posts[0].slug,
    ]);
    const before = await snapshot();
    expect(
      (await importContent(connection.repository, document, dryRun)).posts
        .updated,
    ).toBe(1);
    expect(await snapshot()).toEqual(before);
    expect(
      (await importContent(connection.repository, document, apply)).posts
        .updated,
    ).toBe(1);
    expect(
      (
        await pool.query("select body from posts where slug = $1", [
          document.posts[0].slug,
        ])
      ).rows[0].body,
    ).toBe(document.posts[0].body);
  });

  it("round-trips maximum-length published identities through all public repositories", async () => {
    const document = importFixture();
    const identity = `import-check-${"a".repeat(87)}`;
    document.skills[0].key = identity;
    document.skills[0].visible = true;
    document.tags[0].slug = identity;
    document.projects[0].slug = identity;
    document.projects[0].skillKeys = [identity];
    document.posts[0].slug = identity;
    document.posts[0].tagSlugs = [identity];
    document.posts[0].projectSlugs = [identity];
    for (const row of [...document.posts, ...document.projects]) {
      row.status = "published";
      row.publishedAt = "2025-01-01T00:00:00.000Z";
    }
    await importContent(connection.repository, parseContentImport(document), {
      ...apply,
      allowPublish: true,
    });
    const reads = connectPostgresContentRepositories({
      applicationName: "chanq_page_import_round_trip",
      connectionString: target.connectionString,
      maxConnections: 1,
    });
    try {
      const postSlug = parsePostSlug(identity);
      const projectSlug = parseProjectSlug(identity);
      if (!postSlug || !projectSlug)
        throw new Error("Import identity must be publicly readable.");
      expect(
        await reads.posts.findPublishedBySlug("article", postSlug),
      ).toMatchObject({
        body: document.posts[0].body,
        tags: [{ slug: identity }],
        projects: [{ slug: identity }],
      });
      expect(
        await reads.projects.findPublishedBySlug(projectSlug),
      ).toMatchObject({ skills: [{ key: identity }] });
      expect(
        (await reads.skills.listVisible()).find((row) => row.key === identity),
      ).toMatchObject({ projects: [{ slug: identity }] });
    } finally {
      await reads.close();
    }
  });

  it("runs dry-run inside a database-enforced read-only transaction with zero changes", async () => {
    const before = await snapshot();
    const summary = await importContent(
      connection.repository,
      importFixture(),
      dryRun,
    );
    expect(summary.projects).toEqual({ created: 1, updated: 0, unchanged: 0 });
    expect(await snapshot()).toEqual(before);
    // A regression that calls save during dry-run must still be denied by PostgreSQL.
    await expect(
      connection.repository.transaction("dry-run", (session) =>
        session.save(importFixture()),
      ),
    ).rejects.toMatchObject({ code: "unavailable" });
    expect(await snapshot()).toEqual(before);
  });

  it("imports all aggregates and relations, then preserves UUIDs, timestamps, and values on repeat", async () => {
    const document = importFixture();
    const first = await importContent(connection.repository, document, apply);
    for (const key of ["skills", "tags", "projects", "posts"] as const)
      expect(first[key].created).toBe(1);
    const before = await snapshot();
    const second = await importContent(connection.repository, document, apply);
    for (const key of ["skills", "tags", "projects", "posts"] as const)
      expect(second[key]).toEqual({ created: 0, updated: 0, unchanged: 1 });
    expect(await snapshot()).toEqual(before);
    const relations = await pool.query(`
      select s.key, t.slug as tag, p.slug as project, a.status
      from posts a
      join post_tags pt on pt.post_id = a.id join tags t on t.id = pt.tag_id
      join post_projects pp on pp.post_id = a.id join projects p on p.id = pp.project_id
      join project_skills ps on ps.project_id = p.id join skills s on s.id = ps.skill_id
      where a.slug = 'import-check-draft-article'
    `);
    expect(relations.rows).toEqual([
      {
        key: "import-check-content-review",
        tag: "import-check-authoring",
        project: "import-check-draft-project",
        status: "draft",
      },
    ]);
  });

  it("updates only supplied records and relations, supporting references already in the database", async () => {
    const document = importFixture();
    await importContent(connection.repository, document, apply);
    const original = await pool.query(
      "select id, created_at from posts where slug = 'import-check-draft-article'",
    );
    const fixtureBefore = await pool.query(
      "select to_jsonb(p) as row from projects p where slug like 'test-fixture-%' order by slug",
    );
    const partial = {
      version: 1 as const,
      skills: [],
      tags: [],
      projects: [],
      posts: [{ ...document.posts[0], title: "Updated article", tagSlugs: [] }],
    };
    const summary = await importContent(connection.repository, partial, apply);
    expect(summary.posts.updated).toBe(1);
    expect(summary.skills).toEqual({ created: 0, updated: 0, unchanged: 0 });
    const result = await pool.query(
      "select id, created_at, title from posts where slug = 'import-check-draft-article'",
    );
    expect(result.rows[0]).toEqual({
      ...original.rows[0],
      title: "Updated article",
    });
    expect(
      (
        await pool.query("select * from post_tags where post_id = $1", [
          original.rows[0].id,
        ])
      ).rows,
    ).toEqual([]);
    expect(
      (
        await pool.query("select * from post_projects where post_id = $1", [
          original.rows[0].id,
        ])
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await pool.query(
          "select to_jsonb(p) as row from projects p where slug like 'test-fixture-%' order by slug",
        )
      ).rows,
    ).toEqual(fixtureBefore.rows);
  });

  it("requires publication permission for both new rows and drafts; supports explicit unpublishing", async () => {
    const draft = importFixture();
    const published = structuredClone(draft);
    for (const row of [...published.posts, ...published.projects]) {
      row.status = "published";
      row.publishedAt = "2025-02-01T00:00:00.000Z";
    }
    await expect(
      importContent(connection.repository, published, apply),
    ).rejects.toMatchObject({ code: "conflict" });
    await importContent(connection.repository, draft, apply);
    const before = await snapshot();
    await expect(
      importContent(connection.repository, published, apply),
    ).rejects.toMatchObject({ code: "conflict" });
    expect(await snapshot()).toEqual(before);
    await importContent(connection.repository, published, {
      ...apply,
      allowPublish: true,
    });
    const repeated = await importContent(
      connection.repository,
      published,
      apply,
    );
    expect(repeated.posts.unchanged).toBe(1);
    await importContent(connection.repository, draft, apply);
    expect(
      (
        await pool.query(
          "select status, published_at from posts where slug = 'import-check-draft-article'",
        )
      ).rows,
    ).toEqual([{ status: "draft", published_at: null }]);
  });

  it("rejects a kind conflict or missing relation without modifying any content", async () => {
    const document = importFixture();
    await importContent(connection.repository, document, apply);
    const before = await snapshot();
    document.posts[0].kind = "retrospective";
    document.skills[0].name = "Must not persist";
    await expect(
      importContent(connection.repository, document, apply),
    ).rejects.toMatchObject({ code: "conflict" });
    document.posts[0].kind = "article";
    document.posts[0].tagSlugs.push("missing-tag");
    await expect(
      importContent(connection.repository, document, dryRun),
    ).rejects.toMatchObject({ code: "conflict" });
    await expect(
      importContent(connection.repository, document, apply),
    ).rejects.toMatchObject({ code: "conflict" });
    expect(await snapshot()).toEqual(before);
  });

  it("rolls back earlier writes when relation resolution fails later in the adapter", async () => {
    const document = importFixture();
    const before = await snapshot();
    document.posts[0].tagSlugs = ["missing-tag"];
    await expect(
      connection.repository.transaction("apply", (session) =>
        session.save(document),
      ),
    ).rejects.toMatchObject({ code: "conflict" });
    expect(await snapshot()).toEqual(before);
  });

  it("rolls back earlier writes on a real PostgreSQL constraint failure", async () => {
    const document = importFixture();
    const before = await snapshot();
    document.projects[0].displayOrder = -1;
    await expect(
      connection.repository.transaction("apply", (session) =>
        session.save(document),
      ),
    ).rejects.toMatchObject({ code: "unavailable" });
    expect(await snapshot()).toEqual(before);
  });

  it("detects a mismatched connected identity independently of URL validation", async () => {
    const mismatched = connectPostgresContentImport({
      ...target,
      database: "chanq_page",
    });
    try {
      await expect(
        importContent(mismatched.repository, importFixture(), dryRun),
      ).rejects.toMatchObject({ code: "invalid-target" });
    } finally {
      await mismatched.close();
    }
  });
});

describe("content import CLI", () => {
  it("shows help and defaults to dry-run from outside the repository", async () => {
    expect((await cli(["--help"])).code).toBe(0);
    const before = await snapshot();
    const result = await cli([
      "--target",
      "test",
      "--file",
      "content/examples/local-draft.json",
    ]);
    expect(result.code, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      target: "test",
      mode: "dry-run",
    });
    expect(await snapshot()).toEqual(before);
  });

  it("applies and repeats a file with a safe deterministic summary", async () => {
    const path = join(temporaryDirectory, "draft.json");
    await writeFile(path, JSON.stringify(importFixture()));
    const args = ["--target", "test", "--file", path, "--apply"];
    const result = await cli(args);
    expect(result.code, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).posts.created).toBe(1);
    expect(JSON.parse((await cli(args)).stdout).posts.unchanged).toBe(1);
    expect(result.stdout).not.toContain(importFixture().posts[0].body);
  });

  it("returns exit 2 for malformed files, marker leakage, invalid flags, and wrong targets without writes", async () => {
    const before = await snapshot();
    const path = join(temporaryDirectory, "invalid.json");
    const args = ["--target", "test", "--file", path, "--apply"];
    for (const source of [
      '{"PRIVATE-CONTENT":',
      JSON.stringify({ ...importFixture(), version: 8 }),
      JSON.stringify(importFixture()).replace(
        "import-check-authoring",
        "dev-seed-private",
      ),
    ]) {
      await writeFile(path, source);
      const result = await cli(args);
      expect(result.code).toBe(2);
      expect(result.stderr).not.toMatch(/PRIVATE-CONTENT|dev-seed-private/);
    }
    for (const args of [
      [],
      ["--unknown"],
      ["--target", "production", "--file", path],
      ["--target", "test", "--file", path, "--dry-run", "--apply"],
      ["--target", "test", "--target", "development", "--file", path],
      ["--target", "test", "--file", "missing.json"],
    ]) {
      expect((await cli(args)).code).toBe(2);
    }
    const wrongTarget = await cli(args, {
      TEST_DATABASE_URL:
        "postgresql://root:PRIVATE-PASSWORD@127.0.0.1:5433/chanq_page_test",
    });
    expect(wrongTarget.code).toBe(2);
    expect(wrongTarget.stderr).not.toContain("PRIVATE-PASSWORD");
    expect(await snapshot()).toEqual(before);
  });

  it("returns exit 3 on missing relations and unapproved publication, and 1 on connection failure", async () => {
    const path = join(temporaryDirectory, "conflict.json");
    const args = ["--target", "test", "--file", path, "--apply"];
    const document = importFixture();
    document.posts[0].tagSlugs = ["missing-tag"];
    await writeFile(path, JSON.stringify(document));
    expect((await cli(args)).code).toBe(3);
    const publication = importFixture();
    publication.posts[0].status = "published";
    publication.posts[0].publishedAt = "2025-01-01T00:00:00.000Z";
    await writeFile(path, JSON.stringify(parseContentImport(publication)));
    expect((await cli(args)).code).toBe(3);
    expect((await cli([...args, "--allow-publish"])).code).toBe(0);
    const unavailable = await cli(args, {
      POSTGRES_PORT: "1",
      TEST_DATABASE_URL:
        "postgresql://chanq_page_test_app:PRIVATE-PASSWORD@127.0.0.1:1/chanq_page_test",
    });
    expect(unavailable.code).toBe(1);
    expect(unavailable.stderr).not.toContain("PRIVATE-PASSWORD");
  });
});

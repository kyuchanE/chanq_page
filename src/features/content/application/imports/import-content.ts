import {
  ContentImportError,
  type ContentImportDocument,
} from "../../domain/imports/content-import";
import type {
  ContentImportMode,
  ContentImportRepository,
  ContentImportSnapshot,
} from "./content-import-repository";

export type ImportCounts = {
  created: number;
  updated: number;
  unchanged: number;
};
export type ContentImportSummary = {
  mode: ContentImportMode;
  skills: ImportCounts;
  tags: ImportCounts;
  projects: ImportCounts;
  posts: ImportCounts;
};

function comparable(value: object): string {
  return JSON.stringify(value, Object.keys(value).sort());
}

function planRows<T extends object>(
  incoming: T[],
  existing: T[],
  identity: (row: T) => string,
  check: (row: T, previous: T | undefined) => void = () => {},
): { changes: T[]; counts: ImportCounts } {
  const byIdentity = new Map(existing.map((row) => [identity(row), row]));
  const counts = { created: 0, updated: 0, unchanged: 0 };
  const changes: T[] = [];

  for (const row of incoming) {
    const previous = byIdentity.get(identity(row));
    check(row, previous);
    if (previous && comparable(row) === comparable(previous)) {
      counts.unchanged++;
    } else {
      counts[previous ? "updated" : "created"]++;
      changes.push(row);
    }
  }

  return { changes, counts };
}

function checkRelations(
  document: ContentImportDocument,
  snapshot: ContentImportSnapshot,
) {
  const skillKeys = new Set([
    ...snapshot.references.skillKeys,
    ...document.skills.map((row) => row.key),
  ]);
  const tagSlugs = new Set([
    ...snapshot.references.tagSlugs,
    ...document.tags.map((row) => row.slug),
  ]);
  const projectSlugs = new Set([
    ...snapshot.references.projectSlugs,
    ...document.projects.map((row) => row.slug),
  ]);

  if (
    document.projects.some((row) =>
      row.skillKeys.some((key) => !skillKeys.has(key)),
    ) ||
    document.posts.some(
      (row) =>
        row.tagSlugs.some((slug) => !tagSlugs.has(slug)) ||
        row.projectSlugs.some((slug) => !projectSlugs.has(slug)),
    )
  ) {
    throw new ContentImportError(
      "conflict",
      "A relation is missing. Include its record in the input or import it first.",
    );
  }
}

export async function importContent(
  repository: ContentImportRepository,
  document: ContentImportDocument,
  options: { mode: ContentImportMode; allowPublish: boolean },
): Promise<ContentImportSummary> {
  return repository.transaction(options.mode, async (session) => {
    const snapshot = await session.load(document);
    checkRelations(document, snapshot);

    const checkPublication = (
      row: { status: string },
      previous: { status: string } | undefined,
    ) => {
      if (
        row.status === "published" &&
        previous?.status !== "published" &&
        !options.allowPublish
      ) {
        throw new ContentImportError(
          "conflict",
          "New publication requires --allow-publish, including publication of an existing draft.",
        );
      }
    };
    const skills = planRows(
      document.skills,
      snapshot.content.skills,
      (row) => row.key,
    );
    const tags = planRows(
      document.tags,
      snapshot.content.tags,
      (row) => row.slug,
    );
    const projects = planRows(
      document.projects,
      snapshot.content.projects,
      (row) => row.slug,
      checkPublication,
    );
    const posts = planRows(
      document.posts,
      snapshot.content.posts,
      (row) => row.slug,
      (row, previous) => {
        checkPublication(row, previous);
        if (previous && previous.kind !== row.kind) {
          throw new ContentImportError(
            "conflict",
            "An existing post kind cannot change through import because it owns the public URL.",
          );
        }
      },
    );

    if (options.mode === "apply") {
      await session.save({
        version: 1,
        skills: skills.changes,
        tags: tags.changes,
        projects: projects.changes,
        posts: posts.changes,
      });
    }

    return {
      mode: options.mode,
      skills: skills.counts,
      tags: tags.counts,
      projects: projects.counts,
      posts: posts.counts,
    };
  });
}

import { and, asc, desc, eq } from "drizzle-orm";

import {
  SkillRepositoryError,
  type SkillRepository,
} from "@/features/content/application/skills/skill-repository";
import type { ContentDatabase } from "@/features/content/infrastructure/postgres/database";
import * as schema from "@/features/content/infrastructure/postgres/schema";
import {
  InvalidSkillRowError,
  mapVisibleSkillRows,
} from "@/features/content/infrastructure/postgres/skills/skill-row-mapper";

function translateRepositoryError(error: unknown): never {
  if (error instanceof SkillRepositoryError) {
    throw error;
  }

  if (error instanceof InvalidSkillRowError) {
    throw new SkillRepositoryError(
      "invalid-data",
      "Visible skill data is invalid.",
      { cause: error },
    );
  }

  throw new SkillRepositoryError(
    "unavailable",
    "Visible skills are temporarily unavailable.",
    { cause: error },
  );
}

export function createPostgresSkillRepository(
  database: ContentDatabase,
): SkillRepository {
  return {
    async listVisible() {
      try {
        const rows = await database
          .select({
            category: schema.skills.category,
            displayOrder: schema.skills.displayOrder,
            evidence: schema.skills.evidence,
            key: schema.skills.key,
            name: schema.skills.name,
            projectSlug: schema.projects.slug,
            projectTitle: schema.projects.title,
            summary: schema.skills.summary,
          })
          .from(schema.skills)
          .leftJoin(
            schema.projectSkills,
            eq(schema.projectSkills.skillId, schema.skills.id),
          )
          .leftJoin(
            schema.projects,
            and(
              eq(schema.projects.id, schema.projectSkills.projectId),
              eq(schema.projects.status, "published"),
            ),
          )
          .where(eq(schema.skills.visible, true))
          .orderBy(
            asc(schema.skills.category),
            asc(schema.skills.displayOrder),
            asc(schema.skills.name),
            asc(schema.skills.key),
            desc(schema.projects.featured),
            asc(schema.projects.displayOrder),
            desc(schema.projects.publishedAt),
            asc(schema.projects.slug),
          );

        return mapVisibleSkillRows(rows);
      } catch (error) {
        return translateRepositoryError(error);
      }
    },
  };
}

import { z } from "zod";

import { parseProjectSlug } from "@/features/content/domain/projects/project";
import type { VisibleSkill } from "@/features/content/domain/skills/skill";
import { parseSkillKey } from "@/features/content/domain/skills/skill";

const nonEmptyText = z.string().trim().min(1);
const skillKey = nonEmptyText.transform((value, context) => {
  const key = parseSkillKey(value);

  if (key === null) {
    context.addIssue({
      code: "custom",
      message: "Expected a lowercase, URL-safe skill key.",
    });

    return z.NEVER;
  }

  return key;
});
const projectSlug = nonEmptyText.nullable().transform((value, context) => {
  if (value === null) {
    return null;
  }

  const slug = parseProjectSlug(value);

  if (slug === null) {
    context.addIssue({
      code: "custom",
      message: "Expected a lowercase, URL-safe related project slug.",
    });

    return z.NEVER;
  }

  return slug;
});

const visibleSkillRowSchema = z
  .object({
    category: nonEmptyText,
    displayOrder: z.int().nonnegative(),
    evidence: nonEmptyText,
    key: skillKey,
    name: nonEmptyText,
    projectSlug,
    projectTitle: nonEmptyText.nullable(),
    summary: nonEmptyText,
  })
  .strict()
  .superRefine((row, context) => {
    if ((row.projectSlug === null) !== (row.projectTitle === null)) {
      context.addIssue({
        code: "custom",
        message:
          "Expected either a complete published-project relation or no relation.",
      });
    }
  });

type ParsedSkillRow = z.infer<typeof visibleSkillRowSchema>;
type MutableVisibleSkill = Omit<VisibleSkill, "projects"> & {
  projects: Array<VisibleSkill["projects"][number]>;
};

export class InvalidSkillRowError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidSkillRowError";
  }
}

function parseRow(row: unknown): ParsedSkillRow {
  const result = visibleSkillRowSchema.safeParse(row);

  if (!result.success) {
    throw new InvalidSkillRowError(
      "PostgreSQL returned a skill row that does not match the visible skill contract.",
      { cause: result.error },
    );
  }

  return result.data;
}

function assertConsistentSkill(
  skill: MutableVisibleSkill,
  row: ParsedSkillRow,
): void {
  if (
    skill.category !== row.category ||
    skill.evidence !== row.evidence ||
    skill.name !== row.name ||
    skill.summary !== row.summary
  ) {
    throw new InvalidSkillRowError(
      "PostgreSQL returned inconsistent skill data across project relations.",
    );
  }
}

export function mapVisibleSkillRows(
  rows: readonly unknown[],
): readonly VisibleSkill[] {
  const skillsByKey = new Map<string, MutableVisibleSkill>();

  for (const candidate of rows) {
    const row = parseRow(candidate);
    let skill = skillsByKey.get(row.key);

    if (skill === undefined) {
      skill = {
        category: row.category,
        evidence: row.evidence,
        key: row.key,
        name: row.name,
        projects: [],
        summary: row.summary,
      };
      skillsByKey.set(row.key, skill);
    } else {
      assertConsistentSkill(skill, row);
    }

    if (
      row.projectSlug !== null &&
      row.projectTitle !== null &&
      !skill.projects.some(({ slug }) => slug === row.projectSlug)
    ) {
      skill.projects.push({ slug: row.projectSlug, title: row.projectTitle });
    }
  }

  return Array.from(skillsByKey.values(), (skill) => ({
    ...skill,
    projects: [...skill.projects],
  }));
}

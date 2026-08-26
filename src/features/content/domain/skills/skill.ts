import type { ProjectSlug } from "@/features/content/domain/projects/project";

const skillKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

declare const skillKeyBrand: unique symbol;

export type SkillKey = string & {
  readonly [skillKeyBrand]: "SkillKey";
};

export type VisibleSkillProjectEvidence = Readonly<{
  slug: ProjectSlug;
  title: string;
}>;

export type VisibleSkill = Readonly<{
  category: string;
  evidence: string;
  key: SkillKey;
  name: string;
  projects: readonly VisibleSkillProjectEvidence[];
  summary: string;
}>;

export function parseSkillKey(value: unknown): SkillKey | null {
  if (
    typeof value !== "string" ||
    value.length > 100 ||
    !skillKeyPattern.test(value)
  ) {
    return null;
  }

  return value as SkillKey;
}

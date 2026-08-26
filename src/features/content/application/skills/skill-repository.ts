import type { VisibleSkill } from "@/features/content/domain/skills/skill";

export type SkillRepositoryErrorCode = "invalid-data" | "unavailable";

export class SkillRepositoryError extends Error {
  readonly code: SkillRepositoryErrorCode;

  constructor(
    code: SkillRepositoryErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "SkillRepositoryError";
    this.code = code;
  }
}

export interface SkillRepository {
  listVisible(): Promise<readonly VisibleSkill[]>;
}

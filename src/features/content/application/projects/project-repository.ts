import type {
  ProjectSlug,
  PublishedProjectDetail,
  PublishedProjectListItem,
} from "@/features/content/domain/projects/project";

export type ProjectRepositoryErrorCode = "invalid-data" | "unavailable";

export class ProjectRepositoryError extends Error {
  readonly code: ProjectRepositoryErrorCode;

  constructor(
    code: ProjectRepositoryErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ProjectRepositoryError";
    this.code = code;
  }
}

export interface ProjectRepository {
  findPublishedBySlug(
    slug: ProjectSlug,
  ): Promise<PublishedProjectDetail | null>;
  listFeatured(): Promise<readonly PublishedProjectListItem[]>;
  listPublished(): Promise<readonly PublishedProjectListItem[]>;
}

import type { ContentImportDocument } from "../../domain/imports/content-import";

export type ContentImportMode = "dry-run" | "apply";

export type ContentImportSnapshot = {
  content: ContentImportDocument;
  references: {
    skillKeys: string[];
    tagSlugs: string[];
    projectSlugs: string[];
  };
};

export interface ContentImportSession {
  load(document: ContentImportDocument): Promise<ContentImportSnapshot>;
  save(changes: ContentImportDocument): Promise<void>;
}

export interface ContentImportRepository {
  transaction<T>(
    mode: ContentImportMode,
    work: (session: ContentImportSession) => Promise<T>,
  ): Promise<T>;
}

export type ImportPublication = {
  status: "draft" | "published";
  publishedAt: string | null;
};

type ImportWriting = ImportPublication & {
  slug: string;
  title: string;
  summary: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  ogImagePath: string | null;
};

export type ImportProject = ImportWriting & {
  featured: boolean;
  displayOrder: number;
  repositoryUrl: string | null;
  liveUrl: string | null;
  skillKeys: string[];
};

export type ImportPost = ImportWriting & {
  kind: "article" | "retrospective";
  tagSlugs: string[];
  projectSlugs: string[];
};

export type ImportSkill = {
  key: string;
  name: string;
  category: string;
  summary: string;
  evidence: string;
  displayOrder: number;
  visible: boolean;
};

export type ImportTag = { slug: string; name: string };

export type ContentImportDocument = {
  version: 1;
  skills: ImportSkill[];
  tags: ImportTag[];
  projects: ImportProject[];
  posts: ImportPost[];
};

export class ContentImportError extends Error {
  constructor(
    public readonly code:
      "invalid-input" | "invalid-target" | "conflict" | "unavailable",
    message: string,
  ) {
    super(message);
    this.name = "ContentImportError";
  }
}

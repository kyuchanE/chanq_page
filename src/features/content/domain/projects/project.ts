const projectSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

declare const projectSlugBrand: unique symbol;

export type ProjectSlug = string & {
  readonly [projectSlugBrand]: "ProjectSlug";
};

export type PublishedProjectListItem = Readonly<{
  featured: boolean;
  publishedAt: string;
  slug: ProjectSlug;
  summary: string;
  title: string;
}>;

export type PublishedProjectSkill = Readonly<{
  key: string;
  name: string;
}>;

export type PublishedProjectDetail = Readonly<{
  body: string;
  featured: boolean;
  liveUrl: string | null;
  ogImagePath: string | null;
  publishedAt: string;
  repositoryUrl: string | null;
  seoDescription: string;
  seoTitle: string;
  skills: readonly PublishedProjectSkill[];
  slug: ProjectSlug;
  summary: string;
  title: string;
}>;

export function parseProjectSlug(value: unknown): ProjectSlug | null {
  if (
    typeof value !== "string" ||
    value.length > 100 ||
    !projectSlugPattern.test(value)
  ) {
    return null;
  }

  return value as ProjectSlug;
}

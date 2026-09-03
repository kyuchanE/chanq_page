const postSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const POST_KINDS = ["article", "retrospective"] as const;

export type PostKind = (typeof POST_KINDS)[number];

declare const postSlugBrand: unique symbol;

export type PostSlug = string & {
  readonly [postSlugBrand]: "PostSlug";
};

export type PublishedPostTag = Readonly<{
  name: string;
  slug: string;
}>;

export type PublishedPostListItem = Readonly<{
  kind: PostKind;
  publishedAt: string;
  slug: PostSlug;
  summary: string;
  tags: readonly PublishedPostTag[];
  title: string;
}>;

export type PublishedPostProject = Readonly<{
  slug: string;
  title: string;
}>;

export type PublishedPostDetail = Readonly<{
  body: string;
  kind: PostKind;
  ogImagePath: string | null;
  projects: readonly PublishedPostProject[];
  publishedAt: string;
  seoDescription: string;
  seoTitle: string;
  slug: PostSlug;
  summary: string;
  tags: readonly PublishedPostTag[];
  title: string;
}>;

export function parsePostSlug(value: unknown): PostSlug | null {
  if (
    typeof value !== "string" ||
    value.length > 100 ||
    !postSlugPattern.test(value)
  ) {
    return null;
  }

  return value as PostSlug;
}

export function postSectionPath(kind: PostKind): "/blog" | "/retrospectives" {
  return kind === "article" ? "/blog" : "/retrospectives";
}

export function postDetailPath(kind: PostKind, slug: PostSlug): string {
  return `${postSectionPath(kind)}/${slug}`;
}

import type { Metadata } from "next";
import { cache } from "react";

import { getContentRepositories } from "@/app/_composition/content";
import type { PostKind, PublishedPostDetail } from "@/features/content/posts";
import { parsePostSlug, postDetailPath } from "@/features/content/posts";

export async function listPublishedPosts(kind: PostKind) {
  return getContentRepositories().posts.listPublished(kind);
}

export const findPublishedPost = cache(
  async (kind: PostKind, candidateSlug: unknown) => {
    const slug = parsePostSlug(candidateSlug);

    if (slug === null) {
      return null;
    }

    return getContentRepositories().posts.findPublishedBySlug(kind, slug);
  },
);

export function createPublishedPostMetadata(
  post: PublishedPostDetail,
): Metadata {
  const canonicalPath = postDetailPath(post.kind, post.slug);

  return {
    alternates: {
      canonical: canonicalPath,
    },
    description: post.seoDescription,
    openGraph: {
      description: post.seoDescription,
      publishedTime: post.publishedAt,
      title: post.seoTitle,
      type: "article",
      url: canonicalPath,
    },
    title: post.seoTitle,
  };
}

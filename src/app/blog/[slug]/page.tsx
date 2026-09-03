import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  createPublishedPostMetadata,
  findPublishedPost,
} from "@/app/_composition/posts";
import { PostDetail } from "@/features/content/posts";

export const dynamic = "force-dynamic";

type BlogPostPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPublishedPost("article", slug);

  if (post === null) {
    return { title: "Article not found" };
  }

  return createPublishedPostMetadata(post);
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await findPublishedPost("article", slug);

  if (post === null) {
    notFound();
  }

  return <PostDetail post={post} />;
}

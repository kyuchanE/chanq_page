import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  createPublishedPostMetadata,
  findPublishedPost,
} from "@/app/_composition/posts";
import { PostDetail } from "@/features/content/posts";

export const dynamic = "force-dynamic";

type RetrospectivePageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({
  params,
}: RetrospectivePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPublishedPost("retrospective", slug);

  if (post === null) {
    return { title: "Retrospective not found" };
  }

  return createPublishedPostMetadata(post);
}

export default async function RetrospectivePage({
  params,
}: RetrospectivePageProps) {
  const { slug } = await params;
  const post = await findPublishedPost("retrospective", slug);

  if (post === null) {
    notFound();
  }

  return <PostDetail post={post} />;
}

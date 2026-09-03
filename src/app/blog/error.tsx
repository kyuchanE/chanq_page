"use client";

import { PostError } from "@/features/content/posts";

type BlogErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function BlogError({ reset }: BlogErrorProps) {
  return <PostError kind="article" reset={reset} />;
}

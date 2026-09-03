"use client";

import { PostError } from "@/features/content/posts";

type RetrospectivesErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function RetrospectivesError({
  reset,
}: RetrospectivesErrorProps) {
  return <PostError kind="retrospective" reset={reset} />;
}

"use client";

import type { PostKind } from "@/features/content/domain/posts/post";

type PostErrorProps = Readonly<{
  kind: PostKind;
  reset: () => void;
}>;

const copy = {
  article: {
    eyebrow: "Blog unavailable",
    title: "The articles could not be loaded.",
  },
  retrospective: {
    eyebrow: "Retrospectives unavailable",
    title: "The retrospectives could not be loaded.",
  },
} as const;

export function PostError({ kind, reset }: PostErrorProps) {
  return (
    <section aria-labelledby="post-error-title" className="content-route-state">
      <p className="content-route-state__eyebrow">{copy[kind].eyebrow}</p>
      <h1 id="post-error-title">{copy[kind].title}</h1>
      <p>
        This is a temporary problem. Try the request again without leaving this
        page.
      </p>
      <button onClick={reset} type="button">
        Try again
      </button>
    </section>
  );
}

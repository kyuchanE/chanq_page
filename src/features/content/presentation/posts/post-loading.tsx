import type { PostKind } from "@/features/content/domain/posts/post";

type PostLoadingProps = Readonly<{
  kind: PostKind;
}>;

const copy = {
  article: {
    eyebrow: "Blog",
    title: "Loading articles…",
  },
  retrospective: {
    eyebrow: "Retrospectives",
    title: "Loading retrospectives…",
  },
} as const;

export function PostLoading({ kind }: PostLoadingProps) {
  return (
    <section
      aria-busy="true"
      aria-labelledby="post-loading-title"
      aria-live="polite"
      className="content-route-state"
    >
      <p className="content-route-state__eyebrow">{copy[kind].eyebrow}</p>
      <h1 id="post-loading-title">{copy[kind].title}</h1>
      <p>The latest published writing is being prepared.</p>
    </section>
  );
}

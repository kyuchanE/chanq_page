import Link from "next/link";

import {
  type PostKind,
  postSectionPath,
} from "@/features/content/domain/posts/post";

type PostNotFoundProps = Readonly<{
  kind: PostKind;
}>;

const copy = {
  article: {
    eyebrow: "Article not found",
    link: "View published articles",
    noun: "article",
  },
  retrospective: {
    eyebrow: "Retrospective not found",
    link: "View published retrospectives",
    noun: "retrospective",
  },
} as const;

export function PostNotFound({ kind }: PostNotFoundProps) {
  const sectionCopy = copy[kind];

  return (
    <section className="post-not-found">
      <p className="post-not-found__eyebrow">{sectionCopy.eyebrow}</p>
      <h1>This {sectionCopy.noun} is not available.</h1>
      <p>
        It may be unpublished, filed in another section, or the address may be
        incorrect. Browse the published writing to continue.
      </p>
      <Link href={postSectionPath(kind)}>{sectionCopy.link}</Link>
    </section>
  );
}

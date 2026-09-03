import Link from "next/link";

import {
  type PublishedPostDetail as PublishedPostDetailValue,
  postSectionPath,
} from "@/features/content/domain/posts/post";
import { DetailMarkdown } from "../markdown/detail-markdown";

type PostDetailProps = Readonly<{
  post: PublishedPostDetailValue;
}>;

const publicationDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const copy = {
  article: {
    back: "All articles",
    eyebrow: "Technical article",
  },
  retrospective: {
    back: "All retrospectives",
    eyebrow: "Development retrospective",
  },
} as const;

export function PostDetail({ post }: PostDetailProps) {
  const sectionCopy = copy[post.kind];

  return (
    <article className="post-detail">
      <Link className="post-detail__back" href={postSectionPath(post.kind)}>
        <span aria-hidden="true">←</span> {sectionCopy.back}
      </Link>

      <header className="post-detail__header">
        <p className="post-detail__eyebrow">{sectionCopy.eyebrow}</p>
        <h1>{post.title}</h1>
        <p className="post-detail__summary">{post.summary}</p>
        <time dateTime={post.publishedAt}>
          Published {publicationDate.format(new Date(post.publishedAt))}
        </time>
      </header>

      {post.tags.length > 0 ? (
        <section aria-labelledby="post-topics" className="post-topics">
          <h2 id="post-topics">Topics</h2>
          <ul>
            {post.tags.map((tag) => (
              <li key={tag.slug}>{tag.name}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {post.projects.length > 0 ? (
        <section
          aria-labelledby="related-projects"
          className="post-related-projects"
        >
          <h2 id="related-projects">Related projects</h2>
          <ul>
            {post.projects.map((project) => (
              <li key={project.slug}>
                <Link href={`/projects/${project.slug}`}>{project.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DetailMarkdown body={post.body} />
    </article>
  );
}

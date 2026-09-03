import Link from "next/link";

import {
  type PostKind,
  type PublishedPostListItem,
  postDetailPath,
} from "@/features/content/domain/posts/post";

type PostListProps = Readonly<{
  kind?: PostKind;
  posts: readonly PublishedPostListItem[];
}>;

const publicationDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const copy = {
  article: {
    empty: "No technical articles are published yet. Please check back soon.",
    link: "Read article",
  },
  retrospective: {
    empty: "No retrospectives are published yet. Please check back soon.",
    link: "Read retrospective",
  },
} as const satisfies Record<PostKind, { empty: string; link: string }>;

export function PostList({ kind, posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <p className="post-empty-state">
        {kind
          ? copy[kind].empty
          : "No writing is published yet. Explore the project case studies in the meantime."}
      </p>
    );
  }

  return (
    <ul className="post-list">
      {posts.map((post) => {
        const detailPath = postDetailPath(post.kind, post.slug);

        return (
          <li className="post-card" key={post.slug}>
            <article>
              <time dateTime={post.publishedAt}>
                {publicationDate.format(new Date(post.publishedAt))}
              </time>
              <h3>
                <Link href={detailPath}>{post.title}</Link>
              </h3>
              <p className="post-card__summary">{post.summary}</p>
              {post.tags.length > 0 ? (
                <ul
                  aria-label={`Topics for ${post.title}`}
                  className="post-tags"
                >
                  {post.tags.map((tag) => (
                    <li key={tag.slug}>{tag.name}</li>
                  ))}
                </ul>
              ) : null}
              <Link
                aria-label={`${copy[post.kind].link}: ${post.title}`}
                className="post-card__link"
                href={detailPath}
              >
                {copy[post.kind].link} <span aria-hidden="true">→</span>
              </Link>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

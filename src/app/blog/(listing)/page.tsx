import type { Metadata } from "next";

import { listPublishedPosts } from "@/app/_composition/posts";
import { PostList } from "@/features/content/posts";
import { PageIntroduction } from "@/shared/ui/page-introduction";

export const dynamic = "force-dynamic";

const description =
  "Technical articles that document practical decisions, debugging, and implementation tradeoffs.";

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  title: "Blog",
  description,
};

export default async function BlogPage() {
  const posts = await listPublishedPosts("article");

  return (
    <div className="posts-page">
      <PageIntroduction
        description={description}
        eyebrow="Writing"
        title="Blog"
      />
      <section
        aria-labelledby="published-articles"
        className="posts-page__content"
      >
        <div className="section-heading">
          <p>Technical writing</p>
          <h2 id="published-articles">Published articles</h2>
        </div>
        <PostList kind="article" posts={posts} />
      </section>
    </div>
  );
}

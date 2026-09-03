import type { Metadata } from "next";

import { listPublishedPosts } from "@/app/_composition/posts";
import { PostList } from "@/features/content/posts";
import { PageIntroduction } from "@/shared/ui/page-introduction";

export const dynamic = "force-dynamic";

const description =
  "Development retrospectives focused on lessons from troubleshooting, delivery, and collaboration.";

export const metadata: Metadata = {
  alternates: { canonical: "/retrospectives" },
  title: "Retrospectives",
  description,
};

export default async function RetrospectivesPage() {
  const posts = await listPublishedPosts("retrospective");

  return (
    <div className="posts-page">
      <PageIntroduction
        description={description}
        eyebrow="Learning notes"
        title="Retrospectives"
      />
      <section
        aria-labelledby="published-retrospectives"
        className="posts-page__content"
      >
        <div className="section-heading">
          <p>Lessons learned</p>
          <h2 id="published-retrospectives">Published retrospectives</h2>
        </div>
        <PostList kind="retrospective" posts={posts} />
      </section>
    </div>
  );
}

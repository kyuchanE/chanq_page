import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Technical articles, retrospectives, and development notes.",
};

export default function BlogPage() {
  return (
    <main>
      <h1>Blog</h1>
      <p>
        This section will collect technical articles, retrospectives, and
        development notes.
      </p>
    </main>
  );
}

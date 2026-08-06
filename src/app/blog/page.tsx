import type { Metadata } from "next";

import { PageIntroduction } from "@/shared/ui/page-introduction";

export const metadata: Metadata = {
  title: "Blog",
  description: "Technical articles, retrospectives, and development notes.",
};

export default function BlogPage() {
  return (
    <PageIntroduction
      description="This section will collect technical articles, retrospectives, and development notes."
      eyebrow="Writing"
      title="Blog"
    />
  );
}

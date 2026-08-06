import type { Metadata } from "next";

import { PageIntroduction } from "@/shared/ui/page-introduction";

export const metadata: Metadata = {
  title: "About",
  description:
    "An introduction to the developer's background, working principles, and current interests.",
};

export default function AboutPage() {
  return (
    <PageIntroduction
      description="This section will introduce the developer's background, working principles, and current interests."
      eyebrow="Profile"
      title="About"
    />
  );
}

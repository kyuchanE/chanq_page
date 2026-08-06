import type { Metadata } from "next";

import { PageIntroduction } from "@/shared/ui/page-introduction";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Project case studies covering technical decisions, results, and limitations.",
};

export default function ProjectsPage() {
  return (
    <PageIntroduction
      description="This section will present project case studies, technical decisions, results, and limitations."
      eyebrow="Case studies"
      title="Projects"
    />
  );
}

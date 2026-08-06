import type { Metadata } from "next";

import { PageIntroduction } from "@/shared/ui/page-introduction";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Technical skills connected to practical experience and supporting evidence.",
};

export default function SkillsPage() {
  return (
    <PageIntroduction
      description="This section will connect technical skills to practical experience and supporting evidence."
      eyebrow="Capabilities"
      title="Skills"
    />
  );
}

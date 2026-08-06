import type { Metadata } from "next";

import { PageIntroduction } from "@/shared/ui/page-introduction";

export const metadata: Metadata = {
  title: "Retrospectives",
  description:
    "Lessons learned from development, troubleshooting, and collaboration.",
};

export default function RetrospectivesPage() {
  return (
    <PageIntroduction
      description="This section will document lessons learned from development, troubleshooting, and collaboration."
      eyebrow="Learning notes"
      title="Retrospectives"
    />
  );
}

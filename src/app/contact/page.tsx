import type { Metadata } from "next";

import { PageIntroduction } from "@/shared/ui/page-introduction";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact details and links to professional profiles.",
};

export default function ContactPage() {
  return (
    <PageIntroduction
      description="This section will provide contact details and links to professional profiles."
      eyebrow="Get in touch"
      title="Contact"
    />
  );
}

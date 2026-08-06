import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Technical skills connected to practical experience and supporting evidence.",
};

export default function SkillsPage() {
  return (
    <main>
      <h1>Skills</h1>
      <p>
        This section will connect technical skills to practical experience and
        supporting evidence.
      </p>
    </main>
  );
}

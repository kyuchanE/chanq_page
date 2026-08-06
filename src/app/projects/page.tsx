import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Project case studies covering technical decisions, results, and limitations.",
};

export default function ProjectsPage() {
  return (
    <main>
      <h1>Projects</h1>
      <p>
        This section will present project case studies, technical decisions,
        results, and limitations.
      </p>
    </main>
  );
}

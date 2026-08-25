import type { Metadata } from "next";

import { listPublishedProjects } from "@/app/_composition/projects";
import { ProjectList } from "@/features/content/projects";
import { PageIntroduction } from "@/shared/ui/page-introduction";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Project case studies covering technical decisions, results, and limitations.",
};

export default async function ProjectsPage() {
  const projects = await listPublishedProjects();

  return (
    <div className="projects-page">
      <PageIntroduction
        description="Case studies that connect technical decisions to implementation evidence, tradeoffs, and honest limitations."
        eyebrow="Case studies"
        title="Projects"
      />
      <section
        aria-labelledby="published-projects"
        className="projects-page__content"
      >
        <div className="section-heading">
          <p>Selected work</p>
          <h2 id="published-projects">Published projects</h2>
        </div>
        <ProjectList projects={projects} />
      </section>
    </div>
  );
}

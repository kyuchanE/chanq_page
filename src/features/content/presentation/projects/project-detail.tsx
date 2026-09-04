import Link from "next/link";

import type { PublishedProjectDetail as PublishedProjectDetailValue } from "@/features/content/domain/projects/project";
import { DetailMarkdown } from "../markdown/detail-markdown";

type ProjectDetailProps = Readonly<{
  project: PublishedProjectDetailValue;
}>;

const publicationDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

export function ProjectDetail({ project }: ProjectDetailProps) {
  return (
    <article className="project-detail">
      <Link className="project-detail__back" href="/projects">
        <span aria-hidden="true">←</span> All projects
      </Link>

      <header className="project-detail__header">
        <p className="project-detail__eyebrow">
          {project.featured ? "Featured case study" : "Project case study"}
        </p>
        <h1>{project.title}</h1>
        <p className="project-detail__summary">{project.summary}</p>
        <time dateTime={project.publishedAt}>
          Published {publicationDate.format(new Date(project.publishedAt))}
        </time>
      </header>

      {project.skills.length > 0 ? (
        <section
          aria-labelledby="project-technologies"
          className="project-skills"
        >
          <h2 id="project-technologies">Technologies</h2>
          <ul>
            {project.skills.map((skill) => (
              <li key={skill.key}>{skill.name}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {project.repositoryUrl !== null || project.liveUrl !== null ? (
        <nav aria-label="Project links" className="project-detail__links">
          {project.repositoryUrl !== null ? (
            <a
              href={project.repositoryUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Source repository{" "}
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : null}
          {project.liveUrl !== null ? (
            <a href={project.liveUrl} rel="noopener noreferrer" target="_blank">
              Live project <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : null}
        </nav>
      ) : null}

      <DetailMarkdown body={project.body} contentSlug={project.slug} />
    </article>
  );
}

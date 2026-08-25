import Link from "next/link";

import type { PublishedProjectListItem } from "@/features/content/domain/projects/project";

type ProjectListProps = Readonly<{
  projects: readonly PublishedProjectListItem[];
}>;

const publicationDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <p className="project-empty-state">
        No project case studies are published yet. Please check back soon.
      </p>
    );
  }

  return (
    <ul className="project-list">
      {projects.map((project) => (
        <li className="project-card" key={project.slug}>
          <div className="project-card__meta">
            {project.featured ? (
              <span className="project-card__featured">Featured</span>
            ) : null}
            <time dateTime={project.publishedAt}>
              {publicationDate.format(new Date(project.publishedAt))}
            </time>
          </div>
          <h2 className="project-card__title">
            <Link href={`/projects/${project.slug}`}>{project.title}</Link>
          </h2>
          <p className="project-card__summary">{project.summary}</p>
          <Link
            aria-label={`Read the ${project.title} case study`}
            className="project-card__link"
            href={`/projects/${project.slug}`}
          >
            Read case study <span aria-hidden="true">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

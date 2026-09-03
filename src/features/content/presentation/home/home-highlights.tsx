import Link from "next/link";

import type { HomeHighlights } from "../../application/home/load-home-highlights";
import { PostList } from "../posts/post-list";
import { ProjectList } from "../projects/project-list";

function UnavailableNotice({ section }: Readonly<{ section: string }>) {
  return (
    <p className="home-notice" role="status">
      {section} could not be fully loaded.{" "}
      {/* A full reload retries server reads even when already on this URL. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/">Reload the overview</a> to try again.
    </p>
  );
}

export function HomeHighlightsView({
  highlights,
}: Readonly<{ highlights: HomeHighlights }>) {
  return (
    <>
      <section aria-labelledby="featured-projects" className="home-section">
        <header className="section-heading">
          <p>Decisions in context</p>
          <h2 id="featured-projects">Featured projects</h2>
        </header>
        {highlights.projects.unavailable ? (
          <UnavailableNotice section="Featured projects" />
        ) : (
          <ProjectList
            projects={highlights.projects.items}
            headingLevel={3}
            emptyMessage="No featured projects are selected yet. Browse all projects for available case studies."
          />
        )}
        <Link className="text-link" href="/projects">
          Browse all projects <span aria-hidden="true">→</span>
        </Link>
      </section>
      <section aria-labelledby="skills-in-practice" className="home-section">
        <header className="section-heading">
          <p>From tools to decisions</p>
          <h2 id="skills-in-practice">Skills in practice</h2>
        </header>
        {highlights.skills.unavailable ? (
          <UnavailableNotice section="Skills" />
        ) : highlights.skills.items.length === 0 ? (
          <p className="skill-empty-state">
            No skills with linked project evidence are available yet. Explore
            the full skills page for more context.
          </p>
        ) : (
          <ul className="skill-list home-skills">
            {highlights.skills.items.map((skill) => (
              <li className="skill-card" key={skill.key}>
                <article>
                  <h3>{skill.name}</h3>
                  <p className="skill-card__summary">{skill.summary}</p>
                  <div className="skill-card__evidence">
                    <p className="skill-card__label">Evidence</p>
                    <p>{skill.evidence}</p>
                  </div>
                  <Link
                    className="text-link"
                    href={`/projects/${skill.projects[0].slug}`}
                  >
                    {skill.projects[0].title}
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
        <Link className="text-link" href="/skills">
          Explore all skills <span aria-hidden="true">→</span>
        </Link>
      </section>
      <section aria-labelledby="recent-writing" className="home-section">
        <header className="section-heading">
          <p>Notes from the work</p>
          <h2 id="recent-writing">Recent writing</h2>
        </header>
        {highlights.writing.unavailable ? (
          <UnavailableNotice section="Recent writing" />
        ) : null}
        {highlights.writing.items.length > 0 ||
        !highlights.writing.unavailable ? (
          <PostList posts={highlights.writing.items} />
        ) : null}
        <div className="page-actions">
          <Link className="text-link" href="/blog">
            Read all articles <span aria-hidden="true">→</span>
          </Link>
          <Link className="text-link" href="/retrospectives">
            Read retrospectives <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}

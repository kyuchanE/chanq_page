"use client";

type ProjectsErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ProjectsError({ reset }: ProjectsErrorProps) {
  return (
    <section
      aria-labelledby="projects-error-title"
      className="project-route-state"
    >
      <p className="project-route-state__eyebrow">Projects unavailable</p>
      <h1 id="projects-error-title">The case studies could not be loaded.</h1>
      <p>
        This is a temporary problem. Try the request again without leaving this
        page.
      </p>
      <button onClick={reset} type="button">
        Try again
      </button>
    </section>
  );
}

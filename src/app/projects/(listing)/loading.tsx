export default function ProjectsLoading() {
  return (
    <section
      aria-busy="true"
      aria-labelledby="projects-loading-title"
      aria-live="polite"
      className="project-route-state"
    >
      <p className="project-route-state__eyebrow">Projects</p>
      <h1 id="projects-loading-title">Loading case studies…</h1>
      <p>The latest published project details are being prepared.</p>
    </section>
  );
}

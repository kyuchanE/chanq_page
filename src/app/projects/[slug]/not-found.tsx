import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <section className="project-not-found">
      <p className="project-not-found__eyebrow">Project not found</p>
      <h1>This case study is not available.</h1>
      <p>
        The project may be unpublished, or the address may be incorrect. Browse
        the published case studies to continue.
      </p>
      <Link href="/projects">View published projects</Link>
    </section>
  );
}

export default function SkillsLoading() {
  return (
    <section
      aria-busy="true"
      aria-labelledby="skills-loading-title"
      aria-live="polite"
      className="content-route-state"
    >
      <p className="content-route-state__eyebrow">Skills</p>
      <h1 id="skills-loading-title">Loading skill evidence…</h1>
      <p>The latest published skill relationships are being prepared.</p>
    </section>
  );
}

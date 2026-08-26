"use client";

type SkillsErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function SkillsError({ reset }: SkillsErrorProps) {
  return (
    <section
      aria-labelledby="skills-error-title"
      className="content-route-state"
    >
      <p className="content-route-state__eyebrow">Skills unavailable</p>
      <h1 id="skills-error-title">The skill evidence could not be loaded.</h1>
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

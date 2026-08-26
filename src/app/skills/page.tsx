import type { Metadata } from "next";

import { listVisibleSkills } from "@/app/_composition/skills";
import { SkillList } from "@/features/content/skills";
import { PageIntroduction } from "@/shared/ui/page-introduction";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Technical skills connected to practical experience and supporting evidence.",
};

export default async function SkillsPage() {
  const skills = await listVisibleSkills();

  return (
    <div className="skills-page">
      <PageIntroduction
        description="Evidence-backed tools and practices connected to published implementation work, without arbitrary proficiency scores."
        eyebrow="Capabilities"
        title="Skills"
      />
      <section
        aria-labelledby="visible-skills"
        className="skills-page__content"
      >
        <div className="section-heading">
          <p>Practical evidence</p>
          <h2 id="visible-skills">Skills demonstrated in project work</h2>
        </div>
        <SkillList skills={skills} />
      </section>
    </div>
  );
}

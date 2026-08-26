import Link from "next/link";

import type { VisibleSkill } from "@/features/content/domain/skills/skill";

type SkillListProps = Readonly<{
  skills: readonly VisibleSkill[];
}>;

type SkillCategory = Readonly<{
  name: string;
  skills: readonly VisibleSkill[];
}>;

function groupSkillsByCategory(
  skills: readonly VisibleSkill[],
): readonly SkillCategory[] {
  const categories = new Map<string, VisibleSkill[]>();

  for (const skill of skills) {
    const categorySkills = categories.get(skill.category);

    if (categorySkills === undefined) {
      categories.set(skill.category, [skill]);
    } else {
      categorySkills.push(skill);
    }
  }

  return Array.from(categories, ([name, categorySkills]) => ({
    name,
    skills: categorySkills,
  }));
}

export function SkillList({ skills }: SkillListProps) {
  if (skills.length === 0) {
    return (
      <p className="skill-empty-state">
        No evidence-backed skills are published yet. Please check back soon.
      </p>
    );
  }

  const categories = groupSkillsByCategory(skills);

  return (
    <div className="skill-groups">
      {categories.map((category, categoryIndex) => {
        const headingId = `skill-category-${categoryIndex + 1}`;

        return (
          <section
            aria-labelledby={headingId}
            className="skill-category"
            key={category.name}
          >
            <header className="skill-category__header">
              <p>Capability area</p>
              <h2 id={headingId}>{category.name}</h2>
            </header>
            <ul className="skill-list">
              {category.skills.map((skill) => (
                <li className="skill-card" key={skill.key}>
                  <article>
                    <h3>{skill.name}</h3>
                    <p className="skill-card__summary">{skill.summary}</p>
                    <div className="skill-card__evidence">
                      <p className="skill-card__label">Evidence</p>
                      <p>{skill.evidence}</p>
                    </div>
                    {skill.projects.length > 0 ? (
                      <div className="skill-card__projects">
                        <h4>Related case studies</h4>
                        <ul>
                          {skill.projects.map((project) => (
                            <li key={project.slug}>
                              <Link href={`/projects/${project.slug}`}>
                                {project.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

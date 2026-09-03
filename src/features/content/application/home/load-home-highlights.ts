import type { PostRepository } from "../posts/post-repository";
import type { ProjectRepository } from "../projects/project-repository";
import type { SkillRepository } from "../skills/skill-repository";
import type { PublishedPostListItem } from "../../domain/posts/post";
import type { PublishedProjectListItem } from "../../domain/projects/project";
import type { VisibleSkill } from "../../domain/skills/skill";

type HighlightSection<T> = Readonly<{
  items: readonly T[];
  unavailable: boolean;
}>;

export type HomeHighlights = Readonly<{
  projects: HighlightSection<PublishedProjectListItem>;
  skills: HighlightSection<VisibleSkill>;
  writing: HighlightSection<PublishedPostListItem>;
}>;

type HomeRepositories = Readonly<{
  projects: Pick<ProjectRepository, "listFeatured">;
  skills: Pick<SkillRepository, "listVisible">;
  posts: Pick<PostRepository, "listPublished">;
}>;

function section<T>(
  result: PromiseSettledResult<readonly T[]>,
): HighlightSection<T> {
  return result.status === "fulfilled"
    ? { items: result.value, unavailable: false }
    : { items: [], unavailable: true };
}

export async function loadHomeHighlights(
  repositories: HomeRepositories,
): Promise<HomeHighlights> {
  // Each read can fail independently without hiding the other entry points.
  const [projects, skills, articles, retrospectives] = await Promise.allSettled(
    [
      repositories.projects.listFeatured(),
      repositories.skills.listVisible(),
      repositories.posts.listPublished("article"),
      repositories.posts.listPublished("retrospective"),
    ],
  );
  const projectSection = section(projects);
  const skillSection = section(skills);
  const articleSection = section(articles);
  const retrospectiveSection = section(retrospectives);

  return {
    projects: { ...projectSection, items: projectSection.items.slice(0, 2) },
    skills: {
      ...skillSection,
      items: skillSection.items
        .filter((skill) => skill.evidence.trim() && skill.projects.length > 0)
        .slice(0, 3),
    },
    writing: {
      unavailable:
        articleSection.unavailable || retrospectiveSection.unavailable,
      items: [...articleSection.items, ...retrospectiveSection.items]
        .sort((left, right) => {
          const byDate =
            Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
          if (byDate !== 0) return byDate;
          return left.slug < right.slug ? -1 : left.slug > right.slug ? 1 : 0;
        })
        .slice(0, 3),
    },
  };
}

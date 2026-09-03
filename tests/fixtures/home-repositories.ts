import preview from "../../content/examples/portfolio-preview.json";
import {
  parsePostSlug,
  type PublishedPostListItem,
} from "@/features/content/posts";
import {
  parseProjectSlug,
  type PublishedProjectListItem,
} from "@/features/content/projects";
import { parseSkillKey, type VisibleSkill } from "@/features/content/skills";
import type { PostKind } from "@/features/content/posts";

export const previewProjects: PublishedProjectListItem[] = preview.projects.map(
  (project) => ({
    ...project,
    slug: parseProjectSlug(project.slug)!,
  }),
);

export const previewPosts: PublishedPostListItem[] = preview.posts.map(
  (post) => ({
    ...post,
    kind: post.kind as PostKind,
    slug: parsePostSlug(post.slug)!,
    tags: preview.tags.filter((tag) => post.tagSlugs.includes(tag.slug)),
  }),
);

export const previewSkills: VisibleSkill[] = preview.skills.map((skill) => ({
  ...skill,
  key: parseSkillKey(skill.key)!,
  projects: preview.projects
    .filter((project) => project.skillKeys.includes(skill.key))
    .map((project) => ({
      title: project.title,
      slug: parseProjectSlug(project.slug)!,
    })),
}));

export function homeRepositories() {
  return {
    projects: { listFeatured: async () => previewProjects },
    skills: { listVisible: async () => previewSkills },
    posts: {
      listPublished: async (kind: PostKind) =>
        previewPosts.filter((post) => post.kind === kind),
    },
  };
}

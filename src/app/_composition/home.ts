import { getContentRepositories } from "@/app/_composition/content";
import { loadHomeHighlights } from "@/features/content/home";

export async function getHomeHighlights() {
  return loadHomeHighlights({
    projects: {
      listFeatured: async () =>
        getContentRepositories().projects.listFeatured(),
    },
    skills: {
      listVisible: async () => getContentRepositories().skills.listVisible(),
    },
    posts: {
      listPublished: async (kind) =>
        getContentRepositories().posts.listPublished(kind),
    },
  });
}

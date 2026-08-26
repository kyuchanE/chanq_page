import { cache } from "react";

import { getContentRepositories } from "@/app/_composition/content";
import { parseProjectSlug } from "@/features/content/projects.server";

export async function listPublishedProjects() {
  return getContentRepositories().projects.listPublished();
}

export const findPublishedProject = cache(async (candidateSlug: unknown) => {
  const slug = parseProjectSlug(candidateSlug);

  if (slug === null) {
    return null;
  }

  return getContentRepositories().projects.findPublishedBySlug(slug);
});

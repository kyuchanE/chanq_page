import { getContentRepositories } from "@/app/_composition/content";

export async function listVisibleSkills() {
  return getContentRepositories().skills.listVisible();
}

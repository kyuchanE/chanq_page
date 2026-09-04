import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findPublishedProject } from "@/app/_composition/projects";
import { ProjectDetail } from "@/features/content/presentation/projects/project-detail";

export const dynamic = "force-dynamic";

type ProjectPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await findPublishedProject(slug);

  if (project === null) {
    return {
      title: "Project not found",
    };
  }

  return {
    description: project.seoDescription,
    openGraph: {
      description: project.seoDescription,
      title: project.seoTitle,
      type: "article",
    },
    title: project.seoTitle,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await findPublishedProject(slug);

  if (project === null) {
    notFound();
  }

  return <ProjectDetail project={project} />;
}

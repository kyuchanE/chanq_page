import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { ProjectRepository } from "@/features/content/application/projects/project-repository";
import type { PostRepository } from "@/features/content/application/posts/post-repository";
import type { SkillRepository } from "@/features/content/application/skills/skill-repository";
import { createPostgresPostRepository } from "@/features/content/infrastructure/postgres/posts/postgres-post-repository";
import { createPostgresProjectRepository } from "@/features/content/infrastructure/postgres/projects/postgres-project-repository";
import * as schema from "@/features/content/infrastructure/postgres/schema";
import { createPostgresSkillRepository } from "@/features/content/infrastructure/postgres/skills/postgres-skill-repository";

export type PostgresContentRepositoriesConnection = Readonly<{
  close: () => Promise<void>;
  posts: PostRepository;
  projects: ProjectRepository;
  skills: SkillRepository;
}>;

type PostgresContentRepositoriesOptions = Readonly<{
  applicationName: string;
  connectionString: string;
  maxConnections?: number;
}>;

export function connectPostgresContentRepositories({
  applicationName,
  connectionString,
  maxConnections = 10,
}: PostgresContentRepositoriesOptions): PostgresContentRepositoriesConnection {
  const pool = new Pool({
    application_name: applicationName,
    connectionString,
    max: maxConnections,
  });
  const database = drizzle(pool, { schema });

  return {
    close: () => pool.end(),
    posts: createPostgresPostRepository(database),
    projects: createPostgresProjectRepository(database),
    skills: createPostgresSkillRepository(database),
  };
}

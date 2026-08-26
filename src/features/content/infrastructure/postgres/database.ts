import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "@/features/content/infrastructure/postgres/schema";

export type ContentDatabase = NodePgDatabase<typeof schema>;

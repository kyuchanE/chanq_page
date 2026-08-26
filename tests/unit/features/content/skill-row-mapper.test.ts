import { describe, expect, it } from "vitest";

import {
  InvalidSkillRowError,
  mapVisibleSkillRows,
} from "@/features/content/infrastructure/postgres/skills/skill-row-mapper";

const baseSkillRow = {
  category: "Database",
  displayOrder: 1,
  evidence: "Validated relational behavior with integration tests.",
  key: "postgresql",
  name: "PostgreSQL",
  summary: "Relational content modeling and repository boundaries.",
};

describe("visible skill row mapping", () => {
  it("groups published project evidence under a project-owned skill value", () => {
    expect(
      mapVisibleSkillRows([
        {
          ...baseSkillRow,
          projectSlug: "portfolio-foundation",
          projectTitle: "Portfolio Foundation",
        },
        {
          ...baseSkillRow,
          projectSlug: "content-import",
          projectTitle: "Content Import",
        },
      ]),
    ).toEqual([
      {
        category: "Database",
        evidence: "Validated relational behavior with integration tests.",
        key: "postgresql",
        name: "PostgreSQL",
        projects: [
          {
            slug: "portfolio-foundation",
            title: "Portfolio Foundation",
          },
          { slug: "content-import", title: "Content Import" },
        ],
        summary: "Relational content modeling and repository boundaries.",
      },
    ]);
  });

  it("keeps a visible skill when it has no published project relation", () => {
    expect(
      mapVisibleSkillRows([
        {
          ...baseSkillRow,
          projectSlug: null,
          projectTitle: null,
        },
      ])[0]?.projects,
    ).toEqual([]);
  });

  it("rejects malformed keys and partial project relations", () => {
    expect(() =>
      mapVisibleSkillRows([
        {
          ...baseSkillRow,
          key: "Not URL Safe",
          projectSlug: null,
          projectTitle: null,
        },
      ]),
    ).toThrow(InvalidSkillRowError);

    expect(() =>
      mapVisibleSkillRows([
        {
          ...baseSkillRow,
          projectSlug: "portfolio-foundation",
          projectTitle: null,
        },
      ]),
    ).toThrow(InvalidSkillRowError);
  });

  it("rejects inconsistent skill values across joined rows", () => {
    expect(() =>
      mapVisibleSkillRows([
        {
          ...baseSkillRow,
          projectSlug: null,
          projectTitle: null,
        },
        {
          ...baseSkillRow,
          evidence: "Conflicting evidence.",
          projectSlug: "portfolio-foundation",
          projectTitle: "Portfolio Foundation",
        },
      ]),
    ).toThrow(InvalidSkillRowError);
  });
});

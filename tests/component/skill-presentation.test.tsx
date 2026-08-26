/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { parseProjectSlug } from "@/features/content/projects";
import { parseSkillKey, SkillList } from "@/features/content/skills";

function skillKey(value: string) {
  const key = parseSkillKey(value);

  if (key === null) {
    throw new Error("The component fixture uses an invalid skill key.");
  }

  return key;
}

function projectSlug(value: string) {
  const slug = parseProjectSlug(value);

  if (slug === null) {
    throw new Error("The component fixture uses an invalid project slug.");
  }

  return slug;
}

describe("skill presentation", () => {
  it("renders category-grouped evidence and published project links", () => {
    render(
      <SkillList
        skills={[
          {
            category: "Database",
            evidence: "Validated repository behavior against PostgreSQL.",
            key: skillKey("postgresql"),
            name: "PostgreSQL",
            projects: [
              {
                slug: projectSlug("portfolio-foundation"),
                title: "Portfolio Foundation",
              },
            ],
            summary: "Relational modeling and repository boundaries.",
          },
          {
            category: "Frontend",
            evidence: "Built strict server-rendered application flows.",
            key: skillKey("typescript"),
            name: "TypeScript",
            projects: [],
            summary: "Type-safe application and UI behavior.",
          },
        ]}
      />,
    );

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map(({ textContent }) => textContent?.trim()),
    ).toEqual(["Database", "Frontend"]);
    expect(screen.getByText(/Validated repository behavior/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Portfolio Foundation" }),
    ).toHaveAttribute("href", "/projects/portfolio-foundation");
    expect(screen.queryByText(/proficiency|percentage|rating/i)).toBeNull();
  });

  it("renders an honest empty state", () => {
    render(<SkillList skills={[]} />);

    expect(
      screen.getByText(/No evidence-backed skills are published/),
    ).toBeVisible();
  });
});

/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SkillsError from "@/app/skills/error";
import SkillsLoading from "@/app/skills/loading";

describe("skill route states", () => {
  it("announces database-backed loading", () => {
    const { container } = render(<SkillsLoading />);

    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Loading skill evidence…" }),
    ).toBeVisible();
  });

  it("offers a retry without rendering repository details", () => {
    const reset = vi.fn();

    render(
      <SkillsError
        error={new Error("database-secret-that-must-not-render")}
        reset={reset}
      />,
    );

    expect(screen.queryByText(/database-secret/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});

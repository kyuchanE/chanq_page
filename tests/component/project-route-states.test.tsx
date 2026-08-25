/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProjectsLoading from "@/app/projects/(listing)/loading";
import ProjectsError from "@/app/projects/error";

describe("project route states", () => {
  it("announces database-backed loading without motion", () => {
    const { container } = render(<ProjectsLoading />);

    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Loading case studies…" }),
    ).toBeVisible();
  });

  it("offers a recoverable action without exposing the repository error", () => {
    const reset = vi.fn();

    render(
      <ProjectsError
        error={new Error("database-secret-that-must-not-render")}
        reset={reset}
      />,
    );

    expect(screen.queryByText(/database-secret/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});

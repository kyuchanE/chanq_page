/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BlogError from "@/app/blog/error";
import { PostLoading, PostNotFound } from "@/features/content/posts";

describe("post route states", () => {
  it("announces kind-specific database-backed loading without motion", () => {
    const { container } = render(<PostLoading kind="retrospective" />);

    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Loading retrospectives…" }),
    ).toBeVisible();
  });

  it("offers recovery without exposing a repository error", () => {
    const reset = vi.fn();

    render(
      <BlogError
        error={new Error("database-secret-that-must-not-render")}
        reset={reset}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "The articles could not be loaded.",
      }),
    ).toBeVisible();
    expect(screen.queryByText(/database-secret/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("returns visitors to the owning section from a not-found state", () => {
    render(<PostNotFound kind="retrospective" />);

    expect(
      screen.getByRole("heading", {
        name: "This retrospective is not available.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View published retrospectives" }),
    ).toHaveAttribute("href", "/retrospectives");
  });
});

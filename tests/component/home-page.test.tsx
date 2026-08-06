// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import Home from "@/app/page";

afterEach(cleanup);

describe("Home", () => {
  it("introduces the portfolio purpose with a visible heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Developer Portfolio",
      }),
    ).toBeVisible();
    expect(screen.getByText(/practical experience/i)).toBeVisible();
  });
});

// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PrimaryNavigation } from "@/app/_components/primary-navigation";
import { PublicShell } from "@/app/_components/public-shell";

const navigationState = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

afterEach(() => {
  cleanup();
  navigationState.pathname = "/";
});

describe("PublicShell", () => {
  it("shows the terminal greeting before the independently sticky navigation", () => {
    render(
      <PublicShell>
        <h1>Page heading</h1>
      </PublicShell>,
    );

    const banner = screen.getByRole("banner");
    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });

    expect(screen.getByText("Hello, World!")).toBeVisible();
    expect(navigation).toBeVisible();
    expect(banner).not.toContainElement(navigation);
    expect(
      banner.compareDocumentPosition(navigation) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("contentinfo")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Skip to main content" }),
    ).toHaveAttribute("href", "#main-content");
  });
});

describe("PrimaryNavigation", () => {
  it("marks the exact home link as the current page", () => {
    render(<PrimaryNavigation />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Projects" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps a parent section current on a nested public route", () => {
    navigationState.pathname = "/projects/example-project";

    render(<PrimaryNavigation />);

    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

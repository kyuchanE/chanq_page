// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import {
  HomeHighlightsView,
  loadHomeHighlights,
  type HomeHighlights,
} from "@/features/content/home";
import { homeRepositories } from "../fixtures/home-repositories";

afterEach(cleanup);

describe("Home highlights presentation", () => {
  it("links project evidence and both writing kinds under section headings", async () => {
    render(
      <HomeHighlightsView
        highlights={await loadHomeHighlights(homeRepositories())}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Featured projects" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Field Notes — sample offline journal",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: "Read article: Sample article: a retry is a state transition",
      }),
    ).toHaveAttribute("href", "/blog/sample-safe-retries");
    expect(
      screen.getByRole("link", {
        name: "Read retrospective: Sample retrospective: make unsynced work visible",
      }),
    ).toHaveAttribute("href", "/retrospectives/sample-visible-state");
  });

  it("offers useful empty states without reporting a service failure", () => {
    const empty = { items: [], unavailable: false };
    render(
      <HomeHighlightsView
        highlights={{ projects: empty, skills: empty, writing: empty }}
      />,
    );
    expect(screen.getByText(/No featured projects/)).toBeVisible();
    expect(
      screen.getByText(/No skills with linked project evidence/),
    ).toBeVisible();
    expect(screen.getByText(/No writing is published/)).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Browse all projects/ }),
    ).toHaveAttribute("href", "/projects");
  });

  it("shows safe retry links and does not confuse failures with empty content", () => {
    const unavailable = { items: [], unavailable: true };
    const highlights: HomeHighlights = {
      projects: unavailable,
      skills: unavailable,
      writing: unavailable,
    };
    render(<HomeHighlightsView highlights={highlights} />);
    expect(screen.getAllByRole("status")).toHaveLength(3);
    expect(
      screen.queryByText(/No writing is published/),
    ).not.toBeInTheDocument();
    for (const link of screen.getAllByRole("link", {
      name: "Reload the overview",
    })) {
      expect(link).toHaveAttribute("href", "/");
    }
  });
});

describe("About and Contact", () => {
  it("describes confirmed background and labels fictional case studies", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "About" }),
    ).toBeVisible();
    expect(
      screen.getByText(/Android and iOS are my development background/),
    ).toBeVisible();
    expect(screen.getByText(/fictional examples/)).toBeVisible();
  });

  it("labels sample contact links and renders no submission form", () => {
    const { container } = render(<ContactPage />);
    expect(
      screen.getByRole("link", { name: "hello@example.com (sample email)" }),
    ).toHaveAttribute("href", "mailto:hello@example.com");
    expect(
      screen.getByRole("link", {
        name: "Visit the sample profile destination",
      }),
    ).toHaveAttribute("href", "https://example.com");
    expect(screen.getByText(/not a monitored inbox/)).toBeVisible();
    expect(container.querySelector("form")).toBeNull();
  });
});

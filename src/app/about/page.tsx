import type { Metadata } from "next";
import Link from "next/link";

import { PageIntroduction } from "@/shared/ui/page-introduction";

export const metadata: Metadata = {
  title: "About",
  description:
    "ChanQ is an Android and iOS developer interested in React, React Native, Next.js, Docker, and proportional Clean Architecture.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="profile-page">
      <PageIntroduction
        description="I'm ChanQ, a native app developer working with Android and iOS. I'm interested in bringing that perspective to React and Next.js: clear interactions, explicit state, and software that is easier to change."
        eyebrow="Background & direction"
        title="About"
      />
      <section className="profile-section" aria-labelledby="background">
        <h2 id="background">A native development foundation</h2>
        <p>
          Android and iOS are my development background. My current interests
          include React, React Native, Next.js, Docker, and Clean Architecture.
        </p>
        <p>
          This portfolio is a place to connect implementation choices to their
          reasons. The current project stories are fictional examples for
          exploring that format; they do not represent employers, clients, or
          shipped products.
        </p>
      </section>
      <section className="profile-section" aria-labelledby="working-principles">
        <h2 id="working-principles">How I approach the work</h2>
        <ul className="principles-list">
          <li>
            <h3>Start with the problem</h3>
            <p>
              Define the user need, constraints, and an observable result before
              choosing tools.
            </p>
          </li>
          <li>
            <h3>Keep boundaries proportional</h3>
            <p>
              Separate rules from frameworks where it makes change or testing
              easier. Keep simple read paths simple.
            </p>
          </li>
          <li>
            <h3>Make decisions reviewable</h3>
            <p>
              Record alternatives, test important failure paths, and distinguish
              verified behavior from assumptions.
            </p>
          </li>
        </ul>
      </section>
      <section className="profile-section" aria-labelledby="current-focus">
        <h2 id="current-focus">Current focus</h2>
        <p>
          This portfolio explores Next.js Server Components, PostgreSQL content,
          accessible navigation, and a repeatable local Docker workflow. React
          Native remains an area of interest for work that benefits from mobile
          capabilities.
        </p>
        <div className="page-actions">
          <Link className="text-link" href="/projects">
            Explore the case-study examples
          </Link>
          <Link className="text-link" href="/contact">
            Find contact options
          </Link>
        </div>
      </section>
    </div>
  );
}

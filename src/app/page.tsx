import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getHomeHighlights } from "@/app/_composition/home";
import { HomeHighlightsView } from "@/features/content/home";
import { PageIntroduction } from "@/shared/ui/page-introduction";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Native apps, thoughtful systems",
  description:
    "An Android and iOS developer exploring React, Next.js, and clear architecture. Browse sample case studies, technical writing, and skills in context.",
  alternates: { canonical: "/" },
};

async function Highlights() {
  return <HomeHighlightsView highlights={await getHomeHighlights()} />;
}

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-label="Introduction">
        <PageIntroduction
          description="I'm ChanQ, an Android and iOS developer exploring React, Next.js, and the systems behind useful products. This preview connects sample project decisions with the skills and lessons behind them."
          eyebrow="Native roots. Web in progress."
          title="Native apps, thoughtful systems."
        />
        <div className="page-actions">
          <Link className="action-link" href="/projects">
            Explore project work <span aria-hidden="true">→</span>
          </Link>
          <Link className="text-link" href="/about">
            More about me
          </Link>
        </div>
      </section>
      <Suspense
        fallback={
          <p className="home-notice" role="status">
            Loading projects, skills, and writing…
          </p>
        }
      >
        <Highlights />
      </Suspense>
      <section aria-labelledby="home-contact" className="contact-invitation">
        <p className="page-introduction__eyebrow">Start a conversation</p>
        <h2 id="home-contact">Have a problem worth exploring?</h2>
        <p>
          Share the context, constraints, and what a useful outcome would look
          like.
        </p>
        <Link className="action-link" href="/contact">
          Contact options <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}

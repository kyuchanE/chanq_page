import type { Metadata } from "next";
import Link from "next/link";

import { PageIntroduction } from "@/shared/ui/page-introduction";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Preview contact options for project discussions, with clearly labeled example destinations.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="profile-page">
      <PageIntroduction
        description="For a project discussion, start with the problem, the people it affects, and the constraints you already know. These example contact options demonstrate the page while real public details are being prepared."
        eyebrow="Get in touch"
        title="Contact"
      />
      <section className="profile-section" aria-labelledby="contact-options">
        <h2 id="contact-options">Contact options</h2>
        <p id="example-contact-note" className="home-notice">
          Sample destinations only. The email address is not a monitored inbox,
          and the profile link is an example website.
        </p>
        <ul className="contact-options" aria-describedby="example-contact-note">
          <li>
            <h3>Email example</h3>
            <a className="text-link" href="mailto:hello@example.com">
              hello@example.com (sample email)
            </a>
            <p>
              Opens your email application. No message is sent by this website.
            </p>
          </li>
          <li>
            <h3>Profile example</h3>
            <a className="text-link" href="https://example.com">
              Visit the sample profile destination
            </a>
            <p>A demonstration link, not a personal profile.</p>
          </li>
        </ul>
      </section>
      <section
        className="profile-section"
        aria-labelledby="conversation-context"
      >
        <h2 id="conversation-context">Useful context for a conversation</h2>
        <p>
          A short introduction, the problem you want to solve, your platform,
          and any timing constraints are a helpful starting point. Avoid sharing
          credentials or private customer information.
        </p>
        <Link className="text-link" href="/projects">
          Explore project examples first
        </Link>
      </section>
    </div>
  );
}

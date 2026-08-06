import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact details and links to professional profiles.",
};

export default function ContactPage() {
  return (
    <main>
      <h1>Contact</h1>
      <p>
        This section will provide contact details and links to professional
        profiles.
      </p>
    </main>
  );
}

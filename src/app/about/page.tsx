import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "An introduction to the developer's background, working principles, and current interests.",
};

export default function AboutPage() {
  return (
    <main>
      <h1>About</h1>
      <p>
        This section will introduce the developer&apos;s background, working
        principles, and current interests.
      </p>
    </main>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Retrospectives",
  description:
    "Lessons learned from development, troubleshooting, and collaboration.",
};

export default function RetrospectivesPage() {
  return (
    <main>
      <h1>Retrospectives</h1>
      <p>
        This section will document lessons learned from development,
        troubleshooting, and collaboration.
      </p>
    </main>
  );
}

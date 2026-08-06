import type { Metadata } from "next";

import { PublicShell } from "@/app/_components/public-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ChanQ Developer Portfolio",
    template: "%s | ChanQ Developer Portfolio",
  },
  description:
    "A developer portfolio focused on practical experience, problem solving, and technical decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}

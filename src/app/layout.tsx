import type { Metadata } from "next";
import localFont from "next/font/local";

import { PublicShell } from "@/app/_components/public-shell";

import "./globals.css";

const neoDunggeunmoCode = localFont({
  src: "./fonts/neodgm-code-v1.601.woff2",
  variable: "--font-neodunggeunmo-code",
  display: "swap",
  fallback: ["monospace"],
  adjustFontFallback: false,
  weight: "400",
  style: "normal",
});

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
    <html className={neoDunggeunmoCode.variable} lang="en">
      <body>
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}

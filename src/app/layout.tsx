import type { Metadata } from "next";
import localFont from "next/font/local";

import { PublicShell } from "@/app/_components/public-shell";

import "./globals.css";

const d2Coding = localFont({
  src: [
    {
      path: "./fonts/d2coding-v1.3.3-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/d2coding-v1.3.3-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-d2-coding",
  display: "swap",
  fallback: ["monospace"],
  adjustFontFallback: false,
});

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
    <html
      className={`${d2Coding.variable} ${neoDunggeunmoCode.variable}`}
      lang="en"
    >
      <body>
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}

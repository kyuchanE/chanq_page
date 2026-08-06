import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}

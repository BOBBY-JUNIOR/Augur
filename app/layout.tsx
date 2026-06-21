import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Augur — Multi-Signal Trading Agent",
  description:
    "Five signals. One vote. No emotion. Augur reads five Bitget Skill Hub signals, weights them by who has been right, switches strategy by market regime, and logs every decision as a verifiable record.",
  metadataBase: new URL("https://example.vercel.app"),
  openGraph: {
    title: "Augur — Multi-Signal Trading Agent",
    description:
      "Five signals. One vote. No emotion. Weighted multi-skill consensus + regime switching + self-correcting weights, built on Bitget Skill Hub.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <Nav />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Adaptive Consensus Trading Agent",
  description:
    "An AI trading agent that fuses five Bitget Skill Hub signals into a self-correcting weighted consensus, switches strategy by market regime, and logs every decision as a verifiable paper-trading record.",
  metadataBase: new URL("https://example.vercel.app"),
  openGraph: {
    title: "Adaptive Consensus Trading Agent",
    description:
      "Weighted multi-skill consensus + regime switching + self-correcting weights. Built on Bitget Skill Hub for the Bitget AI Hackathon.",
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
      <body className="min-h-screen bg-ink antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}

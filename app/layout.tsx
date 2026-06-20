import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Augur — Multi-Signal Trading Agent",
  description:
    "Augur reads five Bitget Skill Hub signals, fuses them into a self-correcting weighted consensus, switches strategy by market regime, and logs every decision as a verifiable paper-trading record. Reads the signs. Explains the call.",
  metadataBase: new URL("https://example.vercel.app"),
  openGraph: {
    title: "Augur — Multi-Signal Trading Agent",
    description:
      "Reads the signs. Explains the call. Weighted multi-skill consensus + regime switching + self-correcting weights, built on Bitget Skill Hub.",
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

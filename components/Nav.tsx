"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/logs", label: "Trade Log" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-oxblood/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <Logo className="h-6 w-6" />
          <span className="font-display text-lg tracking-tight text-cream">
            Augur
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  active
                    ? "text-amber"
                    : "text-faint hover:text-cream"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
